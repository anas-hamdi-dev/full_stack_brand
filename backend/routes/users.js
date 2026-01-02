const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/auth');

// PATCH /api/users/me (MVP - simplified endpoint)
router.patch('/me', authenticate, async (req, res) => {
  try {
    // Prevent role and brand_id changes (role immutability)
    if (req.body.role !== undefined || req.body.brand_id !== undefined) {
      return res.status(403).json({ error: 'Role and brand_id cannot be changed' });
    }

    const { full_name, phone } = req.body;
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
