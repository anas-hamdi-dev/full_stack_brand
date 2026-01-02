const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, isBrandOwnerApproved, checkProductOwnership } = require('../middleware/authorization');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { brand_id, category_id, search, limit } = req.query;
    const User = require('../models/User');
    
    // Get all approved brand owners
    const approvedOwners = await User.find({ 
      role: 'brand_owner', 
      status: 'approved' 
    }).select('_id');
    const approvedOwnerIds = approvedOwners.map(o => o._id);
    
    // Get brands owned by approved users
    let approvedBrandIds = [];
    if (brand_id) {
      // Check if the specified brand is owned by an approved user
      const brand = await Brand.findById(brand_id);
      if (brand && approvedOwnerIds.some(id => id.toString() === brand.ownerId.toString())) {
        approvedBrandIds = [brand_id];
      } else {
        // Brand not found or owner not approved, return empty result
        return res.json({ data: [] });
      }
    } else if (category_id) {
      // Only include brands in this category owned by approved users
      const brands = await Brand.find({ 
        category_id, 
        ownerId: { $in: approvedOwnerIds } 
      });
      approvedBrandIds = brands.map(b => b._id);
      if (approvedBrandIds.length === 0) {
        return res.json({ data: [] });
      }
    } else {
      // If no brand or category filter, get all brands owned by approved users
      const brands = await Brand.find({ ownerId: { $in: approvedOwnerIds } }).select('_id');
      approvedBrandIds = brands.map(b => b._id);
      if (approvedBrandIds.length === 0) {
        return res.json({ data: [] });
      }
    }
    
    const query = { brand_id: { $in: approvedBrandIds } };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // MVP: simple regex search
    }

    const limitNum = parseInt(limit) || 50; // MVP: simple limit, no pagination

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
      .limit(limitNum);

    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'brand_id',
        populate: { path: 'category_id' }
      });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Only show products from brands owned by approved users publicly
    const brandId = product.brand_id?._id || product.brand_id;
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const owner = await User.findById(brand.ownerId);
      if (!owner || owner.role !== 'brand_owner' || owner.status !== 'approved') {
        return res.status(404).json({ error: 'Product not found' });
      }
    }
    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/products
router.post('/', authenticate, isBrandOwnerApproved, async (req, res) => {
  try {
    const { name, description, price, images } = req.body;

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
      images
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
router.patch('/:id', authenticate, isBrandOwnerApproved, checkProductOwnership, async (req, res) => {
  try {
    const { name, description, price, images } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (images !== undefined) updateData.images = images;

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
router.delete('/:id', authenticate, isBrandOwnerApproved, checkProductOwnership, async (req, res) => {
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
