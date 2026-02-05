const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty string or valid URL
        if (!v || v === '') return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL starting with http:// or https://'
    }
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);


