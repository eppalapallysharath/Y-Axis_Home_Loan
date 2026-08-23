const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/requireAuth');
const { list, addNote } = require('../controllers/activityController');

router.use(requireAuth);

// GET /api/v1/applications/:appId/activity (also mounted as /api/v1/applications/:appId/activity)
router.get('/', list);

// POST /api/v1/applications/:appId/notes or POST /api/v1/applications/:appId/activity/notes
router.post('/notes', addNote);

module.exports = router;
