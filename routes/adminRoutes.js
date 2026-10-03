const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllStores,
  getAllUsers,
  getAllOrders,
  getAllSubscriptions,
  approveSubscription,
  rejectSubscription
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes - protected
router.get('/stats', protect, getStats);
router.get('/stores', protect, getAllStores);
router.get('/users', protect, getAllUsers);
router.get('/orders', protect, getAllOrders);
router.get('/subscriptions', protect, getAllSubscriptions);
router.put('/subscriptions/:id/approve', protect, approveSubscription);
router.put('/subscriptions/:id/reject', protect, rejectSubscription);

module.exports = router;