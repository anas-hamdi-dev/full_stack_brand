const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Indexes for efficient queries
favoriteSchema.index({ user_id: 1 });
favoriteSchema.index({ product_id: 1 });

// Virtual to populate product
favoriteSchema.virtual('product', {
  ref: 'Product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Favorite', favoriteSchema);
