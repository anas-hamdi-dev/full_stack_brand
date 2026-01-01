const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Logo URL must be a valid URL'
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
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Instagram URL must be a valid URL'
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
  }
}, {
  timestamps: true
});

// Indexes
brandSchema.index({ name: 1 }, { unique: true });
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
