const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
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
