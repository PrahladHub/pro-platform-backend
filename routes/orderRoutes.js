const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// Public — customer order kare
router.post('/', createOrder);

// Admin — order view/update
router.get('/', protect, adminOnly, getOrders);
router.get('/:id', protect, adminOnly, getOrder);
router.put('/:id', protect, adminOnly, updateOrderStatus);

module.exports = router;