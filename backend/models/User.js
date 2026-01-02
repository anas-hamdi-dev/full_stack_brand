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
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['client', 'brand_owner', 'admin'],
    default: 'client'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'banned'],
    default: function() {
      // Only brand_owner users have status; clients and admins don't need approval
      return this.role === 'brand_owner' ? 'pending' : undefined;
    },
    validate: {
      validator: function(v) {
        // Status should only exist for brand_owner role
        const role = this.role || (this.get ? this.get('role') : null);
        if (role === 'brand_owner') {
          return v !== undefined && v !== null && ['pending', 'approved', 'banned'].includes(v);
        }
        // For non-brand-owners (clients and admins), status should be undefined or null
        return v === undefined || v === null;
      },
      message: 'Status is required for brand owners and must be null/undefined for clients and admins'
    }
  },
  approvedAt: {
    type: Date,
    default: null
  },
  bannedAt: {
    type: Date,
    default: null
  },
  banReason: {
    type: String,
    trim: true,
    default: null
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
userSchema.index({ status: 1 }); // For filtering brand owners by status
userSchema.index({ role: 1, status: 1 }); // Compound index for admin queries

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Pre-save hook to set status timestamps
userSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.role === 'brand_owner') {
    const now = new Date();
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = now;
      this.bannedAt = null;
      this.banReason = null;
    } else if (this.status === 'banned' && !this.bannedAt) {
      this.bannedAt = now;
    } else if (this.status === 'pending') {
      // Reset timestamps when going back to pending
      this.approvedAt = null;
      this.bannedAt = null;
      this.banReason = null;
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
