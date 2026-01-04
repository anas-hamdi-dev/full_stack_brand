const Brand = require('../models/Brand');
const Product = require('../models/Product');

// Middleware to check if user is brand owner
const isBrandOwner = async (req, res, next) => {
  if (req.user.role !== 'brand_owner') {
    return res.status(403).json({ error: 'Access denied. Brand owner role required.' });
  }
  next();
};

// Middleware to check if brand owner is approved (now just checks role, no status)
// Brand owners are managed through their brand data, not user status
const isBrandOwnerApproved = async (req, res, next) => {
  if (req.user.role !== 'brand_owner') {
    return res.status(403).json({ error: 'Access denied. Brand owner role required.' });
  }
  // Check if brand owner has a brand (brand_id must be set)
  if (!req.user.brand_id) {
    return res.status(403).json({ 
      error: 'Brand not created',
      message: 'Please complete your brand details to access the dashboard.'
    });
  }
  next();
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check brand ownership
const checkBrandOwnership = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    // Check ownership via ownerId (brands now use ownerId instead of user.brand_id)
    if (req.user.brand_id && req.user.brand_id.toString() !== brand._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You do not own this brand.' });
    }
    // Also check via ownerId for consistency
    if (brand.ownerId && brand.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You do not own this brand.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check product ownership (via brand)
const checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (req.user.brand_id.toString() !== product.brand_id.toString()) {
      return res.status(403).json({ error: 'Access denied. You do not own this product.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check if user is client
const isClient = async (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Access denied. Client role required.' });
  }
  next();
};

module.exports = {
  isBrandOwner,
  isBrandOwnerApproved,
  checkBrandOwnership,
  checkProductOwnership,
  isClient,
  isAdmin
};
