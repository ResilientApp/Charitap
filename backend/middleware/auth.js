const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Guard: fail fast at module load if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Auth middleware will not work.');
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  // Ensure JWT_SECRET is configured before attempting verification
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: missing JWT_SECRET' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user with only allowed fields (exclude password, tokens, and other sensitive fields)
    const user = await User.findById(decoded.userId).select('-password -tokens -resetToken -resetTokenExpiry');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach sanitized user to request object
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
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Exclude sensitive fields the same way as authenticateToken
      const user = await User.findById(decoded.userId).select('-password -tokens -resetToken -resetTokenExpiry');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth verification error:', error);
    // Continue without authentication
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };
