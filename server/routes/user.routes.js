const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.post(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  userController.createUser
);

router.get(
  '/users',
  requireAuth,
  userController.listUsers
);

router.get(
  '/',
  requireAuth,
  userController.listUsers
);

router.get(
  '/teams',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  userController.listTeams
);

module.exports = router;
