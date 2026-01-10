const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const authenticate = require('../middleware/auth');
const { isClient } = require('../middleware/authorization');

// GET /api/favorites
router.get('/', authenticate, isClient, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.userId })
      .populate({
        path: 'product_id',
        populate: {
          path: 'brand_id',
          populate: { path: 'category_id' }
        }
      });

    // Filter out null products (deleted products) and ensure product exists
    const products = favorites
      .map(fav => fav.product_id)
      .filter(product => product !== null && product !== undefined);

    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/favorites
router.post('/', authenticate, isClient, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const Product = require('../models/Product');
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user_id: req.userId,
      product_id
    });

    if (existingFavorite) {
      return res.status(409).json({ error: 'Product already in favorites' });
    }

    const favorite = await Favorite.create({
      user_id: req.userId,
      product_id
    });

    await favorite.populate('product_id');
    res.status(201).json({ data: favorite });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Product already in favorites' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/favorites/:productId
router.delete('/:productId', authenticate, isClient, async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user_id: req.userId,
      product_id: req.params.productId
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/favorites/check/:productId
router.get('/check/:productId', authenticate, isClient, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user_id: req.userId,
      product_id: req.params.productId
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
