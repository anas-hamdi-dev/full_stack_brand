const User = require('../models/User');

/**
 * Middleware to check if user's email is verified
 * Blocks access to protected routes if email is not verified
 */
const requireEmailVerification = async (req, res, next) => {
  try {
    // User should already be authenticated at this point (use after authenticate middleware)
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admin users don't need email verification (they're created manually)
    if (user.role === 'admin') {
      return next();
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource',
        isEmailVerified: false
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = requireEmailVerification;













