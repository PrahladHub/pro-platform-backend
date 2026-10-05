const Order = require('../models/Order');
const Store = require('../models/Store');

// @desc    Create order (Public - customer)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const storeSlug = req.headers['x-store-slug'];

    if (!storeSlug) {
      return res.status(400).json({
        success: false,
        message: 'Store not specified',
      });
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const orderData = {
      ...req.body,
      storeId: store._id,
      orderNumber: `ORD-${Date.now()}`,
    };

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.error('Order create error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all orders (Admin - store owner)
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found',
      });
    }

    const orders = await Order.find({ storeId }).sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    order.status = req.body.status || order.status;
    await order.save();

    res.json({
      success: true,
      message: 'Order updated',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};