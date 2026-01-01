const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, checkBrandOwnership } = require('../middleware/authorization');

// GET /api/brands
router.get('/', async (req, res) => {
  try {
    const { category_id, featured, search, page, limit } = req.query;
    const query = {};

    if (category_id) {
      query.category_id = category_id;
    }
    if (featured === 'true') {
      query.is_featured = true;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const brands = await Brand.find(query)
      .populate('category_id', 'name icon')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Brand.countDocuments(query);

    res.json({
      data: brands,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/featured
router.get('/featured', async (req, res) => {
  try {
    const brands = await Brand.find({ is_featured: true })
      .populate('category_id')
      .sort({ createdAt: -1 });
    res.json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/:id
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('category_id');
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({ data: brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/:brandId/products
router.get('/:brandId/products', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({ brand_id: req.params.brandId })
      .sort({ createdAt: -1 });
    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/brands/:id
router.patch('/:id', authenticate, isBrandOwner, checkBrandOwnership, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      logo_url,
      location,
      website,
      instagram,
      facebook,
      phone,
      email
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (facebook !== undefined) updateData.facebook = facebook;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category_id');

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ data: brand });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
