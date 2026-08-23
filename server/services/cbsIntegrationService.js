const axios = require('axios');
const { prisma } = require('../config/db');
const activityService = require('./activityService');
const envConfig = require('../config/env.config');
const { calculateBackoffMs } = require('../utils/calculateBackoff');

let SYSTEM_USER_ID = null;

/**
 * Get or cache the System User ID used for automated system logging
 */
const getSystemUserId = async () => {
  if (SYSTEM_USER_ID) return SYSTEM_USER_ID;
  const systemUser = await prisma.user.findUnique({ where: { email: 'system@internal' } });
  if (!systemUser) {
    // Fallback to first ADMIN user if system user missing
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('System user not seeded. Please run database seed.');
    SYSTEM_USER_ID = adminUser.id;
    return SYSTEM_USER_ID;
  }
  SYSTEM_USER_ID = systemUser.id;
  return SYSTEM_USER_ID;
};

/**
 * Constructs standard CBS sync JSON payload
 */
const buildCbsPayload = (application) => ({
  applicationId: application.id,
  customerId: application.customerId,
  customerName: application.customer?.fullName || 'N/A',
  panNumber: application.customer?.panNumber || 'N/A',
  loanType: application.applicationType,
  loanAmount: application.loanAmount,
  propertyAddress: application.propertyAddress || '',
  propertyValue: application.propertyValue || null,
  sanctionedAt: (application.updatedAt || new Date()).toISOString(),
});

/**
 * Triggers a CBS sync attempt for an application
 * @param {number} applicationId
 */
const triggerSync = async (applicationId) => {
  const appId = parseInt(applicationId, 10);
  const systemUserId = await getSystemUserId();

  const job = await prisma.cbsSyncJob.findUnique({
    where: { applicationId: appId },
    include: {
      application: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!job) {
    console.warn(`[CBS] No sync job found for application #${appId}`);
    return;
  }

  // Idempotency check: Skip if already SUCCESS or IN_PROGRESS
  if (job.status === 'SUCCESS') {
    console.log(`[CBS] Application #${appId} already synced successfully. Skipping.`);
    return;
  }
  if (job.status === 'IN_PROGRESS') {
    console.log(`[CBS] Application #${appId} sync already in progress. Skipping.`);
    return;
  }

  // Atomic pessimistic locking using updateMany to prevent concurrent worker execution
  const lockResult = await prisma.cbsSyncJob.updateMany({
    where: {
      applicationId: appId,
      status: { in: ['PENDING', 'FAILED', 'EXHAUSTED'] },
    },
    data: {
      status: 'IN_PROGRESS',
      lastAttemptAt: new Date(),
    },
  });

  if (lockResult.count === 0) {
    console.log(`[CBS] Concurrent sync attempt detected for app #${appId}. Skipping.`);
    return;
  }

  // Log CBS_SYNC_INITIATED
  await activityService.log({
    applicationId: appId,
    userId: systemUserId,
    action: 'CBS_SYNC_INITIATED',
    metadata: { syncJobId: job.id, attempt: job.attempts + 1 },
  });

  const startTime = Date.now();

  try {
    const payload = buildCbsPayload(job.application);
    const cbsUrl = `${envConfig.cbsBaseUrl}/sync`;

    const response = await axios.post(cbsUrl, payload, {
      timeout: envConfig.cbsTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    const durationMs = Date.now() - startTime;

    // Transaction to update job status & application status to SUCCESS
    await prisma.$transaction([
      prisma.cbsSyncJob.update({
        where: { applicationId: appId },
        data: {
          status: 'SUCCESS',
          attempts: job.attempts + 1,
          lastError: null,
          nextRetryAt: null,
        },
      }),
      prisma.loanApplication.update({
        where: { id: appId },
        data: { cbsSyncStatus: 'SUCCESS' },
      }),
    ]);

    await activityService.log({
      applicationId: appId,
      userId: systemUserId,
      action: 'CBS_SYNC_SUCCESS',
      metadata: {
        syncJobId: job.id,
        attempt: job.attempts + 1,
        durationMs,
        cbsRef: response.data?.cbsRef || null,
      },
    });

    console.log(`[CBS] ✅ Application #${appId} synced successfully in ${durationMs}ms`);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const newAttempts = job.attempts + 1;
    const maxAttempts = job.maxAttempts || envConfig.cbsMaxAttempts;
    const isExhausted = newAttempts >= maxAttempts;

    const errorMessage =
      err.code === 'ECONNABORTED'
        ? `Timeout after ${envConfig.cbsTimeoutMs}ms`
        : err.response?.data?.message || err.message || 'Unknown CBS integration error';

    const nextRetryAt = isExhausted
      ? null
      : new Date(Date.now() + calculateBackoffMs(newAttempts));

    const newStatus = isExhausted ? 'EXHAUSTED' : 'FAILED';

    await prisma.$transaction([
      prisma.cbsSyncJob.update({
        where: { applicationId: appId },
        data: {
          status: newStatus,
          attempts: newAttempts,
          lastError: errorMessage.substring(0, 1000),
          nextRetryAt,
        },
      }),
      prisma.loanApplication.update({
        where: { id: appId },
        data: { cbsSyncStatus: newStatus },
      }),
    ]);

    const activityAction = isExhausted ? 'CBS_SYNC_EXHAUSTED' : 'CBS_SYNC_FAILED';
    await activityService.log({
      applicationId: appId,
      userId: systemUserId,
      action: activityAction,
      metadata: {
        syncJobId: job.id,
        attempt: newAttempts,
        errorMessage,
        durationMs,
        nextRetryAt: nextRetryAt ? nextRetryAt.toISOString() : null,
        totalAttempts: isExhausted ? newAttempts : undefined,
      },
    });

    console.error(
      `[CBS] ❌ Application #${appId} sync ${isExhausted ? 'EXHAUSTED' : 'FAILED'} (attempt ${newAttempts}/${maxAttempts}): ${errorMessage}`
    );
  }
};

module.exports = {
  triggerSync,
  buildCbsPayload,
};
