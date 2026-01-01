const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/auth');

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // User can only view own profile
    if (user._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // User can only update own profile
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent role and brand_id changes (role immutability)
    if (req.body.role !== undefined || req.body.brand_id !== undefined) {
      return res.status(403).json({ error: 'Role and brand_id cannot be changed' });
    }

    const { full_name, email, phone, avatar_url, first_name, last_name } = req.body;
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
