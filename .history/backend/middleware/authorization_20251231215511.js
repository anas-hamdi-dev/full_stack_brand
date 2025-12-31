const Brand = require('../models/Brand');
const Product = require('../models/Product');

// Middleware to check if user is brand owner
const isBrandOwner = async (req, res, next) => {
  if (req.user.role !== 'brand_owner') {
    return res.status(403).json({ error: 'Access denied. Brand owner role required.' });
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
    if (req.user.brand_id.toString() !== brand._id.toString()) {
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
  checkBrandOwnership,
  checkProductOwnership,
  isClient
};
