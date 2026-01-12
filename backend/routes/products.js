const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, isBrandOwnerApproved, checkProductOwnership } = require('../middleware/authorization');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { brand_id, search, limit } = req.query;
    
    // Get approved brands
    let approvedBrandIds = [];
    if (brand_id) {
      // Check if the specified brand is approved
      const brand = await Brand.findById(brand_id);
      if (brand && brand.status === 'approved') {
        approvedBrandIds = [brand_id];
      } else {
        // Brand not found or not approved, return empty result
        return res.json({ data: [] });
      }
    } else {
      // If no brand or category filter, get all approved brands
      const brands = await Brand.find({ status: 'approved' }).select('_id');
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
        select: 'name logo_url website'
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
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'brand_id'
      });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Only show products from approved brands publicly
    const brandId = product.brand_id?._id || product.brand_id;
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand || brand.status !== 'approved') {
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

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Validate price - price is required
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }

    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Price must be a valid number greater than or equal to 0' });
    }

    // Validate images - at least one image is required
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    // Validate image formats - only allow HTTP/HTTPS URLs or data URLs
    const validImageRegex = /^(https?:\/\/.+|data:image\/(jpeg|jpg|png|webp);base64,.+)$/;
    const invalidImages = images.filter(img => !validImageRegex.test(img));
    if (invalidImages.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid image format. Only JPG, PNG, and WebP formats are supported. Images must be valid URLs or base64 data URLs.' 
      });
    }

    // Ensure user owns the brand
    if (!req.user.brand_id) {
      return res.status(403).json({ error: 'You must own a brand to create products' });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description?.trim() || null,
      brand_id: req.user.brand_id,
      price: priceNum,
      images
    });

    await product.populate({
      path: 'brand_id'
    });

    res.status(201).json({ data: product });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id
router.patch('/:id', authenticate, isBrandOwnerApproved, checkProductOwnership, async (req, res) => {
  try {
    const { name, description, price, images } = req.body;

    const updateData = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Product name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    
    // Price is always required in updates - validate it
    // Since price is a required field in the schema, we must validate it
    if (price === undefined) {
      return res.status(400).json({ error: 'Price is required and must be provided' });
    }
    
    if (price === null || price === '') {
      return res.status(400).json({ error: 'Price is required and cannot be empty' });
    }
    
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Price must be a valid number greater than or equal to 0' });
    }
    updateData.price = priceNum;
    
    // Validate images if provided
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' });
      }
      
      // Validate image formats
      const validImageRegex = /^(https?:\/\/.+|data:image\/(jpeg|jpg|png|webp);base64,.+)$/;
      const invalidImages = images.filter(img => !validImageRegex.test(img));
      if (invalidImages.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid image format. Only JPG, PNG, and WebP formats are supported. Images must be valid URLs or base64 data URLs.' 
        });
      }
      
      updateData.images = images;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({
      path: 'brand_id'
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
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
