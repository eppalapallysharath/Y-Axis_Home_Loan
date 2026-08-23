const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/requireAuth');
const {
  validateCreateWorkItem,
  validateUpdateWorkItem,
} = require('../middleware/validateWorkItem');
const {
  list,
  create,
  bulkCreate,
  update,
  remove,
} = require('../controllers/workItemController');

// Require authentication on all work item routes
router.use(requireAuth);

router.get('/', list);
router.post('/', validateCreateWorkItem, create);
router.post('/bulk', bulkCreate);
router.patch('/:itemId', validateUpdateWorkItem, update);
router.delete('/:itemId', remove);

module.exports = router;
