const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    // Don't trim to preserve newlines - we'll handle trimming in routes if needed
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  images: {
    type: [{
      publicId: {
        type: String,
        required: true
      },
      imageUrl: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: 'Image URL must be a valid HTTP/HTTPS URL'
        }
      }
    }],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one image is required'
    }
  },
  purchaseLink: {
    type: String,
    required: [true, 'Purchase link is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Required field - must be a valid URL
        if (!v || v.trim() === '') return false;
        return /^https?:\/\/.+/.test(v.trim());
      },
      message: 'Purchase link must be a valid URL starting with http:// or https://'
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
