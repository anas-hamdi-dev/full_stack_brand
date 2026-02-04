const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const {  isBrandOwnerApproved, checkProductOwnership } = require('../middleware/authorization');
const { uploadMultipleImages } = require('../middleware/upload');
const { deleteMultipleImages } = require('../utils/cloudinary');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { brand_id, search, page, limit } = req.query;
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 12)); // Default 12, max 100
    const skip = (pageNum - 1) * limitNum;
    
    // Get approved brands
    let approvedBrandIds = [];
    if (brand_id) {
      // Check if the specified brand is approved
      const brand = await Brand.findById(brand_id);
      if (brand && brand.status === 'approved') {
        approvedBrandIds = [brand_id];
      } else {
        // Brand not found or not approved, return empty result with pagination metadata
        return res.json({ 
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            hasMore: false
          }
        });
      }
    } else {
      // If no brand filter, get all approved brands
      const brands = await Brand.find({ status: 'approved' }).select('_id');
      approvedBrandIds = brands.map(b => b._id);
      if (approvedBrandIds.length === 0) {
        return res.json({ 
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            hasMore: false
          }
        });
      }
    }
    
    const query = { brand_id: { $in: approvedBrandIds } };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // MVP: simple regex search
    }

    // Execute query with pagination and stable sort
    // Sort by createdAt descending (newest first) and _id as secondary sort for stability
    const [products, total] = await Promise.all([
      Product.find(query)
      .populate({
        path: 'brand_id',
        select: 'name logo_url website'
      })
        .sort({ createdAt: -1, _id: -1 }) // Stable sort: createdAt first, then _id
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const hasMore = skip + products.length < total;

    res.json({ 
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore
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
router.post('/', authenticate, isBrandOwnerApproved, uploadMultipleImages('products', 'images', 10), async (req, res) => {
  try {
    const { name, description, price, purchaseLink } = req.body;

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
    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    // Validate purchaseLink - required field
    if (!purchaseLink || !purchaseLink.trim()) {
      return res.status(400).json({ error: 'Purchase link is required' });
    }

    const purchaseLinkTrimmed = purchaseLink.trim();
    if (!/^https?:\/\/.+/.test(purchaseLinkTrimmed)) {
      return res.status(400).json({ error: 'Purchase link must be a valid URL starting with http:// or https://' });
    }

    // Ensure user owns the brand
    if (!req.user.brand_id) {
      return res.status(403).json({ error: 'You must own a brand to create products' });
    }

    // Preserve newlines in description - only set to null if empty or whitespace-only
    const descriptionValue = description && description.trim() ? description : null;
    
    const product = await Product.create({
      name: name.trim(),
      description: descriptionValue,
      brand_id: req.user.brand_id,
      price: priceNum,
      images: req.uploadedImages,
      purchaseLink: purchaseLinkTrimmed
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
router.patch('/:id', authenticate, isBrandOwnerApproved, checkProductOwnership, uploadMultipleImages('products', 'images', 10), async (req, res) => {
  try {
    const { name, description, price, purchaseLink } = req.body;

    // Get existing product to delete old images if needed
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateData = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Product name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      // Preserve newlines in description - only set to null if empty or whitespace-only
      updateData.description = description && description.trim() ? description : null;
    }
    
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
    
    // Purchase link is required - validate it
    if (purchaseLink === undefined) {
      return res.status(400).json({ error: 'Purchase link is required and must be provided' });
    }
    
    if (!purchaseLink || !purchaseLink.trim()) {
      return res.status(400).json({ error: 'Purchase link is required and cannot be empty' });
    }
    
    const purchaseLinkTrimmed = purchaseLink.trim();
    if (!/^https?:\/\/.+/.test(purchaseLinkTrimmed)) {
      return res.status(400).json({ error: 'Purchase link must be a valid URL starting with http:// or https://' });
    }
    updateData.purchaseLink = purchaseLinkTrimmed;
    
    // Handle images if new ones were uploaded
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      // Delete old images from Cloudinary
      if (existingProduct.images && existingProduct.images.length > 0) {
        const oldPublicIds = existingProduct.images
          .map(img => img.publicId)
          .filter(id => id); // Filter out any null/undefined values
        if (oldPublicIds.length > 0) {
          await deleteMultipleImages(oldPublicIds);
        }
      }
      updateData.images = req.uploadedImages;
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

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const publicIds = product.images
        .map(img => img.publicId)
        .filter(id => id); // Filter out any null/undefined values
      if (publicIds.length > 0) {
        await deleteMultipleImages(publicIds);
      }
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
