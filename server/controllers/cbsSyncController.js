const { prisma } = require('../config/db');
const { buildApplicationScope } = require('../utils/buildApplicationScope');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const cbsService = require('../services/cbsIntegrationService');

/**
 * GET /api/v1/sync-jobs
 * List all CBS sync jobs (paginated, status-filterable, team-scoped for MANAGER)
 */
const list = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const { user } = req;

    const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });
    const appScope = buildApplicationScope(user);

    const where = {
      application: appScope,
      ...(status && status !== 'ALL' && { status }),
    };

    const [jobs, total] = await Promise.all([
      prisma.cbsSyncJob.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          application: {
            select: {
              id: true,
              stage: true,
              priority: true,
              applicationType: true,
              loanAmount: true,
              cbsSyncStatus: true,
              updatedAt: true,
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  panNumber: true,
                  email: true,
                  phone: true,
                },
              },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.cbsSyncJob.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: jobs,
      pagination: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/sync-jobs/stats
 * Summary stats for CBS Health dashboard widget
 */
const getStats = async (req, res, next) => {
  try {
    const { user } = req;
    const appScope = buildApplicationScope(user);

    const where = { application: appScope };

    const [total, success, pending, inProgress, failed, exhausted] = await Promise.all([
      prisma.cbsSyncJob.count({ where }),
      prisma.cbsSyncJob.count({ where: { ...where, status: 'SUCCESS' } }),
      prisma.cbsSyncJob.count({ where: { ...where, status: 'PENDING' } }),
      prisma.cbsSyncJob.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.cbsSyncJob.count({ where: { ...where, status: 'FAILED' } }),
      prisma.cbsSyncJob.count({ where: { ...where, status: 'EXHAUSTED' } }),
    ]);

    res.json({
      status: 'success',
      data: {
        total,
        success,
        pending,
        inProgress,
        failed,
        exhausted,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/sync-jobs/:applicationId
 * Get sync job detail for a specific application
 */
const getById = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.applicationId, 10);
    const { user } = req;
    const appScope = buildApplicationScope(user);

    const job = await prisma.cbsSyncJob.findFirst({
      where: {
        applicationId,
        application: appScope,
      },
      include: {
        application: {
          include: {
            customer: true,
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: `CBS Sync Job not found for application #${applicationId}`,
      });
    }

    res.json({
      status: 'success',
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/sync-jobs/:applicationId/retry
 * Manually re-trigger CBS sync for a FAILED or EXHAUSTED job (ADMIN only)
 */
const manualRetry = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.applicationId, 10);

    const job = await prisma.cbsSyncJob.findUnique({
      where: { applicationId },
    });

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: `CBS Sync Job not found for application #${applicationId}`,
      });
    }

    if (job.status === 'SUCCESS') {
      return res.status(422).json({
        status: 'error',
        error: 'AlreadySynced',
        message: 'This application has already been successfully synced to CBS.',
      });
    }

    if (job.status === 'IN_PROGRESS') {
      return res.status(422).json({
        status: 'error',
        error: 'SyncInProgress',
        message: 'A CBS sync attempt is currently in progress. Please wait.',
      });
    }

    // Reset job for manual retry (increment maxAttempts if EXHAUSTED to allow another attempt)
    const isExhausted = job.status === 'EXHAUSTED';
    await prisma.cbsSyncJob.update({
      where: { applicationId },
      data: {
        status: 'PENDING',
        nextRetryAt: null,
        lastError: null,
        ...(isExhausted && { maxAttempts: job.maxAttempts + 1 }),
      },
    });

    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: { cbsSyncStatus: 'PENDING' },
    });

    // Fire-and-forget background execution
    cbsService.triggerSync(applicationId).catch((err) => {
      console.error(`[CBS] Manual retry dispatch failed for app #${applicationId}:`, err.message);
    });

    res.json({
      status: 'success',
      message: `CBS sync manually triggered for application #${applicationId}. Check activity log for progress.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getStats,
  getById,
  manualRetry,
};
