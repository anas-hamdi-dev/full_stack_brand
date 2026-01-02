# Backend Context Documentation - MongoDB & Node.js

This document describes the backend requirements for implementing a MongoDB and Node.js backend API based on the frontend codebase. It serves as a specification for implementing the backend API and database schema using MongoDB and Mongoose.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Entity Definitions (Mongoose Schemas)](#entity-definitions-mongoose-schemas)
3. [Relationships](#relationships)
4. [User Roles & Permissions](#user-roles--permissions)
5. [API Responsibilities](#api-responsibilities)
6. [Data Constraints & Assumptions](#data-constraints--assumptions)
7. [MongoDB Implementation Details](#mongodb-implementation-details)
  8. [Client-Side Backend Integration](#client-side-backend-integration)
  9. [Admin Backend Requirements](#admin-backend-requirements)

---

## Technology Stack

  **Current Implementation:**
- **Runtime:** Node.js (v18+)
  - **Framework:** Express.js
- **Database:** MongoDB (v6+)
  - **ODM:** Mongoose (v8+)
- **Authentication:** JWT (jsonwebtoken) + bcrypt for password hashing
  - **Validation:** Joi (for request validation)
- **Environment:** dotenv for configuration
  - **CORS:** Enabled for cross-origin requests

---

## Entity Definitions (Mongoose Schemas)

### Users Collection

**Collection Name:** `users`

**Mongoose Schema:**

```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
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
          // For non-brand-owners, status should be undefined or null
          return v === undefined || v === null;
        },
        message: 'Status is required for brand owners and must be null/undefined for other roles'
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
        // brand_id should only exist for brand_owner role
          const role = this.role || (this.get ? this.get('role') : null);
          if (role === 'brand_owner') {
            return v !== null && v !== undefined;
        }
          return v === null || v === undefined;
      },
        message: 'Brand ID is required for brand owners and must be null for clients and admins'
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
```

**Notes:**
- `brand_id` is only populated for users with `role = "brand_owner"`
  - `brand_id` should be NULL for users with `role = "client"` or `role = "admin"`
  - `status` is only set for `brand_owner` role: `'pending'` (default), `'approved'`, or `'banned'`
  - `status` is `undefined`/`null` for `client` and `admin` roles
  - `approvedAt` is automatically set when status changes to `'approved'` (via pre-save hook)
  - `bannedAt` and `banReason` are set when status changes to `'banned'` (via admin action)
  - Password must be hashed using bcrypt before saving (handled by pre-save hook)
- Use `select: false` on password field to prevent accidental exposure
  - Role `'admin'` is for admin panel access (separate from brand owners)
  - **User status is the source of truth** for brand owner lifecycle management

---

### Categories Collection

**Collection Name:** `categories`

**Mongoose Schema:**

```javascript
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
      trim: true,
      validate: {
        validator: function(v) {
          // Icon can be a URL (for uploaded images) or icon name (for legacy support)
          return !v || /^https?:\/\/.+/.test(v) || v.length > 0;
        },
        message: 'Icon must be a valid URL or icon identifier'
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
```

**Notes:**
- Categories are pre-defined and typically not created by users
  - `icon` field stores image URL (for uploaded category icons) or icon identifier
- `brand_count` should be updated when brands are added/removed from category
- Use Mongoose middleware (post-save hooks) to update brand_count automatically
  - `updateBrandCount()` method recalculates and updates the brand_count field

---

### Brands Collection

**Collection Name:** `brands`

**Mongoose Schema:**

```javascript
const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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
  brandSchema.index({ ownerId: 1 }); // For finding brands by owner
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
```

**Notes:**
  - `ownerId` is required and references the User who owns this brand
- `is_featured` defaults to `false`
- Social media URLs should be validated as proper URLs
- Brand name should be unique
- Use Mongoose middleware to update category brand_count automatically
  - **No status field:** Brands do not have a status field. Brand visibility is controlled by the brand owner's user status (approved/banned/pending)

---

### Products Collection

**Collection Name:** `products`

**Mongoose Schema:**

```javascript
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  price: {
    type: Number,
    min: 0,
    default: null
  },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
          return v.length > 0 && v.every(url => /^https?:\/\/.+/.test(url) || url.startsWith('data:image'));
      },
      message: 'At least one valid image URL is required'
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
```

**Notes:**
- Products must have at least one image
- `price` can be null (for display-only products)
- Images are stored as an array of URLs (MongoDB native array support)
- Products are owned by brands (brand owners can CRUD their own products)

---

### Brand Submissions Collection

**Collection Name:** `brand_submissions`

**Mongoose Schema:**

```javascript
const brandSubmissionSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contact_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  contact_phone: {
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
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
brandSubmissionSchema.index({ status: 1 });
brandSubmissionSchema.index({ createdAt: -1 });
```

**Notes:**
- This is a submission queue for new brands (not yet approved/created)
- `status` tracks approval workflow
- When approved, a new brand should be created in `brands` collection
- `category` is stored as string (may reference non-existent category during submission)

---

### Contact Messages Collection

**Collection Name:** `contact_messages`

**Mongoose Schema:**

```javascript
const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
}, {
  timestamps: true
});

// Indexes
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });
```

**Notes:**
- Used for contact form submissions
- `status` tracks message handling workflow
- No user authentication required (public form)

---

### Favorites Collection

**Collection Name:** `favorites`

**Mongoose Schema:**

```javascript
const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Indexes for efficient queries
favoriteSchema.index({ user_id: 1 });
favoriteSchema.index({ product_id: 1 });

// Virtual to populate product
favoriteSchema.virtual('product', {
  ref: 'Product',
  localField: 'product_id',
  foreignField: '_id',
  justOne: true
});
```

**Notes:**
- Only clients can have favorites (enforced by application logic)
- Compound unique index on `(user_id, product_id)` prevents duplicates
- Used to track which products clients have favorited

---

## Relationships

### Entity Relationship Diagram

```
users
├── brand_id → brands._id (one-to-one, optional, for brand_owner role)
└── favorites (one-to-many via favorites collection)

brands
├── category_id → categories._id (many-to-one)
└── products (one-to-many via products collection)

categories
└── brands (one-to-many via brands collection)

products
├── brand_id → brands._id (many-to-one)
└── favorites (one-to-many via favorites collection)

favorites
├── user_id → users._id (many-to-one)
└── product_id → products._id (many-to-one)

brand_submissions (standalone, no relationships)
contact_messages (standalone, no relationships)
```

### Relationship Details

1. **User → Brand (One-to-One, Optional)**
   - Only exists when `user.role = "brand_owner"`
   - One user can own one brand
   - One brand is owned by one user
   - **Implementation:** Reference using `ObjectId` in `user.brand_id`

2. **Brand → Category (Many-to-One)**
   - Many brands belong to one category
   - Brand can have null `category_id`
   - **Implementation:** Reference using `ObjectId` in `brand.category_id`

3. **Brand → Products (One-to-Many)**
   - One brand can have many products
   - Products must belong to a brand
   - **Implementation:** Reference using `ObjectId` in `product.brand_id`

4. **User → Favorites (One-to-Many)**
   - One user can favorite many products
   - Only clients can create favorites
   - **Implementation:** Separate `favorites` collection with `user_id` reference

5. **Product → Favorites (One-to-Many)**
   - One product can be favorited by many users
   - **Implementation:** Separate `favorites` collection with `product_id` reference

### Populating Relationships

Use Mongoose `.populate()` to fetch related data:

```javascript
// Populate brand with category
const brand = await Brand.findById(brandId).populate('category_id');

// Populate product with brand
const product = await Product.findById(productId).populate('brand_id');

// Populate favorites with products and brands
const favorites = await Favorite.find({ user_id: userId })
  .populate({
    path: 'product_id',
    populate: {
      path: 'brand_id',
      select: 'name logo_url website'
    }
  });
```

---

## User Roles & Permissions

### Role: `client`

  **Capabilities (MVP - Simplified):**
  - View brands and products (public browsing)
  - Browse by category
  - View brand and product details
  - Add/remove favorites
  - View own favorites
  - Submit contact messages
  - Update own profile (name, email, phone)

**Restrictions:**
  - Cannot create/edit/delete brands or products
  - Cannot access brand owner features
- Cannot modify other users' data

### Role: `brand_owner`

  **Capabilities (MVP - Simplified):**
  - All client capabilities (browse and favorite)
  - Access dashboard (only when `status = 'approved'`)
  - Edit own brand: name, description, category, logo, contact info, social links
  - Manage own products (only when `status = 'approved'`):
    - Create products (name, description, images, price)
    - Update products
  - Delete products
  - View own brand's products
  - Update own profile (name, email, phone)

  **Status States:**
  - `pending`: Awaiting admin approval (default)
  - `approved`: Can access dashboard and manage brand/products
  - `banned`: Account banned, cannot access dashboard

**Restrictions:**
  - Can only manage own brand and its products
  - Cannot access dashboard when `status !== 'approved'`

  ### Role: `admin`

  **Capabilities:**
  - Access admin panel dashboard
  - Full CRUD on all brands (regardless of ownership)
  - Full CRUD on all products (regardless of ownership)
  - Full CRUD on categories
  - Manage brand owner status (approve/decline/pending)
  - View and manage brand submissions (planned)
  - View and manage contact messages (planned)
  - View system statistics (planned)

  **Restrictions:**
  - Cannot change own role
  - Cannot modify other admin accounts
  - No status field (status only applies to brand_owner)

### Authentication & Authorization

**Authentication:**
- Email + password login
- JWT token-based authentication
- Sign-up creates new user account
- Sign-out invalidates token (client-side)

**Authorization Middleware Example:**

```javascript
// Middleware to check if user is brand owner
const isBrandOwner = async (req, res, next) => {
  if (req.user.role !== 'brand_owner') {
    return res.status(403).json({ error: 'Access denied. Brand owner role required.' });
  }
  next();
};

// Middleware to check brand ownership
const checkBrandOwnership = async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }
  if (req.user.brand_id.toString() !== brand._id.toString()) {
    return res.status(403).json({ error: 'Access denied. You do not own this brand.' });
  }
  next();
};

  // Middleware to check if brand owner is approved
  const isBrandOwnerApproved = async (req, res, next) => {
    if (req.user.role !== 'brand_owner') {
      return res.status(403).json({ error: 'Access denied. Brand owner role required.' });
    }
    if (req.user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Account awaiting admin approval',
        status: 'pending',
        message: 'Your account is pending admin approval. You will be notified once approved.'
      });
    }
    if (req.user.status === 'banned') {
      return res.status(403).json({ 
        error: 'Account banned',
        status: 'banned',
        message: req.user.banReason || 'Your account has been banned. Please contact support for more information.',
        bannedAt: req.user.bannedAt
      });
    }
    if (req.user.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied. Account not approved.' });
  }
  next();
};
```

---

## API Responsibilities

### Authentication Endpoints

#### `POST /api/auth/signin`
- **Request:** `{ email: string, password: string }`
- **Response:** `{ user: User, token: string }`
- **Implementation:**
```javascript
const user = await User.findOne({ email }).select('+password');
if (!user || !(await bcrypt.compare(password, user.password))) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ user, token });
```

#### `POST /api/auth/signup`
  - **Request:** `{ email: string, password: string, full_name: string, phone?: string, role: "client" | "brand_owner" }`
- **Response:** `{ user: User, token: string }`
  - **Note:** For brand_owner, brand is created automatically with basic info
- **Implementation:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
let brandId = null;
if (role === 'brand_owner') {
  const brand = await Brand.create({
      name: `${full_name}'s Brand`,
      ownerId: null, // Will be set after user creation
      category_id: null
  });
  brandId = brand._id;
}
const user = await User.create({
  email,
  password: hashedPassword,
    full_name,
  phone,
  role,
  brand_id: brandId
});
  // Update brand ownerId if brand owner
  if (role === 'brand_owner' && brandId) {
    await Brand.findByIdAndUpdate(brandId, { ownerId: user._id });
  }
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.status(201).json({ user, token });
```

#### `GET /api/auth/me`
- **Request:** (authenticated)
- **Response:** `{ user: User }`
- **Implementation:**
```javascript
const user = await User.findById(req.userId).populate('brand_id');
res.json({ user });
```

---

### Users Endpoints

  #### `PATCH /api/users/me`
  - **Request:** `{ full_name?: string, phone?: string }` (authenticated)
  - **Response:** `{ user: User }` (updated, without password)
  - **Note:** Use `/api/auth/me` to get current user. Email changes require separate endpoint (not in MVP)
- **MongoDB Query:**
```javascript
const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: req.body },
  { new: true, runValidators: true }
).select('-password');
res.json({ user });
```

---

### Categories Endpoints

#### `GET /api/categories`
- **Request:** (public)
- **Response:** `Category[]`
- **MongoDB Query:**
```javascript
const categories = await Category.find().sort({ name: 1 });
res.json({ data: categories });
```

#### `GET /api/categories/:id`
- **Request:** (public)
- **Response:** `Category`
- **MongoDB Query:**
```javascript
const category = await Category.findById(req.params.id);
if (!category) {
  return res.status(404).json({ error: 'Category not found' });
}
res.json({ data: category });
```

---

### Brands Endpoints

#### `GET /api/brands`
  - **Request:** (public, optional: `category_id`, `search`, `limit`)
  - **Response:** `{ data: Brand[] }`
  - **Note:** Simple filtering - no pagination for MVP
- **MongoDB Query:**
```javascript
const query = {};
if (req.query.category_id) {
  query.category_id = req.query.category_id;
}
if (req.query.search) {
  query.name = { $regex: req.query.search, $options: 'i' };
}
  const limit = parseInt(req.query.limit) || 50;
const brands = await Brand.find(query)
  .populate('category_id', 'name icon')
  .sort({ createdAt: -1 })
    .limit(limit);
res.json({ data: brands });
```

#### `GET /api/brands/:id`
- **Request:** (public)
  - **Response:** `{ data: Brand }` (with category)
- **MongoDB Query:**
```javascript
const brand = await Brand.findById(req.params.id)
    .populate('category_id', 'name icon');
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }
res.json({ data: brand });
```

#### `PATCH /api/brands/:id`
  - **Request:** `{ name?, category_id?, description?, logo_url?, location?, website?, instagram?, facebook?, phone?, email? }` (authenticated, brand owner only)
  - **Response:** `{ data: Brand }` (updated)
  - **Authorization:** `authenticate`, `isBrandOwnerApproved`, `checkBrandOwnership`
- **MongoDB Query:**
```javascript
  // Middleware ensures user is approved brand owner and owns the brand
const brand = await Brand.findByIdAndUpdate(
  req.params.id,
    { $set: req.body },
  { new: true, runValidators: true }
  ).populate('category_id', 'name icon');
res.json({ data: brand });
```

---

### Products Endpoints

#### `GET /api/products`
  - **Request:** (public, optional: `brand_id`, `category_id`, `search`, `limit`)
  - **Response:** `{ data: Product[] }`
  - **Note:** Simple filtering - no pagination for MVP
- **MongoDB Query:**
```javascript
  const { brand_id, category_id, search, limit } = req.query;
const query = {};
  if (brand_id) {
    query.brand_id = brand_id;
}
  if (category_id) {
    const brands = await Brand.find({ category_id });
  query.brand_id = { $in: brands.map(b => b._id) };
}
  if (search) {
    query.name = { $regex: search, $options: 'i' };
}
  const limitNum = parseInt(limit) || 50;
const products = await Product.find(query)
  .populate({
    path: 'brand_id',
      select: 'name logo_url',
    populate: {
      path: 'category_id',
      select: 'name icon'
    }
  })
  .sort({ createdAt: -1 })
    .limit(limitNum);
res.json({ data: products });
```

#### `GET /api/products/:id`
- **Request:** (public)
- **Response:** `Product` (with nested brand info)
- **MongoDB Query:**
```javascript
const product = await Product.findById(req.params.id)
  .populate({
    path: 'brand_id',
    populate: { path: 'category_id' }
  });
res.json({ data: product });
```

#### `POST /api/products`
  - **Request:** `{ name: string, description?: string, price?: number, images: string[] }` (authenticated, brand owner only)
  - **Response:** `{ data: Product }` (created)
  - **Authorization:** `authenticate`, `isBrandOwnerApproved`
  - **Note:** `brand_id` is automatically set from authenticated user's brand
- **MongoDB Query:**
```javascript
  if (!req.body.name || !req.body.images || req.body.images.length === 0) {
    return res.status(400).json({ error: 'Name and at least one image are required' });
  }
const product = await Product.create({
    name: req.body.name,
    description: req.body.description,
    brand_id: req.user.brand_id,
    price: req.body.price || null,
    images: req.body.images
});
await product.populate({
  path: 'brand_id',
    select: 'name logo_url',
    populate: { path: 'category_id', select: 'name icon' }
});
res.status(201).json({ data: product });
```

#### `PATCH /api/products/:id`
  - **Request:** `{ name?, description?, price?, images? }` (authenticated, brand owner only)
  - **Response:** `{ data: Product }` (updated)
  - **Authorization:** `authenticate`, `isBrandOwnerApproved`, `checkProductOwnership`
- **MongoDB Query:**
```javascript
  // Middleware ensures user owns the product's brand
const product = await Product.findByIdAndUpdate(
  req.params.id,
    { $set: req.body },
  { new: true, runValidators: true }
).populate({
  path: 'brand_id',
    select: 'name logo_url',
    populate: { path: 'category_id', select: 'name icon' }
});
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
res.json({ data: product });
```

#### `DELETE /api/products/:id`
  - **Request:** (authenticated, brand owner only)
- **Response:** `{ success: boolean }`
  - **Authorization:** `authenticate`, `isBrandOwnerApproved`, `checkProductOwnership`
- **MongoDB Query:**
```javascript
  // Middleware ensures user owns the product's brand
const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
}
  // Delete associated favorites
await Favorite.deleteMany({ product_id: req.params.id });
  await Product.findByIdAndDelete(req.params.id);
res.json({ success: true });
```

---

### Favorites Endpoints

#### `GET /api/favorites`
  - **Request:** (authenticated)
  - **Response:** `{ data: Product[] }` (user's favorited products)
- **MongoDB Query:**
```javascript
const favorites = await Favorite.find({ user_id: req.userId })
  .populate({
    path: 'product_id',
    populate: {
      path: 'brand_id',
        select: 'name logo_url',
        populate: { path: 'category_id', select: 'name icon' }
    }
  });
const products = favorites.map(fav => fav.product_id);
res.json({ data: products });
```

#### `POST /api/favorites`
  - **Request:** `{ product_id: string }` (authenticated)
  - **Response:** `{ data: Favorite }` (created)
- **MongoDB Query:**
```javascript
const favorite = await Favorite.create({
  user_id: req.userId,
  product_id: req.body.product_id
});
  await favorite.populate({
    path: 'product_id',
    populate: { path: 'brand_id', select: 'name logo_url' }
  });
res.status(201).json({ data: favorite });
```

#### `DELETE /api/favorites/:productId`
  - **Request:** (authenticated)
- **Response:** `{ success: boolean }`
- **MongoDB Query:**
```javascript
await Favorite.findOneAndDelete({
  user_id: req.userId,
  product_id: req.params.productId
});
res.json({ success: true });
```

  ---

  ### Brand Submissions Endpoints

  **Note:** Brand Submission feature is deferred for MVP. Clients can sign up directly as brand owners. Admin can create brands directly.

  ---

  ### Contact Messages Endpoints

  #### `POST /api/contact-messages`
  - **Request:** `{ name: string, email: string, subject: string, message: string }` (public)
  - **Response:** `{ data: ContactMessage }` (created)
- **MongoDB Query:**
```javascript
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const contactMessage = await ContactMessage.create({
    name,
    email,
    subject,
    message,
    status: 'new'
  });
  res.status(201).json({ data: contactMessage });
```

---

  ### Admin Endpoints

  **Base Path:** `/api/admin`

  **Authorization:** All admin endpoints require `authenticate` and `isAdmin` middleware

  #### `GET /api/admin/brand-owners`
  - **Request:** (authenticated, admin role only, optional query: `search`, `status`, `page`, `limit`)
  - **Response:** `{ data: User[], pagination?: {...} }` (all brand owners with populated brand_id)
  - **Query Parameters:**
    - `search`: Search by name or email (case-insensitive)
    - `status`: Filter by status (`pending`, `approved`, `banned`, or `all`)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
- **MongoDB Query:**
```javascript
  const { search, status, page, limit } = req.query;
  const query = { role: 'brand_owner' };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [brandOwners, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('brand_id', 'name logo_url category_id')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip),
    User.countDocuments(query)
  ]);

  res.json({
    data: brandOwners,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `PATCH /api/admin/brand-owners/:id/approve`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User, message: string }`
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }
  user.status = 'approved';
  await user.save();
  res.json({ data: user, message: 'Brand owner approved successfully' });
  ```

  #### `PATCH /api/admin/users/:id/approve`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User, message: string }`
  - **Action:** Approves brand owner account
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }

  // Validate status transition
  if (user.status === 'approved') {
    return res.status(400).json({ error: 'Brand owner is already approved' });
  }

  // Update user status and approvedAt
  user.status = 'approved';
  user.approvedAt = new Date();
  user.bannedAt = null;
  user.banReason = null;
  await user.save();

  await user.populate('brand_id', 'name logo_url category_id');
  res.json({ 
    data: user, 
    message: 'Brand owner approved successfully' 
  });
  ```

  #### `PATCH /api/admin/users/:id/ban`
  - **Request:** `{ banReason?: string }` (authenticated, admin role only)
  - **Response:** `{ data: User, brand?: Brand, message: string }`
  - **Action:** Bans brand owner account and syncs brand status to 'disabled'
  - **MongoDB Query:**
  ```javascript
  const { banReason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }

  // Validate status transition
  if (user.status === 'banned') {
    return res.status(400).json({ error: 'Brand owner is already banned' });
  }

  // Update user status and bannedAt
  user.status = 'banned';
  user.bannedAt = new Date();
  user.banReason = banReason || null;
  await user.save();

  await user.populate('brand_id', 'name logo_url category_id');
  res.json({ 
    data: user, 
    message: 'Brand owner banned successfully' 
  });
  ```

  #### `PATCH /api/admin/users/:id/unban`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User, message: string }`
  - **Action:** Unbans brand owner account and sets status back to 'approved'
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }

  // Validate status transition
  if (user.status !== 'banned') {
    return res.status(400).json({ error: 'Brand owner is not banned' });
  }

  // Update user status
  user.status = 'approved';
  user.approvedAt = new Date();
  user.bannedAt = null;
  user.banReason = null;
  await user.save();

  await user.populate('brand_id', 'name logo_url category_id');
  res.json({ 
    data: user, 
    message: 'Brand owner unbanned successfully' 
  });
  ```

  #### `PATCH /api/admin/users/:id/set-pending`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User, message: string }`
  - **Action:** Sets brand owner status to 'pending'
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }

  // Update user status to pending
  user.status = 'pending';
  user.approvedAt = null;
  user.bannedAt = null;
  user.banReason = null;
  await user.save();

  await user.populate('brand_id', 'name logo_url category_id');
  res.json({ 
    data: user, 
    message: 'Brand owner status set to pending successfully' 
  });
  ```

  #### `DELETE /api/admin/users/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **Action:** Deletes brand owner and associated brand records safely
  - **Validation:**
    - Cannot delete own account
    - If deleting brand_owner, deletes associated brand, products, and favorites
  - **MongoDB Query:**
  ```javascript
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // If brand_owner, delete associated brand, products, and favorites
  if (user.role === 'brand_owner' && user.brand_id) {
    const products = await Product.find({ brand_id: user.brand_id });
    const productIds = products.map(p => p._id);
    await Favorite.deleteMany({ product_id: { $in: productIds } });
    await Product.deleteMany({ brand_id: user.brand_id });
    await Brand.findByIdAndDelete(user.brand_id);
  }

  // Delete user favorites if client
  if (user.role === 'client') {
    await Favorite.deleteMany({ user_id: req.params.id });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
  ```

  #### `PATCH /api/admin/brand-owners/:id/status` (Legacy - Use /users/:id/approve, /ban, /unban, /set-pending instead)
  - **Request:** `{ status: "pending" | "approved" | "banned" }` (authenticated, admin role only)
  - **Response:** `{ data: User, message: string }`
  - **Note:** This endpoint is maintained for backward compatibility. Prefer using the specific approve/ban/unban/set-pending endpoints above.
  - **MongoDB Query:**
  ```javascript
  const { status } = req.body;
  if (!['pending', 'approved', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'brand_owner') {
    return res.status(404).json({ error: 'Brand owner not found' });
  }

  // Update status and timestamps
  const now = new Date();
  if (status === 'approved') {
    user.approvedAt = now;
    user.bannedAt = null;
    user.banReason = null;
  } else if (status === 'banned') {
    user.bannedAt = now;
    user.approvedAt = null;
  } else if (status === 'pending') {
    user.approvedAt = null;
    user.bannedAt = null;
    user.banReason = null;
  }

  user.status = status;
  await user.save();

  await user.populate('brand_id', 'name logo_url category_id');
  res.json({ data: user, message: `Brand owner status updated to ${status}` });
  ```

  ---

  ## Admin Backend Requirements

  This section details all requirements for the Admin Panel backend implementation, based on the admin frontend codebase analysis.

  ### Admin Authentication & Authorization

  **Admin Role:**
  - Users with `role: "admin"` can access the admin panel
  - Admin users must have `brand_id: null` (admins don't own brands)
  - Admin users don't have a `status` field (status only applies to brand_owner role)
  - Admin authentication uses the same JWT system as other users

  **Admin Login:**
  - Admin users sign in via `POST /api/auth/signin` (same endpoint as other users)
  - Admin credentials are stored in the User collection with `role: "admin"`
  - Admin panel requires authentication via `authenticate` middleware
  - All admin routes require `isAdmin` middleware to verify `req.user.role === 'admin'`

  **Admin Middleware:**
  ```javascript
  // middleware/authorization.js
  const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
  };
  ```

  **Admin Security Constraints:**
  - All admin endpoints must be protected with `authenticate` and `isAdmin` middleware
  - Admin can access and modify all resources regardless of ownership
  - Admin can bypass brand ownership checks
  - Admin can manage brand owner status (pending, approved, banned) to control dashboard access

  ---

  ### Admin Dashboard Endpoints

  #### `GET /api/admin/dashboard/stats`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: { brands: number, products: number, categories: number, newMessages: number } }`
  - **MongoDB Query:**
  ```javascript
  const stats = {
    brands: await Brand.countDocuments(),
    products: await Product.countDocuments(),
    categories: await Category.countDocuments(),
    newMessages: await ContactMessage.countDocuments({ status: 'new' })
  };
  res.json({ data: stats });
  ```

  #### `GET /api/admin/dashboard/recent-brands`
  - **Request:** (authenticated, admin role only, optional query: `limit=5`)
  - **Response:** `{ data: Brand[] }` (with populated category)
  - **MongoDB Query:**
  ```javascript
  const limit = parseInt(req.query.limit) || 5;
  const brands = await Brand.find()
    .populate('category_id', 'name icon')
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ data: brands });
  ```

  ---

  ### Admin Brands Management Endpoints

  #### `GET /api/admin/brands`
  - **Request:** (authenticated, admin role only, optional query: `search`, `category_id`, `page`, `limit`, `sortBy`)
  - **Response:** `{ data: Brand[], pagination?: {...} }` (with populated category)
  - **Query Parameters:**
    - `search`: Search brands by name (case-insensitive)
    - `category_id`: Filter by category ID
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
    - `sortBy`: Sort field (`createdAt`, `name`) - default: `createdAt`
    - `sortOrder`: Sort order (`asc`, `desc`) - default: `desc`
  - **MongoDB Query:**
  ```javascript
  const { search, category_id, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (category_id) {
    query.category_id = category_id;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [brands, total] = await Promise.all([
    Brand.find(query)
      .populate('category_id', 'name icon')
      .populate('ownerId', 'full_name email status')
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip),
    Brand.countDocuments(query)
  ]);

  res.json({
    data: brands,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `POST /api/admin/brands`
  - **Request:** `{ name: string, ownerId?: string, category_id?: string, description?: string, logo_url?: string, location?: string, website?: string, instagram?: string, facebook?: string, phone?: string, email?: string, is_featured?: boolean }` (authenticated, admin role only)
  - **Response:** `{ data: Brand }` (created, with populated category and owner)
  - **Validation:**
    - `name` is required and must be unique
    - `ownerId` is optional (admin can create brands without owners)
    - `logo_url`, `website`, `instagram`, `facebook` must be valid URLs if provided
    - `email` must be valid email format if provided
  - **MongoDB Query:**
  ```javascript
  const brand = await Brand.create({
  ...req.body,
    is_featured: req.body.is_featured || false
  });
  await brand.populate('category_id', 'name icon');
  await brand.populate('ownerId', 'full_name email status');
  res.status(201).json({ data: brand });
  ```

  #### `PATCH /api/admin/brands/:id`
  - **Request:** `{ name?: string, ownerId?: string, category_id?: string, description?: string, logo_url?: string, location?: string, website?: string, instagram?: string, facebook?: string, phone?: string, email?: string, is_featured?: boolean }` (authenticated, admin role only)
  - **Response:** `{ data: Brand }` (updated, with populated category and owner)
  - **MongoDB Query:**
  ```javascript
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('category_id', 'name icon').populate('ownerId', 'full_name email status');

  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  res.json({ data: brand });
  ```

  #### `DELETE /api/admin/brands/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **Cascade Deletion:**
    - Delete all products belonging to the brand
    - Delete all favorites for products belonging to the brand
    - Update category brand_count if brand had a category
  - **MongoDB Query:**
  ```javascript
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  // Delete associated products and favorites
  const products = await Product.find({ brand_id: req.params.id });
  const productIds = products.map(p => p._id);
  await Favorite.deleteMany({ product_id: { $in: productIds } });
  await Product.deleteMany({ brand_id: req.params.id });

  // Delete brand
  await Brand.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Brand deleted successfully' });
```

---

  ### Admin Products Management Endpoints

  #### `GET /api/admin/products`
  - **Request:** (authenticated, admin role only, optional query: `search`, `brand_id`, `category_id`, `page`, `limit`, `sortBy`)
  - **Response:** `{ data: Product[], pagination?: {...} }` (with populated brand and category)
  - **Query Parameters:**
    - `search`: Search products by name (case-insensitive)
    - `brand_id`: Filter by brand ID
    - `category_id`: Filter by category ID (finds products from brands in that category)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
    - `sortBy`: Sort field (`createdAt`, `name`) - default: `createdAt`
    - `sortOrder`: Sort order (`asc`, `desc`) - default: `desc`
- **MongoDB Query:**
```javascript
  const { search, brand_id, category_id, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (brand_id) {
    query.brand_id = brand_id;
  }

  if (category_id) {
    // Find all brands in this category, then filter products
    const brands = await Brand.find({ category_id });
    query.brand_id = { $in: brands.map(b => b._id) };
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate({
        path: 'brand_id',
        select: 'name logo_url',
        populate: {
          path: 'category_id',
          select: 'name icon'
        }
      })
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip),
    Product.countDocuments(query)
  ]);

  res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `POST /api/admin/products`
  - **Request:** `{ name: string, brand_id: string, description?: string, price?: number, images: string[], external_url?: string }` (authenticated, admin role only)
  - **Response:** `{ data: Product }` (created, with populated brand)
  - **Validation:**
    - `name` is required
    - `brand_id` is required and must reference an existing brand
    - `images` must be a non-empty array of valid URLs
    - `price` must be >= 0 if provided
  - **MongoDB Query:**
  ```javascript
  if (!req.body.name || !req.body.brand_id || !req.body.images || req.body.images.length === 0) {
    return res.status(400).json({ error: 'Name, brand_id, and at least one image are required' });
  }

  const product = await Product.create({
  ...req.body,
    price: req.body.price || null
  });
  await product.populate({
    path: 'brand_id',
    populate: { path: 'category_id' }
  });
  res.status(201).json({ data: product });
  ```

  #### `PATCH /api/admin/products/:id`
  - **Request:** `{ name?: string, brand_id?: string, description?: string, price?: number, images?: string[], external_url?: string }` (authenticated, admin role only)
  - **Response:** `{ data: Product }` (updated, with populated brand)
  - **Validation:**
    - If `images` is provided, it must be a non-empty array
    - `brand_id` must reference an existing brand if provided
  - **MongoDB Query:**
  ```javascript
  if (req.body.images && req.body.images.length === 0) {
    return res.status(400).json({ error: 'At least one image is required' });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate({
    path: 'brand_id',
    populate: { path: 'category_id' }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ data: product });
  ```

  #### `DELETE /api/admin/products/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **Cascade Deletion:**
    - Delete all favorites for this product
  - **MongoDB Query:**
  ```javascript
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await Favorite.deleteMany({ product_id: req.params.id });
  await Product.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Product deleted successfully' });
  ```

  ---

  ### Admin Categories Management Endpoints

  #### `GET /api/admin/categories`
  - **Request:** (authenticated, admin role only, optional query: `search`, `page`, `limit`)
  - **Response:** `{ data: Category[] }` (sorted by name)
  - **Query Parameters:**
    - `search`: Search categories by name (case-insensitive)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
  - **MongoDB Query:**
  ```javascript
  const { search, page, limit } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [categories, total] = await Promise.all([
    Category.find(query)
      .sort({ name: 1 })
      .limit(limitNum)
      .skip(skip),
    Category.countDocuments(query)
  ]);

  res.json({
    data: categories,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `POST /api/admin/categories`
  - **Request:** `{ name: string, icon: string, description?: string }` (authenticated, admin role only)
  - **Response:** `{ data: Category }` (created)
  - **Validation:**
    - `name` is required and must be unique
    - `icon` is required (can be URL or icon identifier)
  - **MongoDB Query:**
  ```javascript
  const category = await Category.create({
    ...req.body,
    brand_count: 0
  });
  res.status(201).json({ data: category });
  ```

  #### `PATCH /api/admin/categories/:id`
  - **Request:** `{ name?: string, icon?: string, description?: string }` (authenticated, admin role only)
  - **Response:** `{ data: Category }` (updated)
  - **MongoDB Query:**
  ```javascript
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  res.json({ data: category });
  ```

  #### `DELETE /api/admin/categories/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **Validation:**
    - Cannot delete category if it has associated brands
  - **MongoDB Query:**
  ```javascript
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const brandCount = await Brand.countDocuments({ category_id: req.params.id });
  if (brandCount > 0) {
    return res.status(400).json({ 
      error: `Cannot delete category. ${brandCount} brand(s) are associated with this category.` 
    });
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted successfully' });
  ```

  ---

  ### Admin Contact Messages Management Endpoints

  #### `GET /api/admin/messages`
  - **Request:** (authenticated, admin role only, optional query: `search`, `status`, `sender`, `dateFrom`, `dateTo`, `page`, `limit`)
  - **Response:** `{ data: ContactMessage[], pagination?: {...} }` (sorted by newest first)
  - **Query Parameters:**
    - `search`: Search messages by name, email, or subject (case-insensitive)
    - `status`: Filter by status (`new`, `read`, `replied`, or `all`)
    - `sender`: Filter by sender email or name (case-insensitive)
    - `dateFrom`: Filter messages from this date (ISO date string)
    - `dateTo`: Filter messages until this date (ISO date string)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
  - **MongoDB Query:**
  ```javascript
  const { search, status, sender, dateFrom, dateTo, page, limit } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (sender) {
    query.$or = [
      { name: { $regex: sender, $options: 'i' } },
      { email: { $regex: sender, $options: 'i' } }
    ];
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.createdAt.$lte = new Date(dateTo);
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip),
    ContactMessage.countDocuments(query)
  ]);

  res.json({
    data: messages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `GET /api/admin/messages/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: ContactMessage }`
  - **MongoDB Query:**
  ```javascript
  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Mark as read if status is 'new'
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  res.json({ data: message });
  ```

  #### `PATCH /api/admin/messages/:id/status`
  - **Request:** `{ status: "new" | "read" | "replied" }` (authenticated, admin role only)
  - **Response:** `{ data: ContactMessage }` (updated)
  - **MongoDB Query:**
  ```javascript
  const { status } = req.body;
  if (!['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  );

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.json({ data: message });
  ```

  #### `DELETE /api/admin/messages/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **MongoDB Query:**
  ```javascript
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.json({ success: true, message: 'Message deleted successfully' });
  ```

  ---

  ### Admin Brand Submissions Management Endpoints

  **Note:** BrandSubmission model is required for managing brand submission requests.

  #### `GET /api/admin/brand-submissions`
  - **Request:** (authenticated, admin role only, optional query: `status`, `page`, `limit`)
  - **Response:** `{ data: BrandSubmission[] }` (sorted by newest first)
  - **Query Parameters:**
    - `status`: Filter by status (`pending`, `approved`, `rejected`, or `all`)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
  - **MongoDB Query:**
  ```javascript
  const { status, page, limit } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [submissions, total] = await Promise.all([
    BrandSubmission.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip),
    BrandSubmission.countDocuments(query)
  ]);

  res.json({
    data: submissions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `GET /api/admin/brand-submissions/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: BrandSubmission }`
  - **MongoDB Query:**
  ```javascript
  const submission = await BrandSubmission.findById(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Brand submission not found' });
  }
  res.json({ data: submission });
  ```

  #### `PATCH /api/admin/brand-submissions/:id/approve`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: BrandSubmission, brand?: Brand, message: string }`
  - **Action:** Creates a new Brand from the submission and updates submission status
  - **MongoDB Query:**
  ```javascript
  const submission = await BrandSubmission.findById(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Brand submission not found' });
  }

  if (submission.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending submissions can be approved' });
  }

  // Find or create category by name
  let category = await Category.findOne({ name: submission.category });
  if (!category) {
    category = await Category.create({
      name: submission.category,
      icon: '', // Default icon
      description: null,
      brand_count: 0
    });
  }

  // Create brand from submission
  const brand = await Brand.create({
    name: submission.brand_name,
    category_id: category._id,
    description: submission.description || null,
    email: submission.contact_email,
    phone: submission.contact_phone || null,
    website: submission.website || null,
    instagram: submission.instagram || null,
    is_featured: false
    // Note: ownerId should be set when a brand owner account is created
  });

  // Update submission status
  submission.status = 'approved';
  await submission.save();

  res.json({ 
    data: submission, 
    brand,
    message: 'Brand submission approved and brand created successfully' 
  });
  ```

  #### `PATCH /api/admin/brand-submissions/:id/reject`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: BrandSubmission, message: string }`
  - **MongoDB Query:**
  ```javascript
  const submission = await BrandSubmission.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'rejected' } },
    { new: true, runValidators: true }
  );

  if (!submission) {
    return res.status(404).json({ error: 'Brand submission not found' });
  }

  res.json({ data: submission, message: 'Brand submission rejected' });
  ```

  #### `DELETE /api/admin/brand-submissions/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **MongoDB Query:**
  ```javascript
  const submission = await BrandSubmission.findByIdAndDelete(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Brand submission not found' });
  }

  res.json({ success: true, message: 'Brand submission deleted successfully' });
  ```

  ---

  ### Admin User Management Endpoints

  #### `GET /api/admin/users`
  - **Request:** (authenticated, admin role only, optional query: `role`, `status`, `search`, `page`, `limit`)
  - **Response:** `{ data: User[], pagination?: {...} }` (without passwords, with populated brand_id for brand_owners)
  - **Query Parameters:**
    - `role`: Filter by role (`client`, `brand_owner`, `admin`, or `all`)
    - `status`: Filter by status (only applies to brand_owners: `pending`, `approved`, `declined`)
    - `search`: Search users by email or full_name (case-insensitive)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
  - **MongoDB Query:**
  ```javascript
  const { role, status, search, page, limit } = req.query;
  const query = {};

  if (role && role !== 'all') {
    query.role = role;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { full_name: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('brand_id', 'name logo_url')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip),
    User.countDocuments(query)
  ]);

  res.json({
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
  ```

  #### `GET /api/admin/users/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User }` (without password, with populated brand_id if brand_owner)
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('brand_id');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ data: user });
  ```

#### `PATCH /api/admin/users/:id`
- **Request:** `{ full_name?: string, email?: string, phone?: string, avatar_url?: string, role?: string, status?: string }` (authenticated, admin role only)
- **Response:** `{ data: User }` (updated, without password)
- **Validation:**
  - Cannot change own role (admin cannot demote themselves)
  - Cannot change email to an existing email
  - Status can only be set for brand_owner role
  - **Note:** For status changes, prefer using dedicated endpoints: `/admin/users/:id/approve`, `/admin/users/:id/ban`, `/admin/users/:id/unban`
  - **MongoDB Query:**
  ```javascript
  const updateData = { ...req.body };

  // Prevent admin from changing their own role
  if (updateData.role && req.user._id.toString() === req.params.id) {
    delete updateData.role;
  }

  // If changing email, check for duplicates
  if (updateData.email) {
    const existingUser = await User.findOne({ email: updateData.email });
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password').populate('brand_id');

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ data: user });
  ```

  #### `DELETE /api/admin/users/:id`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ success: boolean, message: string }`
  - **Validation:**
    - Cannot delete own account
    - If deleting brand_owner, optionally delete associated brand and products
  - **MongoDB Query:**
  ```javascript
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // If brand_owner, delete associated brand and products
  if (user.role === 'brand_owner' && user.brand_id) {
    const products = await Product.find({ brand_id: user.brand_id });
    const productIds = products.map(p => p._id);
    await Favorite.deleteMany({ product_id: { $in: productIds } });
    await Product.deleteMany({ brand_id: user.brand_id });
    await Brand.findByIdAndDelete(user.brand_id);
  }

  // Delete user favorites if client
  if (user.role === 'client') {
    await Favorite.deleteMany({ user_id: req.params.id });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
  ```

  ---

  ### Admin Settings & Profile Endpoints

  #### `GET /api/admin/profile`
  - **Request:** (authenticated, admin role only)
  - **Response:** `{ data: User }` (current admin user without password)
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.user._id).select('-password');
  res.json({ data: user });
  ```

  #### `PATCH /api/admin/profile`
  - **Request:** `{ full_name?: string, phone?: string, avatar_url?: string }` (authenticated, admin role only)
  - **Response:** `{ data: User }` (updated, without password)
  - **Note:** Admin cannot change email via profile endpoint (use user management endpoint)
  - **MongoDB Query:**
  ```javascript
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ data: user });
  ```

  #### `PATCH /api/admin/profile/password`
  - **Request:** `{ currentPassword: string, newPassword: string }` (authenticated, admin role only)
  - **Response:** `{ message: string }`
  - **MongoDB Query:**
  ```javascript
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
  ```

  ---

  ### Admin Data Models Updates

  **Note:** Brand model does not have a status field. Brand visibility is controlled by the brand owner's user status (approved/banned/pending).

  **BrandSubmission Model:**
  ```javascript
  // models/BrandSubmission.js
  const brandSubmissionSchema = new mongoose.Schema({
    brand_name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    contact_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    contact_phone: {
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
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }, {
    timestamps: true
  });

  brandSubmissionSchema.index({ status: 1 });
  brandSubmissionSchema.index({ createdAt: -1 });

  module.exports = mongoose.model('BrandSubmission', brandSubmissionSchema);
  ```

  **ContactMessage Model - Update Status:**
  ```javascript
  // models/ContactMessage.js - Ensure status field exists
  status: {
    type: String,
    required: true,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
  ```

  ---

  ### Admin Route Organization

  All admin routes should be organized under `/api/admin`:

  ```
  /api/admin
  ├── /dashboard
  │   ├── GET /stats
  │   └── GET /recent-brands
  ├── /brands
  │   ├── GET /
  │   ├── POST /
  │   ├── PATCH /:id
  │   └── DELETE /:id
  ├── /products
  │   ├── GET /
  │   ├── POST /
  │   ├── PATCH /:id
  │   └── DELETE /:id
  ├── /categories
  │   ├── GET /
  │   ├── POST /
  │   ├── PATCH /:id
  │   └── DELETE /:id
  ├── /messages
  │   ├── GET /
  │   ├── GET /:id
  │   ├── PATCH /:id/status
  │   └── DELETE /:id
  ├── /brand-submissions
  │   ├── GET /
  │   ├── GET /:id
  │   ├── PATCH /:id/approve
  │   ├── PATCH /:id/reject
  │   └── DELETE /:id
  ├── /users
  │   ├── GET /
  │   ├── GET /:id
  │   ├── PATCH /:id
  │   ├── PATCH /:id/approve
  │   ├── PATCH /:id/ban
  │   ├── PATCH /:id/unban
  │   ├── PATCH /:id/set-pending
  │   └── DELETE /:id
  ├── /brand-owners (alternative endpoint grouping)
  │   ├── GET /
  │   ├── PATCH /:id/approve
  │   ├── PATCH /:id/ban
  │   ├── PATCH /:id/unban
  │   ├── PATCH /:id/set-pending
  │   └── PATCH /:id/status (legacy)
  └── /profile
      ├── GET /
      ├── PATCH /
      └── PATCH /password
  ```

  **Middleware Chain for Admin Routes:**
  ```javascript
  // All admin routes use:
  router.use(authenticate);
  router.use(isAdmin);

  // Example route definition:
  router.get('/dashboard/stats', async (req, res) => {
    // Admin dashboard stats logic
  });
  ```

  ---

  ### Admin Request/Response Examples

  **Example: Create Brand**
  ```json
  // Request: POST /api/admin/brands
  {
    "name": "New Fashion Brand",
    "ownerId": "507f1f77bcf86cd799439010",
    "category_id": "507f1f77bcf86cd799439011",
    "description": "A new fashion brand",
    "logo_url": "data:image/png;base64,...",
    "location": "Tunis, Tunisia",
    "website": "https://example.com",
    "instagram": "https://instagram.com/brand",
    "facebook": "https://facebook.com/brand",
    "phone": "+216 12 345 678",
    "email": "contact@brand.tn",
    "is_featured": true
  }

  // Response: 201 Created
  {
    "data": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "New Fashion Brand",
      "ownerId": {
        "_id": "507f1f77bcf86cd799439010",
        "full_name": "John Doe",
        "email": "john@example.com",
        "status": "approved"
      },
      "category_id": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Fashion",
        "icon": "Shirt"
      },
      "description": "A new fashion brand",
      "logo_url": "data:image/png;base64,...",
      "is_featured": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
  ```

  **Example: Get Dashboard Stats**
  ```json
  // Request: GET /api/admin/dashboard/stats

  // Response: 200 OK
  {
    "data": {
      "brands": 25,
      "products": 150,
      "categories": 8,
      "newMessages": 3
    }
  }
  ```

  **Example: Search Brands**
  ```json
  // Request: GET /api/admin/brands?search=fashion&category_id=507f1f77bcf86cd799439011&page=1&limit=20

  // Response: 200 OK
  {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Fashion Brand",
        "ownerId": {
          "_id": "507f1f77bcf86cd799439010",
          "full_name": "John Doe",
          "email": "john@example.com",
          "status": "approved"
        },
        "category_id": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Fashion",
          "icon": "Shirt"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

  ---

  ### Admin Security & Validation Rules

  1. **Authentication:** All admin endpoints require valid JWT token
  2. **Authorization:** All admin endpoints require `role: "admin"`
  3. **Data Access:** Admins can access and modify all resources regardless of ownership
  4. **Self-Protection:** Admins cannot delete or demote themselves
  5. **Validation:** All input data must be validated (URLs, emails, required fields)
  6. **Cascade Deletion:** When deleting brands/products, associated data must be cleaned up
  7. **Status Management:** Brand owner status (pending/approved/banned) controls dashboard access
  8. **File Uploads:** Logo and image URLs can be data URLs (base64) or external URLs
  9. **Search:** All search operations should be case-insensitive and use regex
  10. **Pagination:** All list endpoints should support pagination with reasonable defaults

  ---

  **Note:** Additional admin endpoints for managing brands, products, categories, submissions, and messages are now fully specified above.

---

## Data Constraints & Assumptions

### General Constraints

1. **IDs:** All IDs are MongoDB ObjectIds (converted to strings in JSON)
2. **Timestamps:** Use Mongoose `timestamps: true` for `createdAt` and `updatedAt`
3. **URLs:** All URL fields should be validated using regex or URL validator
4. **Email:** Email fields must be validated using regex or email validator
5. **Phone:** Phone numbers stored as strings (format: "+216 XX XXX XXX" for Tunisia)

### User Constraints

1. **Email Uniqueness:** Enforced by MongoDB unique index
  2. **Role Immutability:** User role should not change after creation (enforced in routes/users.js)
3. **Brand Owner Brand:** Brand owners must have a `brand_id` set (enforced by schema validation)
  4. **Client/Admin Brand:** Clients and admins must have `brand_id = null` (enforced by schema validation)
  5. **Brand Owner Status:** Brand owners have status: `'pending'` (default), `'approved'`, or `'declined'`
  6. **Status Access Control:** Brand owners can only access dashboard when `status === 'approved'`
  7. **Admin Role:** Admin role exists for admin panel access (separate from brand owners)

### Brand Constraints

1. **Brand Name:** Enforced by MongoDB unique index
2. **Category:** `category_id` can be null (brands without category)
3. **Featured:** `is_featured` defaults to `false`
4. **Ownership:** One brand can only be owned by one user (enforced by application logic)
  5. **Logo URL:** Can be a data URL (base64) for uploaded images or external URL
  6. **No Status Field:** Brands do not have a status field. Brand visibility is controlled by the brand owner's user status
  7. **Admin Access:** Admins can manage all brands regardless of ownership

### Product Constraints

1. **Images:** Products must have at least one image (enforced by schema validation)
2. **Brand Required:** Products must belong to a brand (`brand_id` required)
3. **Price:** Price can be null (for display-only products)
4. **Image URLs:** All image URLs must be valid URLs (enforced by schema validation)

### Category Constraints

1. **Name Uniqueness:** Enforced by MongoDB unique index
2. **Brand Count:** `brand_count` should be computed/updated using Mongoose middleware
  3. **Icon:** `icon` field stores image URL (for uploaded category icons) or icon identifier
  4. **Auto-Update:** `brand_count` is automatically updated when brands are added/removed via post-save hooks

### Favorite Constraints

1. **Client Only:** Only users with `role = "client"` can create favorites (enforced by middleware)
2. **Uniqueness:** Compound unique index on `(user_id, product_id)` prevents duplicates
3. **Product Existence:** Product must exist when creating favorite (validate in application logic)

### MongoDB Indexes

**Required Indexes:**

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ brand_id: 1 });
db.users.createIndex({ role: 1 });

// Categories
db.categories.createIndex({ name: 1 }, { unique: true });

// Brands
db.brands.createIndex({ name: 1 }, { unique: true });
db.brands.createIndex({ category_id: 1 });
db.brands.createIndex({ is_featured: 1 });
db.brands.createIndex({ createdAt: -1 });

// Products
db.products.createIndex({ brand_id: 1 });
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ createdAt: -1 });

