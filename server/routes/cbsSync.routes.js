const express = require('express');
const router = express.Router();
const cbsSyncController = require('../controllers/cbsSyncController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// All routes require authentication and ADMIN or MANAGER role
router.use(requireAuth);
router.use(requireRole('ADMIN', 'MANAGER'));

// GET /api/v1/sync-jobs
router.get('/', cbsSyncController.list);

// GET /api/v1/sync-jobs/stats
router.get('/stats', cbsSyncController.getStats);

// GET /api/v1/sync-jobs/:applicationId
router.get('/:applicationId', cbsSyncController.getById);

// POST /api/v1/sync-jobs/:applicationId/retry (ADMIN only)
router.post('/:applicationId/retry', requireRole('ADMIN'), cbsSyncController.manualRetry);

module.exports = router;
