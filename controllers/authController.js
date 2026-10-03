const User = require('../models/User');
const Store = require('../models/Store');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register new user + auto create store
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, storeName } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password',
      });
    }

    if (!storeName) {
      return res.status(400).json({
        message: 'Please provide store name',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    // Check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    // Generate unique slug
    const baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Create store
    const store = await Store.create({
      owner: user._id,
      name: storeName,
      slug,
      plan: 'starter',
      productLimit: 5,
    });

    // Update user with storeId
    user.storeId = store._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        plan: store.plan,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).populate('storeId');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Build response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId?._id || user.storeId,
    };

    const storeResponse = user.storeId && user.storeId.slug ? {
      id: user.storeId._id,
      name: user.storeId.name,
      slug: user.storeId.slug,
      plan: user.storeId.plan,
    } : null;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      store: storeResponse,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};