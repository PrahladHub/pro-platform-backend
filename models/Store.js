const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },

  // Subscription
  plan: {
    type: String,
    enum: ['starter', 'growth', 'scale', 'enterprise'],
    default: 'starter',
  },
  planStartedAt: { type: Date, default: null },
  planExpiresAt: { type: Date, default: null },
  productLimit: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },

  // Payment Settings
  paymentSettings: {
    upiId: { type: String, default: '' },
    upiQrCode: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    codEnabled: { type: Boolean, default: true },
    upiEnabled: { type: Boolean, default: true },
  },

  createdAt: { type: Date, default: Date.now },
});

// Check if plan is expired
storeSchema.methods.isPlanExpired = function () {
  if (!this.planExpiresAt) return false;
  return new Date() > this.planExpiresAt;
};

module.exports = mongoose.model('Store', storeSchema);