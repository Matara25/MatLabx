const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  console.log("🔥 AUTH MIDDLEWARE - protect function called");
  console.log("🔥 AUTH MIDDLEWARE - Request headers:", req.headers.authorization);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log("🔥 AUTH MIDDLEWARE - Bearer token found in header");
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log("🔥 AUTH MIDDLEWARE - Token extracted:", token.substring(0, 20) + "...");

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔥 AUTH MIDDLEWARE - Token verified, decoded id:", decoded.id);

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      req.user = user;
      console.log("AUTH SET req.user =", req.user.username);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error("🔥 AUTH MIDDLEWARE - JWT ERROR:", error);
      console.error("🔥 AUTH MIDDLEWARE - ERROR MESSAGE:", error.message);
      logger.error(`Auth middleware error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    console.log("🔥 AUTH MIDDLEWARE - No token found in request");
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token is invalid but we continue without user
      req.user = null;
    }
  }

  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
