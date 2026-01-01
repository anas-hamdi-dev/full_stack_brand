const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't return password by default
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow null/undefined or valid phone format
        if (!v) return true;
        return /^\+216\s?\d{2}\s?\d{3}\s?\d{3}$/.test(v);
      },
      message: 'Please enter a valid phone number (+216 XX XXX XXX)'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['client', 'brand_owner'],
    default: 'client'
  },
  avatar_url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar URL must be a valid URL'
    }
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
    validate: {
      validator: function(v) {
        // brand_id should only exist for brand_owner role
        // During creation, this.role might not be set yet, so check the document
        const role = this.role || (this.get ? this.get('role') : null);
        if (role === 'brand_owner') {
          return v !== null && v !== undefined;
        }
        return v === null || v === undefined;
      },
      message: 'Brand ID is required for brand owners and must be null for clients'
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password; // Never return password in JSON
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ brand_id: 1 });
userSchema.index({ role: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
