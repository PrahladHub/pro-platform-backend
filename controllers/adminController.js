const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');

// @desc    Platform stats (Super Admin)
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStores = await Store.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSubscriptions = await Subscription.countDocuments({
      status: 'approved',
    });

    // Total revenue from orders
    const orderRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Total subscription revenue
    const subRevenue = await Subscription.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
        totalSubscriptions,
        orderRevenue: orderRevenue[0]?.total || 0,
        subscriptionRevenue: subRevenue[0]?.total || 0,
        totalRevenue:
          (orderRevenue[0]?.total || 0) + (subRevenue[0]?.total || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All stores
// @route   GET /api/admin/stores
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('owner', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: stores.length, stores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('storeId', 'name slug')
      .sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All orders
// @route   GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('storeId', 'name slug')
      .sort('-createdAt')
      .limit(100);
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    All pending subscriptions
// @route   GET /api/admin/subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find()
      .populate('storeId', 'name slug plan')
      .populate('userId', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: subs.length, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve subscription
// @route   PUT /api/admin/subscriptions/:id/approve
exports.approveSubscription = async (req, res) => {
  try {
    const plans = require('../config/plans');
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const planConfig = plans[subscription.plan];
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + planConfig.duration * 24 * 60 * 60 * 1000
    );

    subscription.status = 'approved';
    subscription.startedAt = now;
    subscription.expiresAt = expiresAt;
    await subscription.save();

    const store = await Store.findById(subscription.storeId);
    if (store) {
      store.plan = subscription.plan;
      store.planStartedAt = now;
      store.planExpiresAt = expiresAt;
      store.productLimit = planConfig.productLimit;
      await store.save();
    }

    res.json({
      success: true,
      message: 'Subscription approved',
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject subscription
// @route   PUT /api/admin/subscriptions/:id/reject
exports.rejectSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({
      success: true,
      message: 'Subscription rejected',
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};