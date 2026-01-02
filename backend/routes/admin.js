const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ContactMessage = require('../models/ContactMessage');
const Favorite = require('../models/Favorite');
const authenticate = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorization');
const { validateImages, validateProductImages } = require('../middleware/imageValidation');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(isAdmin);

// ==================== Dashboard Endpoints ====================

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      brands: await Brand.countDocuments(),
      products: await Product.countDocuments(),
      categories: await Category.countDocuments(),
      messages: await ContactMessage.countDocuments(),
      pendingBrandOwners: await User.countDocuments({ role: 'brand_owner', status: 'pending' }),
      bannedBrandOwners: await User.countDocuments({ role: 'brand_owner', status: 'banned' })
    };
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/dashboard/recent-brands
router.get('/dashboard/recent-brands', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const brands = await Brand.find()
      .populate('category_id', 'name icon')
      .populate('ownerId', 'full_name email status')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ data: brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Brands Management ====================

// GET /api/admin/brands
router.get('/brands', async (req, res) => {
  try {
    const { search, category_id, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category_id) {
      query.category_id = category_id;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [brands, total] = await Promise.all([
      Brand.find(query)
        .populate('category_id', 'name icon')
        .populate('ownerId', 'full_name email status')
        .sort(sortOptions)
        .limit(limitNum)
        .skip(skip),
      Brand.countDocuments(query)
    ]);

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

// GET /api/admin/brands/:id
router.get('/brands/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('category_id', 'name icon')
      .populate('ownerId', 'full_name email status');
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    res.json({ data: brand });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid brand ID' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/brands/:id
router.patch('/brands/:id', validateImages({ fields: ['logo_url'], maxSizeMB: 10 }), async (req, res) => {
  try {
    // Prevent changing ownerId - admin can only edit brand details, not ownership
    const { ownerId, ...updateData } = req.body;
    
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category_id', 'name icon')
     .populate('ownerId', 'full_name email status');

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    } 

    res.json({ data: brand });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});


// ==================== Products Management ====================

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { search, brand_id, page, limit } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (brand_id) {
      query.brand_id = brand_id;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'brand_id',
          select: 'name logo_url',
          populate: {
            path: 'category_id',
            select: 'name icon'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      Product.countDocuments(query)
    ]);

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

// GET /api/admin/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'brand_id',
        select: 'name logo_url',
        populate: {
          path: 'category_id',
          select: 'name icon'
        }
      });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/products
router.post('/products', validateProductImages, async (req, res) => {
  try {
    if (!req.body.name || !req.body.brand_id || !req.body.images || req.body.images.length === 0) {
      return res.status(400).json({ error: 'Name, brand_id, and at least one image are required' });
    }

    // Remove external_url if present (MVP simplification)
    const { external_url, ...productData } = req.body;

    const product = await Product.create({
      ...productData,
      price: req.body.price || null
    });
    await product.populate({
      path: 'brand_id',
      populate: { path: 'category_id' }
    });
    res.status(201).json({ data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', validateProductImages, async (req, res) => {
  try {
    if (req.body.images && req.body.images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    // Remove external_url if present (MVP simplification)
    const { external_url, ...updateData } = req.body;

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
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Favorite.deleteMany({ product_id: req.params.id });
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Categories Management ====================

// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort({ name: 1 })
        .limit(limitNum)
        .skip(skip),
      Category.countDocuments(query)
    ]);

    res.json({
      data: categories,
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

// GET /api/admin/categories/:id
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ data: category });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/categories
router.post('/categories', validateImages({ fields: ['icon'], maxSizeMB: 10 }), async (req, res) => {
  try {
    const category = await Category.create({
      ...req.body,
      brand_count: 0
    });
    res.status(201).json({ data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/admin/categories/:id
router.patch('/categories/:id', validateImages({ fields: ['icon'], maxSizeMB: 10 }), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const brandCount = await Brand.countDocuments({ category_id: req.params.id });
    if (brandCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. ${brandCount} brand(s) are associated with this category.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Contact Messages Management ====================

// GET /api/admin/messages
router.get('/messages', async (req, res) => {
  try {
    const { search, sender, dateFrom, dateTo, page, limit } = req.query;
    const query = {};

    if (sender) {
      query.$or = [
        { name: { $regex: sender, $options: 'i' } },
        { email: { $regex: sender, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      ContactMessage.countDocuments(query)
    ]);

    res.json({
      data: messages,
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

// GET /api/admin/messages/:id
router.get('/messages/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== User Management ====================

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('brand_id', 'name logo_url')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      User.countDocuments(query)
    ]);

    res.json({
      data: users,
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

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('brand_id');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Prevent admin from changing their own role
    if (updateData.role && req.user._id.toString() === req.params.id) {
      delete updateData.role;
    }

    // If changing email, check for duplicates
    if (updateData.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').populate('brand_id');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If brand_owner, delete associated brand and products
    if (user.role === 'brand_owner' && user.brand_id) {
      const products = await Product.find({ brand_id: user.brand_id });
      const productIds = products.map(p => p._id);
      await Favorite.deleteMany({ product_id: { $in: productIds } });
      await Product.deleteMany({ brand_id: user.brand_id });
      // Use findOneAndDelete to trigger post hook for brand_count update
      await Brand.findOneAndDelete({ _id: user.brand_id });
    }

    // Delete user favorites if client
    if (user.role === 'client') {
      await Favorite.deleteMany({ user_id: req.params.id });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Admin Profile ====================

// GET /api/admin/profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/profile
router.patch('/profile', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/admin/profile/password
router.patch('/profile/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Brand Owners Management (Existing) ====================

// GET /api/admin/brand-owners
router.get('/brand-owners', async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const query = { role: 'brand_owner' };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [brandOwners, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('brand_id', 'name logo_url category_id')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      User.countDocuments(query)
    ]);

    res.json({
      data: brandOwners,
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

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }

    // Validate status transition
    if (user.status === 'approved') {
      return res.status(400).json({ error: 'Brand owner is already approved' });
    }

    // Update user status and approvedAt (handled by pre-save hook)
    user.status = 'approved';
    await user.save();

    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ 
      data: user, 
      message: 'Brand owner approved successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const { banReason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }

    // Validate status transition
    if (user.status === 'banned') {
      return res.status(400).json({ error: 'Brand owner is already banned' });
    }

    // Update user status and bannedAt (handled by pre-save hook)
    user.status = 'banned';
    user.banReason = banReason || null;
    await user.save();

    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ 
      data: user, 
      message: 'Brand owner banned successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/unban
router.patch('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }

    // Validate status transition
    if (user.status !== 'banned') {
      return res.status(400).json({ error: 'Brand owner is not banned' });
    }

    // Update user status (handled by pre-save hook)
    user.status = 'approved';
    user.banReason = null;
    await user.save();

    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ 
      data: user, 
      message: 'Brand owner unbanned successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/set-pending
router.patch('/users/:id/set-pending', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }

    // Update user status to pending
    user.status = 'pending';
    user.approvedAt = null;
    user.bannedAt = null;
    user.banReason = null;
    await user.save();

    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ 
      data: user, 
      message: 'Brand owner status set to pending successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/brand-owners/:id/approve (Legacy - maintained for backward compatibility)
router.patch('/brand-owners/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }
    if (user.status === 'approved') {
      return res.status(400).json({ error: 'Brand owner is already approved' });
    }
    user.status = 'approved';
    await user.save();
    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ data: user, message: 'Brand owner approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/brand-owners/:id/status (Legacy - maintained for backward compatibility)
router.patch('/brand-owners/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or banned' });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'brand_owner') {
      return res.status(404).json({ error: 'Brand owner not found' });
    }
    const now = new Date();
    if (status === 'approved') {
      user.approvedAt = now;
      user.bannedAt = null;
      user.banReason = null;
    } else if (status === 'banned') {
      user.bannedAt = now;
      user.approvedAt = null;
    }
    user.status = status;
    await user.save();
    await user.populate('brand_id', 'name logo_url category_id');
    res.json({ data: user, message: `Brand owner status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
