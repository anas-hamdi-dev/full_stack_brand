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
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty string or valid URL
        if (!v || v === '') return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Purchase link must be a valid URL'
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
