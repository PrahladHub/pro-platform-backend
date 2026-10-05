const Product = require('../models/Product');
const Store = require('../models/Store');

// @desc    Get all products for a store
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const storeSlug = req.headers['x-store-slug'] || req.query.store;

    if (!storeSlug) {
      return res.json({
        success: true,
        count: 0,
        products: [],
      });
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const products = await Product.find({
      storeId: store._id,
      isActive: true,
    }).sort('-createdAt');

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new product (Admin only)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const store = await Store.findById(storeId);
    const productCount = await Product.countDocuments({ storeId });

    if (productCount >= store.productLimit) {
      return res.status(403).json({
        success: false,
        message: `Product limit reached (${store.productLimit}). Please upgrade your plan.`,
      });
    }

    const product = await Product.create({
      ...req.body,
      storeId,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated',
      product: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};