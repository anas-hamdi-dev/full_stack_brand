const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories - Public endpoint to fetch all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .select('name image')
      .sort({ name: 1 });
    
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


