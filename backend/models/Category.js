const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Icon can be a URL (for uploaded images) or icon name (for legacy support)
        return !v || /^https?:\/\/.+/.test(v) || /^data:image\/.+;base64,.+/.test(v) || v.length > 0;
      },
      message: 'Icon must be a valid URL, data URL, or icon identifier'
    }
  },
  description: {
    type: String,
    trim: true
  },
  brand_count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1 }, { unique: true });

// Virtual or method to update brand_count
categorySchema.methods.updateBrandCount = async function() {
  const Brand = mongoose.model('Brand');
  const count = await Brand.countDocuments({ category_id: this._id });
  this.brand_count = count;
  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);
