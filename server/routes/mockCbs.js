const express = require('express');
const router = express.Router();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Weighted random scenario picker
 * Success: 50% | ServerError: 20% | Unavailable: 15% | SlowSuccess: 10% | Timeout: 5%
 */
function pickScenario(overrideScenario) {
  if (overrideScenario) return overrideScenario;

  const rand = Math.random();
  if (rand < 0.50) return 'SUCCESS';
  if (rand < 0.70) return 'SERVER_ERROR';
  if (rand < 0.85) return 'SERVICE_UNAVAILABLE';
  if (rand < 0.95) return 'SLOW_SUCCESS';
  return 'TIMEOUT';
}

/**
 * POST /mock-cbs/sync
 * Simulates Core Banking System (CBS) loan record ingestion endpoint.
 */
router.post('/sync', async (req, res) => {
  const overrideHeader = req.headers['x-mock-cbs-scenario'];
  const scenario = pickScenario(overrideHeader);
  const applicationId = req.body?.applicationId;

  console.log(`[MockCBS] Processing scenario: ${scenario} for applicationId: ${applicationId}`);

  switch (scenario) {
    case 'SUCCESS':
      return res.status(200).json({
        status: 'accepted',
        cbsRef: `CBS-${Date.now()}`,
        message: 'Loan record ingested successfully',
        timestamp: new Date().toISOString(),
      });

    case 'SERVER_ERROR':
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error — CBS processing failed',
      });

    case 'SERVICE_UNAVAILABLE':
      return res.status(503).json({
        status: 'unavailable',
        message: 'CBS is temporarily unavailable. Try again later.',
      });

    case 'SLOW_SUCCESS':
      // 8 seconds delay — under default 10s timeout
      await delay(8000);
      return res.status(200).json({
        status: 'accepted',
        cbsRef: `CBS-SLOW-${Date.now()}`,
        message: 'Loan record ingested (slow path)',
        timestamp: new Date().toISOString(),
      });

    case 'TIMEOUT':
    default:
      // 15 seconds delay — triggers client axios 10s timeout
      await delay(15000);
      if (!res.headersSent) {
        return res.status(504).json({
          status: 'timeout',
          message: 'Gateway Timeout — CBS response delayed beyond threshold',
        });
      }
      return;
  }
});

module.exports = router;
