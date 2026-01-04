const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ user: userObj, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Signup request body:', { email, password: password ? '***' : undefined, full_name, phone, role });
    }

    if (!email || !password || !role) {
      return res.status(400).json({ 
        error: 'Email, password, and role are required',
        received: { 
          email: !!email, 
          password: !!password, 
          role: !!role 
        }
      });
    }

    if (!['client', 'brand_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "client" or "brand_owner"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user - brand will be created later by brand_owner through their profile
    // Use email prefix as default full_name if not provided
    const defaultFullName = full_name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    
    const user = await User.create({
      email,
      password, // Will be hashed by pre-save hook
      full_name: defaultFullName,
      phone: phone || undefined,
      role
    });

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signout
router.post('/signout', authenticate, (req, res) => {
  // Token invalidation handled client-side
  // For server-side invalidation, implement token blacklist
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('brand_id');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
