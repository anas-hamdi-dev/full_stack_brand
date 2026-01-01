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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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
    const { email, password, firstName, lastName, phone, role, brandData } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Email, password, firstName, lastName, and role are required' });
    }

    if (!['client', 'brand_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "client" or "brand_owner"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    let brandId = null;
    if (role === 'brand_owner') {
      // Create brand for brand owner
      const brand = await Brand.create({
        name: brandData?.name || `${firstName} ${lastName}'s Brand`,
        category_id: brandData?.category_id || null,
        description: brandData?.description || '',
        logo_url: brandData?.logo_url || null,
        location: brandData?.location || null,
        website: brandData?.website || null,
        instagram: brandData?.instagram || null,
        facebook: brandData?.facebook || null,
        phone: brandData?.phone || phone || null,
        email: brandData?.email || email,
        is_featured: false
      });
      brandId = brand._id;
    }

    // Normalize phone: convert empty string to null
    const normalizedPhone = phone && phone.trim() ? phone.trim() : null;

    const user = await User.create({
      email,
      password, // Will be hashed by pre-save hook
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
      role,
      brand_id: brandId
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Remove password from user object before sending
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ user: userObj, token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return res.status(400).json({ error: messages || 'Validation error' });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
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
