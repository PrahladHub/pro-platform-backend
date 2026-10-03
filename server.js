const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-store-slug'],
  credentials: false,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Error:', err.message));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Pro-Platform Backend API is running! 🚀',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      auth: '/api/auth/signup, /api/auth/login',
      products: '/api/products',
      orders: '/api/orders',
      upload: '/api/upload',
      subscriptions: '/api/subscriptions/plans',
    },
  });
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});