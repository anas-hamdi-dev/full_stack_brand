const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { isBrandOwner, checkBrandOwnership } = require('../middleware/authorization');
const { uploadSingleImage } = require('../middleware/upload');
const { deleteImage } = require('../utils/cloudinary');

// GET /api/brands
router.get('/', async (req, res) => {
  try {
    const { featured, search, page, limit } = req.query;
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 12)); // Default 12, max 100
    const skip = (pageNum - 1) * limitNum;
    
    // Build query - only show approved brands
    const query = { status: 'approved' };

    if (featured === 'true') {
      query.is_featured = true;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination and stable sort
    const [brands, total] = await Promise.all([
      Brand.find(query)
        .sort({ createdAt: -1, _id: -1 }) // Stable sort: createdAt first, then _id
        .skip(skip)
        .limit(limitNum),
      Brand.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const hasMore = skip + brands.length < total;

    res.json({ 
      data: brands,
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

// GET /api/brands/featured
router.get('/featured', async (req, res) => {
  try {
    const brands = await Brand.find({ 
      is_featured: true,
      status: 'approved' // Only show approved brands
    })
      .sort({ createdAt: -1 });
    res.json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/me - Get brand owner's own brand (must be before /:id)
router.get('/me', authenticate, isBrandOwner, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || !user.brand_id) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brand = await Brand.findById(user.brand_id);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    res.json({ data: brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/me/products - Get brand owner's own products (must be before /:brandId/products)
router.get('/me/products', authenticate, isBrandOwner, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || !user.brand_id) {
      return res.json({ 
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          hasMore: false
        }
      });
    }
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12)); // Default 12, max 100
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination and stable sort
    const [products, total] = await Promise.all([
      Product.find({ brand_id: user.brand_id })
        .sort({ createdAt: -1, _id: -1 }) // Stable sort: createdAt first, then _id
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments({ brand_id: user.brand_id })
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

// GET /api/brands/:id
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    // Only show approved brands publicly
    if (brand.status !== 'approved') {
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
    
    // Check if brand exists and is approved (for public access)
    const brand = await Brand.findById(req.params.brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    if (brand.status !== 'approved') {
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
router.post('/', authenticate, isBrandOwner, uploadSingleImage('brands', 'logo'), async (req, res) => {
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
      description,
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

    // Validate logo upload
    if (!req.uploadedImage) {
      return res.status(400).json({ error: 'Logo image is required' });
    }

    // Preserve newlines in description - only set to null if empty or whitespace-only
    const descriptionValue = description && description.trim() ? description : null;
    
    // Create brand
    const brand = await Brand.create({
      name: name.trim(),
      ownerId: user._id,
      description: descriptionValue,
      logo_url: req.uploadedImage,
      location: location?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      facebook: facebook?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || user.email || null,
      is_featured: false,
      status: 'approved' // Brands are automatically approved upon creation
    });

    // Update user with brand_id
    user.brand_id = brand._id;
    await user.save();

    res.status(201).json({ data: brand });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/brands/:id
router.patch('/:id', authenticate, isBrandOwner, checkBrandOwnership, uploadSingleImage('brands', 'logo'), async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      website,
      instagram,
      facebook,
      phone,
      email,
      status
    } = req.body;

    // Brand owners cannot change status - only admins can do that
    // Status is preserved from existing brand
    if (status !== undefined) {
      return res.status(403).json({ error: 'You do not have permission to change brand status' });
    }

    // Get existing brand to preserve status and delete old logo if needed
    const existingBrand = await Brand.findById(req.params.id);
    if (!existingBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const updateData = {};
    
    // Validate and update name
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Brand name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    
    // Handle description
    if (description !== undefined) {
      // Preserve newlines in description - only set to null if empty or whitespace-only
      updateData.description = description && description.trim() ? description : null;
    }
    
    // Handle logo upload
    if (req.uploadedImage) {
      // New logo file uploaded - delete old logo from Cloudinary
      if (existingBrand.logo_url && existingBrand.logo_url.publicId) {
        await deleteImage(existingBrand.logo_url.publicId);
      }
      updateData.logo_url = req.uploadedImage;
    } else if (req.body.logo_publicId && req.body.logo_imageUrl) {
      // Frontend sent existing logo info to preserve it
      updateData.logo_url = {
        publicId: req.body.logo_publicId.trim(),
        imageUrl: req.body.logo_imageUrl.trim()
      };
    }
    // If neither new file nor existing logo info is provided, logo_url is preserved (not in updateData)
    
    // Handle optional fields with trimming
    if (location !== undefined) {
      updateData.location = location && location.trim() ? location.trim() : null;
    }
    if (website !== undefined) {
      updateData.website = website && website.trim() ? website.trim() : null;
    }
    if (instagram !== undefined) {
      updateData.instagram = instagram && instagram.trim() ? instagram.trim() : null;
    }
    if (facebook !== undefined) {
      updateData.facebook = facebook && facebook.trim() ? facebook.trim() : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null;
    }
    if (email !== undefined) {
      updateData.email = email && email.trim() ? email.trim().toLowerCase() : null;
    }
    // Status is preserved - brand owners cannot change it

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ data: brand });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
