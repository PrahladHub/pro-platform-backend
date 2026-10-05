const Subscription = require('../models/Subscription');
const Store = require('../models/Store');
const plans = require('../config/plans');

const getPlanConfig = (planId) => {
  if (!planId || !plans[planId]) return null;
  return plans[planId];
};

// GET /api/subscriptions/plans
exports.getPlans = async (req, res) => {
  res.json({ success: true, plans });
};

// GET /api/subscriptions/payment-info
exports.getPaymentInfo = async (req, res) => {
  res.json({
    success: true,
    payment: {
      method: 'upi',
      upiId: process.env.PLATFORM_UPI_ID || '9263611337@ybl',
      name: process.env.PLATFORM_UPI_NAME || 'Prahlad mahato',
      qrCode: process.env.PLATFORM_UPI_QR_URL || 'https://res.cloudinary.com/lewv3bhj/image/upload/v1791002708/phonepe-qr.png',
      phoneNumber: process.env.PLATFORM_PHONE || '9263611337',
    },
  });
};

// GET /api/subscriptions/current
exports.getCurrentSubscription = async (req, res) => {
  try {
    const store = await Store.findById(req.user.storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    res.json({
      success: true,
      currentPlan: store.plan,
      planStartedAt: store.planStartedAt,
      planExpiresAt: store.planExpiresAt,
      isExpired: store.isPlanExpired(),
      productLimit: store.productLimit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/subscriptions/submit
// Customer submits UPI payment proof for a plan.
exports.submitPayment = async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this account',
      });
    }

    const { planId, transactionId, screenshot } = req.body;
    const planConfig = getPlanConfig(planId);

    if (!planConfig) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    if (planConfig.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This plan does not require payment',
      });
    }

    if (!transactionId?.trim() && !screenshot?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a UPI transaction ID or payment screenshot',
      });
    }

    const existingPending = await Subscription.findOne({
      userId: req.user._id,
      plan: planId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A payment for this plan is already pending approval',
        subscription: existingPending,
      });
    }

    const subscription = await Subscription.create({
      storeId: req.user.storeId,
      userId: req.user._id,
      plan: planId,
      amount: planConfig.price,
      paymentMethod: 'upi',
      transactionId: transactionId?.trim() || '',
      screenshot: screenshot?.trim() || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Payment proof submitted. Admin approval is pending.',
      subscription,
    });
  } catch (error) {
    console.error('submitPayment ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/my
exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user._id,
    }).sort('-createdAt');

    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscriptions/admin/pending
exports.getAllPending = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ status: 'pending' })
      .populate('storeId', 'name slug plan')
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/subscriptions/admin/:id/approve
exports.approveSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        message: `Subscription is already ${subscription.status}`,
      });
    }

    const planConfig = getPlanConfig(subscription.plan);
    if (!planConfig) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const store = await Store.findById(subscription.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + planConfig.duration * 24 * 60 * 60 * 1000
    );

    subscription.status = 'approved';
    subscription.startedAt = now;
    subscription.expiresAt = expiresAt;
    await subscription.save();

    store.plan = subscription.plan;
    store.planStartedAt = now;
    store.planExpiresAt = expiresAt;
    store.productLimit = planConfig.productLimit;
    await store.save();

    res.json({
      success: true,
      message: 'Subscription approved and store plan activated',
      subscription,
    });
  } catch (error) {
    console.error('approveSubscription ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/subscriptions/admin/:id/reject
exports.rejectSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true, runValidators: true }
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
    res.status(500).json({ success: false, message: error.message });
  }
};
