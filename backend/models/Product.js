const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  price: {
    type: Number,
    min: 0,
    default: null
  },
  images: {
    type: [String], 
    required: true,
    validate: {
      validator: function(v) {
        // Allow data URLs (base64) or HTTP/HTTPS URLs
        return v.length > 0 && v.every(url => {
          return /^https?:\/\/.+/.test(url) || /^data:image\/.+;base64,.+/.test(url);
        });
      },
      message: 'At least one valid image URL (HTTP/HTTPS or data URL) is required'
    }
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ brand_id: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search index
productSchema.index({ createdAt: -1 }); // For sorting by newest

// Virtual to populate brand
productSchema.virtual('brand', {
  ref: 'Brand',
  localField: 'brand_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Product', productSchema);
