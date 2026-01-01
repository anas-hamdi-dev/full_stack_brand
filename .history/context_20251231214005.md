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

---

## Technology Stack

**Recommended Stack:**
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js or Fastify
- **Database:** MongoDB (v6+)
- **ODM:** Mongoose (v7+)
- **Authentication:** JWT (jsonwebtoken) + bcrypt for password hashing
- **Validation:** Joi or Zod (for request validation)
- **Environment:** dotenv for configuration

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
    match: [/^\+216\s?\d{2}\s?\d{3}\s?\d{3}$/, 'Please enter a valid phone number']
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
        if (this.role === 'brand_owner') {
          return v !== null;
        }
        return v === null;
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
```

**Notes:**
- `brand_id` is only populated for users with `role = "brand_owner"`
- `brand_id` should be NULL for users with `role = "client"`
- Password must be hashed using bcrypt before saving
- Use `select: false` on password field to prevent accidental exposure

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
```

**Notes:**
- Categories are pre-defined and typically not created by users
- `brand_count` should be updated when brands are added/removed from category
- Use Mongoose middleware (post-save hooks) to update brand_count automatically

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

brandSchema.post('findOneAndDelete', async function() {
  // Update brand_count when brand is deleted
  // Implementation depends on delete method used
});
```

**Notes:**
- `is_featured` defaults to `false`
- Social media URLs should be validated as proper URLs
- Brand name should be unique
- Use Mongoose middleware to update category brand_count automatically

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
        return v.length > 0 && v.every(url => /^https?:\/\/.+/.test(url));
      },
      message: 'At least one valid image URL is required'
    }
  },
  external_url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'External URL must be a valid URL'
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

**Capabilities:**
- View all brands and products (public data)
- Browse brands by category
- View brand details and product details
- Add/remove products to favorites
- View own favorites list
- Submit brand submission requests (public form)
- Submit contact messages (public form)
- Update own profile (name, email, phone, avatar)

**Restrictions:**
- Cannot create/edit/delete brands
- Cannot create/edit/delete products
- Cannot access brand owner dashboard
- Cannot modify other users' data

### Role: `brand_owner`

**Capabilities:**
- All client capabilities (can browse and favorite)
- Access brand owner dashboard
- View and edit own brand information:
  - Brand name, description, category
  - Logo, location, contact info
  - Website, social media links
- Full CRUD on own products:
  - Create products with multiple images
  - Update product details
  - Delete products
- View products belonging to own brand
- Update own profile (name, email, phone, avatar)

**Restrictions:**
- Can only edit products belonging to their brand (`brand_id` matches `user.brand_id`)
- Cannot edit other brands
- Cannot edit products from other brands
- Cannot access other brand owners' dashboards

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
- **Request:** `{ email: string, password: string, firstName: string, lastName: string, phone?: string, role: "client" | "brand_owner", brandData?: {...} }`
- **Response:** `{ user: User, token: string }`
- **Implementation:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
let brandId = null;
if (role === 'brand_owner') {
  const brand = await Brand.create({
    name: `${firstName} ${lastName}'s Brand`,
    category_id: brandData?.category_id || null,
    // ... other brand data
  });
  brandId = brand._id;
}
const user = await User.create({
  email,
  password: hashedPassword,
  full_name: `${firstName} ${lastName}`,
  first_name: firstName,
  last_name: lastName,
  phone,
  role,
  brand_id: brandId
});
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.status(201).json({ user, token });
```

#### `POST /api/auth/signout`
- **Request:** (authenticated)
- **Response:** `{ success: boolean }`
- **Note:** Token invalidation handled client-side (consider token blacklist for server-side)

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

#### `GET /api/users/:id`
- **Request:** (authenticated)
- **Response:** `User` (without password)
- **Authorization:** User can only view own profile
- **MongoDB Query:**
```javascript
const user = await User.findById(req.params.id).select('-password');
if (user._id.toString() !== req.userId.toString()) {
  return res.status(403).json({ error: 'Access denied' });
}
res.json({ user });
```

#### `PATCH /api/users/:id`
- **Request:** `{ full_name?: string, email?: string, phone?: string, avatar_url?: string }`
- **Response:** `User` (updated, without password)
- **Authorization:** User can only update own profile
- **MongoDB Query:**
```javascript
const user = await User.findByIdAndUpdate(
  req.params.id,
  { $set: updateData },
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
- **Request:** (public, optional query params: `category_id`, `featured`, `search`)
- **Response:** `Brand[]`
- **MongoDB Query:**
```javascript
const query = {};
if (req.query.category_id) {
  query.category_id = req.query.category_id;
}
if (req.query.featured === 'true') {
  query.is_featured = true;
}
if (req.query.search) {
  query.name = { $regex: req.query.search, $options: 'i' };
}
const brands = await Brand.find(query)
  .populate('category_id', 'name icon')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
res.json({ data: brands });
```

#### `GET /api/brands/:id`
- **Request:** (public)
- **Response:** `Brand` (with nested category info)
- **MongoDB Query:**
```javascript
const brand = await Brand.findById(req.params.id)
  .populate('category_id');
res.json({ data: brand });
```

#### `GET /api/brands/featured`
- **Request:** (public)
- **Response:** `Brand[]`
- **MongoDB Query:**
```javascript
const brands = await Brand.find({ is_featured: true })
  .populate('category_id')
  .sort({ createdAt: -1 });
res.json({ data: brands });
```

#### `PATCH /api/brands/:id`
- **Request:** `{ name?, category_id?, description?, logo_url?, location?, website?, instagram?, facebook?, phone?, email? }`
- **Response:** `Brand` (updated)
- **Authorization:** Only brand owner who owns this brand
- **MongoDB Query:**
```javascript
const brand = await Brand.findByIdAndUpdate(
  req.params.id,
  { $set: updateData },
  { new: true, runValidators: true }
).populate('category_id');
res.json({ data: brand });
```

---

### Products Endpoints

#### `GET /api/products`
- **Request:** (public, optional query params: `brand_id`, `category_id`, `search`)
- **Response:** `Product[]` (with nested brand info)
- **MongoDB Query:**
```javascript
const query = {};
if (req.query.brand_id) {
  query.brand_id = req.query.brand_id;
}
if (req.query.category_id) {
  const brands = await Brand.find({ category_id: req.query.category_id });
  query.brand_id = { $in: brands.map(b => b._id) };
}
if (req.query.search) {
  query.$text = { $search: req.query.search };
}
const products = await Product.find(query)
  .populate({
    path: 'brand_id',
    select: 'name logo_url website category_id',
    populate: {
      path: 'category_id',
      select: 'name icon'
    }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
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

#### `GET /api/brands/:brandId/products`
- **Request:** (public)
- **Response:** `Product[]`
- **MongoDB Query:**
```javascript
const products = await Product.find({ brand_id: req.params.brandId })
  .sort({ createdAt: -1 });
res.json({ data: products });
```

#### `POST /api/products`
- **Request:** `{ name: string, description?: string, brand_id: string, price?: number, images: string[], external_url?: string }`
- **Response:** `Product` (created, with nested brand info)
- **Authorization:** Only brand owner who owns the brand
- **MongoDB Query:**
```javascript
const product = await Product.create({
  ...req.body,
  brand_id: req.user.brand_id // Ensure user owns the brand
});
await product.populate({
  path: 'brand_id',
  populate: { path: 'category_id' }
});
res.status(201).json({ data: product });
```

#### `PATCH /api/products/:id`
- **Request:** `{ name?, description?, price?, images?, external_url? }`
- **Response:** `Product` (updated, with nested brand info)
- **Authorization:** Only brand owner who owns the product's brand
- **MongoDB Query:**
```javascript
const product = await Product.findByIdAndUpdate(
  req.params.id,
  { $set: updateData },
  { new: true, runValidators: true }
).populate({
  path: 'brand_id',
  populate: { path: 'category_id' }
});
res.json({ data: product });
```

#### `DELETE /api/products/:id`
- **Request:** (authenticated)
- **Response:** `{ success: boolean }`
- **Authorization:** Only brand owner who owns the product's brand
- **MongoDB Query:**
```javascript
const product = await Product.findById(req.params.id);
if (product.brand_id.toString() !== req.user.brand_id.toString()) {
  return res.status(403).json({ error: 'Access denied' });
}
await Product.findByIdAndDelete(req.params.id);
// Also delete associated favorites
await Favorite.deleteMany({ product_id: req.params.id });
res.json({ success: true });
```

---

### Favorites Endpoints

#### `GET /api/favorites`
- **Request:** (authenticated, client role only)
- **Response:** `Product[]` (user's favorited products with brand info)
- **MongoDB Query:**
```javascript
const favorites = await Favorite.find({ user_id: req.userId })
  .populate({
    path: 'product_id',
    populate: {
      path: 'brand_id',
      populate: { path: 'category_id' }
    }
  });
const products = favorites.map(fav => fav.product_id);
res.json({ data: products });
```

#### `POST /api/favorites`
- **Request:** `{ product_id: string }`
- **Response:** `Favorite` (created)
- **MongoDB Query:**
```javascript
const favorite = await Favorite.create({
  user_id: req.userId,
  product_id: req.body.product_id
});
await favorite.populate('product_id');
res.status(201).json({ data: favorite });
```

#### `DELETE /api/favorites/:productId`
- **Request:** (authenticated, client role only)
- **Response:** `{ success: boolean }`
- **MongoDB Query:**
```javascript
await Favorite.findOneAndDelete({
  user_id: req.userId,
  product_id: req.params.productId
});
res.json({ success: true });
```

#### `GET /api/favorites/check/:productId`
- **Request:** (authenticated, client role only)
- **Response:** `{ isFavorite: boolean }`
- **MongoDB Query:**
```javascript
const favorite = await Favorite.findOne({
  user_id: req.userId,
  product_id: req.params.productId
});
res.json({ isFavorite: !!favorite });
```

---

### Brand Submissions Endpoints

#### `POST /api/brand-submissions`
- **Request:** `{ brand_name: string, category: string, description?: string, contact_email: string, contact_phone?: string, website?: string, instagram?: string }`
- **Response:** `BrandSubmission` (created)
- **MongoDB Query:**
```javascript
const submission = await BrandSubmission.create({
  ...req.body,
  status: 'pending'
});
res.status(201).json({ data: submission });
```

---

### Contact Messages Endpoints

#### `POST /api/contact-messages`
- **Request:** `{ name: string, email: string, subject: string, message: string }`
- **Response:** `ContactMessage` (created)
- **MongoDB Query:**
```javascript
const message = await ContactMessage.create({
  ...req.body,
  status: 'new'
});
res.status(201).json({ data: message });
```

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
2. **Role Immutability:** User role should not change after creation (enforce in application logic)
3. **Brand Owner Brand:** Brand owners must have a `brand_id` set (enforced by schema validation)
4. **Client Brand:** Clients must have `brand_id = null` (enforced by schema validation)

### Brand Constraints

1. **Brand Name:** Enforced by MongoDB unique index
2. **Category:** `category_id` can be null (brands without category)
3. **Featured:** `is_featured` defaults to `false`
4. **Ownership:** One brand can only be owned by one user (enforced by application logic)

### Product Constraints

1. **Images:** Products must have at least one image (enforced by schema validation)
2. **Brand Required:** Products must belong to a brand (`brand_id` required)
3. **Price:** Price can be null (for display-only products)
4. **Image URLs:** All image URLs must be valid URLs (enforced by schema validation)

### Category Constraints

1. **Name Uniqueness:** Enforced by MongoDB unique index
2. **Brand Count:** `brand_count` should be computed/updated using Mongoose middleware

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
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

## Summary

This MongoDB/Node.js backend must support:

- **Two user roles:** clients and brand owners
- **Core entities:** users, brands, products, categories, favorites, brand submissions, contact messages
- **CRUD operations:** Full CRUD for brands and products (with ownership checks)
- **Authentication:** Email/password with JWT tokens
- **Authorization:** Role-based and resource ownership checks
- **Public endpoints:** Categories, brands, products (read-only)
- **Protected endpoints:** User profile, favorites, brand/product management

**Key MongoDB Features:**
- Use Mongoose ODM for schema definition and validation
- Use ObjectId references for relationships
- Use `.populate()` for fetching related data
- Use indexes for performance optimization
- Use middleware for automatic updates (e.g., brand_count)
- Use compound indexes for unique constraints (favorites)

The backend should align with the frontend's data structures and user flows as defined in `src/data/staticData.ts` and the frontend components.
