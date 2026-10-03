const Store = require('../models/Store');

// @desc    Detect store from header, query, or subdomain
exports.detectStore = async (req, res, next) => {
  try {
    let slug;

    // 1. Check header first (for local development)
    if (req.headers['x-store-slug']) {
      slug = req.headers['x-store-slug'];
    }

    // 2. Check query param (?store=priya)
    if (!slug && req.query.store) {
      slug = req.query.store;
    }

    // 3. Check subdomain (for production)
    if (!slug) {
      const host = req.headers.host || '';
      const hostParts = host.split('.');
      if (hostParts.length > 2 && hostParts[0] !== 'www') {
        slug = hostParts[0];
      }
    }

    console.log('🔍 detectStore: slug =', slug);

    if (!slug) {
      // No slug provided — just continue (route will handle)
      console.log('⚠️ detectStore: No slug found');
      req.store = null;
      req.storeId = null;
      return next();
    }

    // Find store by slug
    const store = await Store.findOne({ slug, isActive: true });

    console.log('🔍 detectStore: store found =', store ? store.name : 'null');

    if (!store) {
      console.log('❌ detectStore: Store not found for slug:', slug);
      req.store = null;
      req.storeId = null;
      return next();
    }

    req.store = store;
    req.storeId = store._id;

    console.log('✅ detectStore: Store ID attached =', req.storeId);

    next();
  } catch (error) {
    console.log('❌ detectStore ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Store detection error: ' + error.message,
    });
  }
};

// @desc    Check product limit based on plan
exports.checkProductLimit = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store not found',
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const productCount = await Product.countDocuments({ storeId });

    if (productCount >= store.productLimit) {
      return res.status(403).json({
        success: false,
        message: `Product limit reached (${store.productLimit}). Please upgrade your plan.`,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};