// Favorites
db.favorites.createIndex({ user_id: 1, product_id: 1 }, { unique: true });
db.favorites.createIndex({ user_id: 1 });
db.favorites.createIndex({ product_id: 1 });

// Brand Submissions
db.brand_submissions.createIndex({ status: 1 });
db.brand_submissions.createIndex({ createdAt: -1 });

// Contact Messages
db.contact_messages.createIndex({ status: 1 });
db.contact_messages.createIndex({ createdAt: -1 });
```

---

## MongoDB Implementation Details

### Connection Setup

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        console.error('Error: MONGODB_URI is not defined in environment variables');
        console.error('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/brands_app');
        process.exit(1);
      }

      const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/brands_app
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=5000
```

### Password Hashing

```javascript
// models/User.js - Pre-save hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### JWT Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
```

### Error Handling

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
```

### API Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... } // Optional, only in development
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

### Pagination Helper

```javascript
// utils/pagination.js
const paginate = async (Model, query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Model.find(query).limit(limit).skip(skip),
    Model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = paginate;
```

  ---

  ---

  ## Client-Side Backend Integration

  ### API Base URL

  The backend API is typically served at:
  - **Development:** `http://localhost:5000/api`
  - **Production:** Configure via environment variable `API_BASE_URL`

  ### Request/Response Format

  **Standard Request Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>  // For authenticated endpoints
  ```

  **Success Response Format:**
  ```json
  {
    "data": { ... },
    "message": "Optional success message",
    "pagination": {  // For paginated endpoints
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
  ```

  **Error Response Format:**
  ```json
  {
    "error": {
      "message": "Error description",
      "code": "ERROR_CODE",  // Optional
      "details": { ... }     // Optional, only in development
    }
  }
  ```

  ### Authentication Flow

  1. **Sign Up:** `POST /api/auth/signup`
    - Returns `{ user, token }`
    - Store token in localStorage/sessionStorage
    - Brand owners start with `status: "pending"`

  2. **Sign In:** `POST /api/auth/signin`
    - Returns `{ user, token }`
    - Store token for subsequent requests

  3. **Authenticated Requests:**
    - Include `Authorization: Bearer <token>` header
    - Token expires after 7 days

  4. **Get Current User:** `GET /api/auth/me`
    - Validates token and returns current user
    - Use to check authentication status on app load

  ### Brand Owner Status Workflow

  1. **Sign Up as Brand Owner:**
    - User creates account with `role: "brand_owner"`
    - Brand is automatically created and linked
    - User `status` is set to `"pending"`
    - User cannot access brand owner dashboard yet

  2. **Admin Approval:**
    - Admin reviews brand owner via `/api/admin/brand-owners`
    - Admin updates status to `"approved"` via `/api/admin/brand-owners/:id/status`
    - Once approved, brand owner can access dashboard and manage brand/products

  3. **Status States:**
    - `"pending"`: Awaiting admin approval (default for new brand owners)
    - `"approved"`: Can access brand owner features
    - `"declined"`: Account rejected/banned, cannot access brand owner features

  ### Pagination

  Most list endpoints support pagination via query parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

  Response includes pagination metadata:
  ```json
  {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
  ```

  ### Error Handling

  **Common HTTP Status Codes:**
  - `200` - Success
  - `201` - Created
  - `400` - Bad Request (validation errors)
  - `401` - Unauthorized (not authenticated or invalid token)
  - `403` - Forbidden (not authorized for this action)
  - `404` - Not Found
  - `409` - Conflict (e.g., duplicate email, already favorited)
  - `500` - Internal Server Error

  **Client-Side Error Handling:**
  ```javascript
  try {
    const response = await fetch('/api/endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    // Handle error (show toast, log, etc.)
  }
  ```

  ### CORS Configuration

  The backend has CORS enabled to allow requests from frontend applications. Ensure frontend origin is whitelisted in production.

---

## Summary

  This MongoDB/Node.js backend supports:

  - **Three user roles:** clients, brand owners, and admins
- **Core entities:** users, brands, products, categories, favorites, brand submissions, contact messages
  - **CRUD operations:** Full CRUD for brands and products (with ownership and status checks)
  - **Authentication:** Email/password with JWT tokens (7-day expiration)
  - **Authorization:** Role-based and resource ownership checks with status validation
  - **Brand Owner Approval:** Brand owners require admin approval (`status: "approved"`) to access features
- **Public endpoints:** Categories, brands, products (read-only)
  - **Protected endpoints:** User profile, favorites, brand/product management, admin functions
  - **Admin endpoints:** Brand owner management, status updates, system administration

**Key MongoDB Features:**
- Use Mongoose ODM for schema definition and validation
- Use ObjectId references for relationships
- Use `.populate()` for fetching related data
- Use indexes for performance optimization
- Use middleware for automatic updates (e.g., brand_count)
- Use compound indexes for unique constraints (favorites)
  - Use pre-save hooks for password hashing

  **Implementation Status (MVP - Simplified):**
  - ✅ **Core Models:** User (simplified: full_name only, no avatar), Brand, Product (no external_url), Category, Favorite, ContactMessage
  - ✅ **Authentication:** signin, signup, me (no signout endpoint)
  - ✅ **User Management:** update profile via `/api/users/me` (name, phone only)
  - ✅ **Public Browsing:** brands and products with simple filtering (category, search, limit - no pagination)
  - ✅ **Brand Owner:** manage own brand and products (when approved)
  - ✅ **Favorites:** add, remove, list (no check endpoint)
  - ✅ **Contact Messages:** submit messages (public)
  - ✅ **Admin:** Full CRUD on all entities with filtering and search
  - ⚠️ **Deferred for MVP:** Brand submissions, pagination, complex search, avatar uploads, external_url for products

  **Admin Panel Requirements (MVP):**
  The admin panel frontend (`admin/src/`) requires the following backend endpoints (all fully specified in the "Admin Backend Requirements" section above):
  - Dashboard statistics and recent brands
  - Full CRUD for brands (filter by name, category, creation date)
  - Full CRUD for products (filter by brand, category, name)
  - Full CRUD for categories (with icon upload support)
  - Full CRUD for contact messages (filter by sender, status, date)
  - Brand owner management (approve, ban, set pending, delete with safe cascade)
  - User management (list, view, update, delete)
  - Admin profile management (update profile, change password)

  **Key MVP Simplifications:**

  **For Clients & Brand Owners:**
  - Simplified authentication: signin, signup, me (no signout endpoint)
  - Simple profile management: update name and phone only (use `/api/users/me`)
  - Simplified browsing: basic filtering (category, search, limit) - no pagination
  - Simple favorites: add, remove, list (no check endpoint)
  - Basic product management: create, update, delete (no external_url field)
  - Removed advanced features: pagination, complex search, avatar uploads

  **For Admin:**
  - Brands model does not have a status field (simplified for MVP)
  - Brand visibility is controlled by brand owner's user status
  - Focus on core functionality: CRUD operations, filtering, and search
  - Advanced analytics and notifications deferred for later phases

  **General Simplifications:**
  - User model: removed `first_name`, `last_name`, `avatar_url` (use `full_name` only)
  - Product model: removed `external_url` field
  - Simplified phone validation (no strict format requirements)
  - No pagination for public endpoints (use simple limit)
  - Removed brand submission endpoints (deferred for later)

  The backend context now fully aligns with the admin frontend's data structures, features, and user flows as defined in `admin/src/data/staticData.ts` and all admin components. All admin endpoints are specified with request/response structures, validation rules, and MongoDB queries.

