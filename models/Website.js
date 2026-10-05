const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    domain: {
      type: String,
      default: '',
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    category: {
      type: String,
      default: 'E-commerce',
    },

    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },

    products: {
      type: Number,
      default: 0,
    },

    orders: {
      type: Number,
      default: 0,
    },

    // Website Design Settings
    design: {
      primaryColor: {
        type: String,
        default: '#4f46e5',
      },

      backgroundColor: {
        type: String,
        default: '#ffffff',
      },

      textColor: {
        type: String,
        default: '#111827',
      },

      font: {
        type: String,
        default: 'Inter',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Website', websiteSchema);