const express = require('express');
const router = express.Router();
const BrandSubmission = require('../models/BrandSubmission');

// POST /api/brand-submissions
router.post('/', async (req, res) => {
  try {
    const {
      brand_name,
      category,
      description,
      contact_email,
      contact_phone,
      website,
      instagram
    } = req.body;

    if (!brand_name || !category || !contact_email) {
      return res.status(400).json({ error: 'Brand name, category, and contact email are required' });
    }

    const submission = await BrandSubmission.create({
      brand_name,
      category,
      description,
      contact_email,
      contact_phone,
      website,
      instagram,
      status: 'pending'
    });

    res.status(201).json({ data: submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
