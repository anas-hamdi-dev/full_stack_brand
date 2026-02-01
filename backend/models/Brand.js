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
    required: false, // Optional for admin-created brands
    default: null
  },
  description: {
    type: String,
    // Don't trim to preserve newlines - we'll handle trimming in routes if needed
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
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes
brandSchema.index({ name: 1 }, { unique: true });
// Sparse unique index: allows null values, but ensures uniqueness for non-null values
// This allows admin-created brands (ownerId: null) and enforces one brand per owner
brandSchema.index({ ownerId: 1 }, { unique: true, sparse: true });
brandSchema.index({ is_featured: 1 });
brandSchema.index({ createdAt: -1 }); // For sorting by newest

module.exports = mongoose.model('Brand', brandSchema);
