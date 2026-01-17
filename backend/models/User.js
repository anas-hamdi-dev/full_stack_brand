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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Validate Tunisian phone number format: +216 followed by 8 digits starting with 2, 4, 5, or 9
        // Format: +216XXXXXXXX where X is a digit, first X after country code must be 2, 4, 5, or 9
        if (!v) return false;
        // Remove any spaces or dashes for validation
        const cleaned = v.replace(/[\s-]/g, '');
        // Check if it matches +216 followed by 8 digits where first digit is 2-9
        const tunisianPhoneRegex = /^\+216[2-9]\d{7}$/;
        return tunisianPhoneRegex.test(cleaned);
      },
      message: 'Invalid Tunisian phone number. Must be in format +216XXXXXXXX (8 digits, starting with 2, 4, 5, or 9)'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['client', 'brand_owner', 'admin'],
    default: 'client'
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
    validate: {
      validator: function(v) {
        // brand_id can be null initially for brand_owner (will be set when brand is created)
        // For clients and admins, brand_id must be null
        const role = this.role || (this.get ? this.get('role') : null);
        if (role === 'brand_owner') {
          // Allow null initially, but should be set eventually
          return v === null || v !== undefined;
        }
        // For clients and admins, brand_id must be null
        return v === null || v === undefined;
      },
      message: 'Brand ID must be null for clients and admins'
    }
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    select: false // Don't return verification code by default
  },
  emailVerificationExpiresAt: {
    type: Date,
    select: false
  },
  emailVerificationAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  emailVerificationBlockedUntil: {
    type: Date,
    default: null,
    select: false
  },
  emailVerificationLastSentAt: {
    type: Date,
    default: null,
    select: false
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
