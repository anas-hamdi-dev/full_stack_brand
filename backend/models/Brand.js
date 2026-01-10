const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  logo_url: {
    type: String,
    required: [true, 'Logo URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Allow data URLs (base64) or HTTP/HTTPS URLs
        return /^https?:\/\/.+/.test(v) || /^data:image\/.+;base64,.+/.test(v);
      },
      message: 'Logo URL must be a valid HTTP/HTTPS URL or data URL'
    }
  },
  location: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  instagram: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        // Accept either URL format or username format (@username or username)
        const isUrl = /^https?:\/\/.+/.test(v);
        const isUsername = /^@?[a-zA-Z0-9._]+$/.test(v);
        return isUrl || isUsername;
      },
      message: 'Instagram must be a valid URL or username (e.g., @username or username)'
    }
  },
  facebook: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Facebook URL must be a valid URL'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ ownerId: 1 }, { unique: true }); // For finding brands by owner - one brand per owner
brandSchema.index({ category_id: 1 });
brandSchema.index({ is_featured: 1 });
brandSchema.index({ createdAt: -1 }); // For sorting by newest

// Virtual to populate category
brandSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true
});

// Middleware to update category brand_count
brandSchema.post('save', async function() {
  if (this.category_id) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category_id);
    if (category) {
      await category.updateBrandCount();
    }
  }
});

brandSchema.post('findOneAndDelete', async function(doc) {
  // Update brand_count when brand is deleted
  if (doc && doc.category_id) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(doc.category_id);
    if (category) {
      await category.updateBrandCount();
    }
  }
});

module.exports = mongoose.model('Brand', brandSchema);
