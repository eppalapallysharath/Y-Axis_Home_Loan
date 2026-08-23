const { prisma } = require('../config/db');
const cbsService = require('../services/cbsIntegrationService');
const envConfig = require('../config/env.config');

const WORKER_INTERVAL_MS = envConfig.cbsRetryWorkerInterval || 60000;

let workerTimer = null;
let isProcessing = false;

/**
 * Executes one iteration of the CBS retry worker
 */
const runRetryWorker = async () => {
  if (isProcessing) {
    console.log('[CBSWorker] Worker loop already running. Skipping tick.');
    return;
  }

  isProcessing = true;

  try {
    const eligibleJobs = await prisma.cbsSyncJob.findMany({
      where: {
        status: 'FAILED',
        nextRetryAt: { lte: new Date() },
        attempts: { lt: envConfig.cbsMaxAttempts || 4 },
      },
      select: {
        applicationId: true,
        attempts: true,
        nextRetryAt: true,
      },
    });

    if (eligibleJobs.length > 0) {
      console.log(`[CBSWorker] Found ${eligibleJobs.length} job(s) eligible for retry`);

      for (const job of eligibleJobs) {
        console.log(`[CBSWorker] Retrying sync for applicationId: #${job.applicationId} (attempt ${job.attempts + 1})`);
        await cbsService.triggerSync(job.applicationId);

        // Small delay between retries to avoid bursting
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  } catch (err) {
    console.error('[CBSWorker] Retry worker execution error:', err.message);
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the retry worker as a background polling loop
 */
const startRetryWorker = () => {
  console.log(`[CBSWorker] Starting background polling — interval: ${WORKER_INTERVAL_MS / 1000}s`);
  workerTimer = setInterval(runRetryWorker, WORKER_INTERVAL_MS);

  // Run once immediately on startup to pick up leftover jobs
  runRetryWorker();
};

/**
 * Stop the background retry worker
 */
const stopRetryWorker = () => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    console.log('[CBSWorker] Retry worker stopped');
  }
};

module.exports = {
  startRetryWorker,
  stopRetryWorker,
  runRetryWorker,
};
