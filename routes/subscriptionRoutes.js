const express = require('express');
const router = express.Router();

const {
  getPlans,
  getPaymentInfo,
  getCurrentSubscription,
  submitPayment,
  getMySubscriptions,
  getAllPending,
  approveSubscription,
  rejectSubscription,
} = require('../controllers/subscriptionController');

const { protect, adminOnly } = require('../middleware/auth');

router.get('/plans', getPlans);
router.get('/payment-info', protect, getPaymentInfo);

router.get('/current', protect, getCurrentSubscription);
router.get('/my', protect, getMySubscriptions);
router.post('/submit', protect, submitPayment);

router.get('/admin/pending', protect, adminOnly, getAllPending);
router.put('/admin/:id/approve', protect, adminOnly, approveSubscription);
router.put('/admin/:id/reject', protect, adminOnly, rejectSubscription);

module.exports = router;
