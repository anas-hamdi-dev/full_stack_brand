const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, checkProductOwnership } = require('../middleware/authorization');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { brand_id, category_id, search, page, limit } = req.query;
    const query = {};

    if (brand_id) {
      query.brand_id = brand_id;
    }
    if (category_id) {
      const brands = await Brand.find({ category_id });
      query.brand_id = { $in: brands.map(b => b._id) };
    }
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate({
        path: 'brand_id',
        select: 'name logo_url website category_id',
        populate: {
          path: 'category_id',
          select: 'name icon'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      data: products,
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

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'brand_id',
        populate: { path: 'category_id' }
      });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/products
router.post('/', authenticate, isBrandOwner, async (req, res) => {
  try {
    const { name, description, price, images, external_url } = req.body;

    if (!name || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Name and at least one image are required' });
    }

    // Ensure user owns the brand
    if (!req.user.brand_id) {
      return res.status(403).json({ error: 'You must own a brand to create products' });
    }

    const product = await Product.create({
      name,
      description,
      brand_id: req.user.brand_id,
      price: price || null,
      images,
      external_url
    });

    await product.populate({
      path: 'brand_id',
      populate: { path: 'category_id' }
    });

    res.status(201).json({ data: product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id
router.patch('/:id', authenticate, isBrandOwner, checkProductOwnership, async (req, res) => {
  try {
    const { name, description, price, images, external_url } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (images !== undefined) updateData.images = images;
    if (external_url !== undefined) updateData.external_url = external_url;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({
      path: 'brand_id',
      populate: { path: 'category_id' }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, isBrandOwner, checkProductOwnership, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.brand_id.toString() !== req.user.brand_id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete associated favorites
    const Favorite = require('../models/Favorite');
    await Favorite.deleteMany({ product_id: req.params.id });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
