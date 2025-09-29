const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin()) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Role-based access middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.hasRole(role)) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
};

// User management access middleware
const requireUserManagement = (req, res, next) => {
  if (!req.user || !req.user.canManageUsers()) {
    return res.status(403).json({ error: 'User management permission required' });
  }
  next();
};

// System data access middleware
const requireSystemAccess = (req, res, next) => {
  if (!req.user || !req.user.canAccessSystemData()) {
    return res.status(403).json({ error: 'System access permission required' });
  }
  next();
};

// Self or admin middleware (user can access their own data or admin can access any)
const requireSelfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.isAdmin() || req.user._id.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied' });
};

// Rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (use Redis in production)
  const ip = req.ip;
  const key = `auth_${ip}`;
  
  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }
  
  const attempts = global.authAttempts.get(key) || { count: 0, resetTime: Date.now() + 15 * 60 * 1000 };
  
  if (Date.now() > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = Date.now() + 15 * 60 * 1000;
  }
  
  if (attempts.count >= 5) {
    return res.status(429).json({ error: 'Too many authentication attempts. Try again later.' });
  }
  
  attempts.count++;
  global.authAttempts.set(key, attempts);
  
  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireRole,
  requireUserManagement,
  requireSystemAccess,
  requireSelfOrAdmin,
  authRateLimit
};