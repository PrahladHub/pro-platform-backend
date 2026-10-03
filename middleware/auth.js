const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Check karein ki user logged in hai
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check karein ki Authorization header mein token hai
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Agar token nahi hai
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login',
      });
    }

    // Token verify karein
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User dhundhein
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token, please login again',
    });
  }
};

// @desc    Check karein ki user admin hai
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access only',
    });
  }
};