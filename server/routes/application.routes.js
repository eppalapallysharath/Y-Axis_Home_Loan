const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
  validateCreateApplication,
  validateUpdateApplication,
  validateStageTransition,
} = require('../middleware/validateApplication');

const {
  list,
  create,
  getById,
  update,
  assign,
  stageTransition,
} = require('../controllers/applicationController');

const workItemRoutes = require('./workItem.routes');
const activityRoutes = require('./activity.routes');
const { addNote } = require('../controllers/activityController');

// All routes require authentication
router.use(requireAuth);

// Work Item sub-routes
router.use('/:appId/work-items', workItemRoutes);

// Activity sub-routes & notes
router.use('/:appId/activity', activityRoutes);
router.post('/:appId/notes', addNote);

router.get('/', list);
router.post('/', validateCreateApplication, create);
router.get('/:id', getById);
router.patch('/:id', validateUpdateApplication, update);
router.patch('/:id/stage', validateStageTransition, stageTransition);

// Assign route restricted to ADMIN and MANAGER
router.patch('/:id/assign', requireRole('ADMIN', 'MANAGER'), assign);

module.exports = router;


