const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (store detected in controller)
// ============================================

// GET /api/products - Get all products for a store
router.get('/', getProducts);

// GET /api/products/:id - Get single product
router.get('/:id', getProduct);

// ============================================
// ADMIN ROUTES
// ============================================

router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;