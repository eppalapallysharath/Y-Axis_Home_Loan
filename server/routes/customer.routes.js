const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const requireAuth = require('../middleware/requireAuth');
const requireTeamScope = require('../middleware/requireTeamScope');
const {
  validateCreateCustomer,
  validateUpdateCustomer,
} = require('../middleware/validators/customerValidator');

// Apply authentication middleware to all customer routes
router.use(requireAuth);
router.use(requireTeamScope);

router.get('/', customerController.list);
router.post('/', validateCreateCustomer, customerController.create);
router.get('/:id', customerController.getById);
router.patch('/:id', validateUpdateCustomer, customerController.update);

module.exports = router;
