const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, isBrandOwnerApproved, checkBrandOwnership } = require('../middleware/authorization');

// GET /api/brands
router.get('/', async (req, res) => {
  try {
    const { category_id, featured, search, limit } = req.query;
    const User = require('../models/User');
    
    // Get all approved brand owners
    const approvedOwners = await User.find({ 
      role: 'brand_owner', 
      status: 'approved' 
    }).select('_id');
    const approvedOwnerIds = approvedOwners.map(o => o._id);
    
    // Build query - only show brands owned by approved users
    const query = { ownerId: { $in: approvedOwnerIds } };

    if (category_id) {
      query.category_id = category_id;
    }
    if (featured === 'true') {
      query.is_featured = true;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const limitNum = parseInt(limit) || 50; // MVP: simple limit, no pagination

    const brands = await Brand.find(query)
      .populate('category_id', 'name icon')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/featured
router.get('/featured', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get all approved brand owners
    const approvedOwners = await User.find({ 
      role: 'brand_owner', 
      status: 'approved' 
    }).select('_id');
    const approvedOwnerIds = approvedOwners.map(o => o._id);
    
    const brands = await Brand.find({ 
      is_featured: true,
      ownerId: { $in: approvedOwnerIds } // Only show brands owned by approved users
    })
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
    const User = require('../models/User');
    const brand = await Brand.findById(req.params.id)
      .populate('category_id');
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Only show brands owned by approved users publicly
    const owner = await User.findById(brand.ownerId);
    if (!owner || owner.role !== 'brand_owner' || owner.status !== 'approved') {
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
    const User = require('../models/User');
    
    // Check if brand exists and owner is approved (for public access)
    const brand = await Brand.findById(req.params.brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const owner = await User.findById(brand.ownerId);
    if (!owner || owner.role !== 'brand_owner' || owner.status !== 'approved') {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const products = await Product.find({ brand_id: req.params.brandId })
      .sort({ createdAt: -1 });
    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/brands
router.post('/', authenticate, isBrandOwner, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'brand_owner') {
      return res.status(403).json({ error: 'Only brand owners can create brands' });
    }

    // Check if user already has a brand
    if (user.brand_id) {
      return res.status(409).json({ error: 'User already has a brand' });
    }

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

    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    // Create brand
    const brand = await Brand.create({
      name: name.trim(),
      ownerId: user._id,
      category_id: category_id || null,
      description: description?.trim() || null,
      logo_url: logo_url || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      facebook: facebook?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || user.email || null,
      is_featured: false
    });

    // Update user with brand_id
    user.brand_id = brand._id;
    await user.save();

    const populatedBrand = await Brand.findById(brand._id).populate('category_id');

    res.status(201).json({ data: populatedBrand });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/brands/:id
router.patch('/:id', authenticate, isBrandOwnerApproved, checkBrandOwnership, async (req, res) => {
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
