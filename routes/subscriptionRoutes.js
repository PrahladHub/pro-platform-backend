const express = require('express');
const router = express.Router();
const {
  getPlans,
  getCurrentSubscription,
  submitPayment,
  getMySubscriptions,
  getAllPending,
  approveSubscription,
  rejectSubscription,
} = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.get('/plans', getPlans);

// User routes
router.get('/current', protect, getCurrentSubscription);
router.get('/my', protect, getMySubscriptions);
router.post('/submit', protect, adminOnly, submitPayment);

// Platform admin routes
router.get('/admin/pending', protect, adminOnly, getAllPending);
router.put('/admin/:id/approve', protect, adminOnly, approveSubscription);
router.put('/admin/:id/reject', protect, adminOnly, rejectSubscription);

module.exports = router;