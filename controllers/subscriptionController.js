const Subscription = require('../models/Subscription');
const Store = require('../models/Store');
const plans = require('../config/plans');

// @desc    Get available plans
// @route   GET /api/subscriptions/plans
exports.getPlans = async (req, res) => {
  res.json({ success: true, plans });
};

// @desc    Get current subscription
// @route   GET /api/subscriptions/current
exports.getCurrentSubscription = async (req, res) => {
  try {
    const store = await Store.findById(req.user.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({
      success: true,
      currentPlan: store.plan,
      planStartedAt: store.planStartedAt,
      planExpiresAt: store.planExpiresAt,
      isExpired: store.isPlanExpired ? store.isPlanExpired() : false,
      productLimit: store.productLimit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit payment (user clicks "I've paid")
// @route   POST /api/subscriptions/submit
// ===== SUBMIT PAYMENT =====
exports.submitPayment = async (req, res) => {
  try {
    console.log('SUBMIT BODY:', req.body);
    console.log('SUBMIT FILE:', req.file);
    console.log('SUBMIT USER:', req.user);

    const { planId, planName, amount } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId zaroori hai' });
    }

    // Screenshot URL from upload middleware (agar cloudinary use kiya)
    const screenshotUrl = req.file ? req.file.path : (req.body.screenshot || '');

    const Subscription = require('../models/Subscription');

    const subscription = await Subscription.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Unknown',
      userEmail: req.user ? req.user.email : '',
      planId,
      planName: planName || planId,
      amount: Number(amount) || 0,
      screenshot: screenshotUrl,
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Payment proof submit ho gaya! Admin approve karega.',
      subscription,
    });
  } catch (error) {
    console.error('submitPayment ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Get my subscriptions
// @route   GET /api/subscriptions/my
exports.getMySubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id }).sort('-createdAt');
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// ADMIN - Only for platform owner
// ============================================

// @desc    Get all pending subscriptions
// @route   GET /api/subscriptions/admin/pending
exports.getAllPending = async (req, res) => {
  try {
    const subs = await Subscription.find({ status: 'pending' })
      .populate('storeId', 'name slug')
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve subscription
// @route   PUT /api/subscriptions/admin/:id/approve
exports.approveSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const planConfig = plans[subscription.plan];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + planConfig.duration * 24 * 60 * 60 * 1000);

    subscription.status = 'approved';
    subscription.startedAt = now;
    subscription.expiresAt = expiresAt;
    await subscription.save();

    const store = await Store.findById(subscription.storeId);
    store.plan = subscription.plan;
    store.planStartedAt = now;
    store.planExpiresAt = expiresAt;
    store.productLimit = planConfig.productLimit;
    await store.save();

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
// @route   PUT /api/subscriptions/admin/:id/reject
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