const express = require('express');
const router = express.Router();

const {
  getStats,
  getAllStores,
  getAllUsers,
  getAllOrders,
  getAllSubscriptions,
  approveSubscription,
  rejectSubscription,
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/stores', getAllStores);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.get('/subscriptions', getAllSubscriptions);
router.put('/subscriptions/:id/approve', approveSubscription);
router.put('/subscriptions/:id/reject', rejectSubscription);

module.exports = router;
