# Backend Product Requirements Document (PRD)
## el mall - Tunisian Brands Directory API

**Last Updated:** 2026-01-28  
**Version:** MVP 1.0  
**Scope:** Backend API and Database

---

## 1. Product Overview

### 1.1 What the Backend Does

The el mall backend is a RESTful API built with Node.js, Express, and MongoDB that powers the Tunisian fashion brands directory platform. The API provides:

- **User Management**: Authentication, authorization, and profile management for clients, brand owners, and admins
- **Brand Management**: CRUD operations for brands with approval workflow
- **Product Management**: CRUD operations for products with brand ownership validation
- **Favorites System**: Client favorites management for products
- **Contact System**: Public contact form submissions
- **Email Verification**: Email verification workflow using Brevo (Sendinblue)
- **Admin Panel Support**: Full administrative capabilities for managing the platform

### 1.2 Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB (v6+) with Mongoose ODM (v8+)
- **Authentication:** JWT (jsonwebtoken) with bcrypt for password hashing
- **Validation:** Joi (for request validation), Mongoose schema validation
- **Email Service:** Brevo (Sendinblue) API
- **Environment:** dotenv for configuration
- **CORS:** Enabled for cross-origin requests
- **Deployment:** Vercel serverless support

---

## 2. User Roles and Capabilities

### 2.1 Client (Authenticated User)

**Capabilities:**
- Browse all approved brands and products (public endpoints)
- View brand and product details
- Add/remove products from favorites
- View own favorites list
- Check if a product is favorited
- Update personal profile (full_name, phone)
- Submit contact messages

**Restrictions:**
- Cannot create, edit, or delete brands
- Cannot create, edit, or delete products
- Cannot access brand owner features
- Cannot access admin features

**API Access:**
- Public endpoints: All GET endpoints for brands and products
- Authenticated endpoints: `/api/favorites/*`, `/api/users/me`, `/api/contact-messages`

### 2.2 Brand Owner (Authenticated User)

**Capabilities:**
- All client capabilities
- Create brand (one per user, status: 'pending')
- Edit own brand information (when brand exists)
- View own brand details
- Create products (only when brand is approved)
- Update own products
- Delete own products
- View own products list
- Update personal profile

**Status Workflow:**
- `pending`: Brand created, awaiting admin approval (default)
- `approved`: Brand approved, can manage products
- Brand status is stored in `Brand.status` field
- Brand owners must have `brand_id` set to access product management

**Restrictions:**
- Can only manage own brand and its products
- Cannot change brand status (admin-only)
- Cannot access other brand owners' brands/products
- Cannot access admin features

**API Access:**
- Brand endpoints: `/api/brands` (POST, PATCH), `/api/brands/me`, `/api/brands/me/products`
- Product endpoints: `/api/products` (POST, PATCH, DELETE) with ownership validation

### 2.3 Admin (Authenticated User)

**Capabilities:**
- All public browsing capabilities
- Full CRUD on all brands (regardless of ownership)
- Full CRUD on all products (regardless of ownership)
- Manage brand owner status (approve, reject, ban)
- View and manage contact messages
- System administration and monitoring

**Restrictions:**
- Cannot delete own account
- Cannot change own role
- Admin login blocked from client API (must use admin panel)

**API Access:**
- Admin endpoints: `/api/admin/*` (all admin routes)
- Note: Admin login is blocked from `/api/auth/signin` - admins must use admin panel

---

## 3. Data Models

### 3.1 User Model

**Collection:** `users`

**Schema:**
```javascript
{
  email: String (required, unique, lowercase, validated)
  password: String (required, minlength: 6, hashed with bcrypt)
  full_name: String (required, trimmed)
  phone: String (required, Tunisian format: +216[2-9]XXXXXXXX)
  role: Enum ['client', 'brand_owner', 'admin'] (required)
  brand_id: ObjectId (ref: 'Brand', nullable, only for brand_owner)
  isEmailVerified: Boolean (default: false)
  emailVerificationCode: String (hashed, select: false)
  emailVerificationExpiresAt: Date (select: false)
  emailVerificationAttempts: Number (default: 0, select: false)
  emailVerificationBlockedUntil: Date (select: false)
  emailVerificationLastSentAt: Date (select: false)
  tokenVersion: Number (default: 0, select: false)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `email`: unique
- `brand_id`: sparse index
- `role`: index

**Validation Rules:**
- Email must be unique and valid format
- Phone must match Tunisian mobile format: `+216[2-9]XXXXXXXX`
- `brand_id` must be null for clients and admins
- `brand_id` can be null initially for brand_owner (set when brand is created)
- Password is automatically hashed on save

### 3.2 Brand Model

**Collection:** `brands`

**Schema:**
```javascript
{
  name: String (required, unique, trimmed)
  ownerId: ObjectId (ref: 'User', nullable for admin-created brands)
  description: String (nullable, preserves newlines)
  logo_url: String (required, validated: HTTP/HTTPS URL or data URL)
  location: String (nullable, trimmed)
  website: String (nullable, validated: HTTP/HTTPS URL)
  instagram: String (nullable, validated: URL or username format)
  facebook: String (nullable, validated: HTTP/HTTPS URL)
  phone: String (nullable, trimmed)
  email: String (nullable, validated email format)
  is_featured: Boolean (default: false)
  status: Enum ['pending', 'approved', 'rejected'] (default: 'pending')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `name`: unique
- `ownerId`: unique, sparse (allows null for admin-created brands)
- `is_featured`: index
- `createdAt`: descending index

**Validation Rules:**
- Brand name must be unique
- Logo URL must be valid HTTP/HTTPS URL or base64 data URL
- Website, Instagram, Facebook must be valid URLs if provided
- Instagram can be URL or username format (@username or username)
- Email must be valid format if provided
- Status controls brand visibility (only 'approved' brands are publicly visible)

### 3.3 Product Model

**Collection:** `products`

**Schema:**
```javascript
{
  name: String (required, trimmed)
  description: String (nullable, preserves newlines)
  brand_id: ObjectId (ref: 'Brand', required)
  price: Number (required, min: 0)
  images: [String] (required, min: 1, validated: HTTP/HTTPS URL or data URL)
  purchaseLink: String (nullable, validated: HTTP/HTTPS URL)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `brand_id`: index
- `name, description`: text search index
- `createdAt`: descending index

**Validation Rules:**
- At least one image is required
- All images must be valid HTTP/HTTPS URLs or base64 data URLs
- Price must be >= 0
- Products must belong to an approved brand to be publicly visible
- Purchase link must be valid URL if provided

### 3.4 Favorite Model

**Collection:** `favorites`

**Schema:**
```javascript
{
  user_id: ObjectId (ref: 'User', required)
  product_id: ObjectId (ref: 'Product', required)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `user_id, product_id`: compound unique index
- `user_id`: index
- `product_id`: index

**Validation Rules:**
- One user can favorite a product only once (enforced by unique index)
- Only clients can create favorites (enforced by middleware)
- Product must exist when creating favorite

### 3.5 ContactMessage Model

**Collection:** `contact_messages`

**Schema:**
```javascript
{
  name: String (required, trimmed)
  email: String (required, validated email format, lowercase)
  subject: String (required, trimmed)
  message: String (required, trimmed)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes:**
- `createdAt`: descending index

**Validation Rules:**
- All fields are required
- Email must be valid format
- No authentication required (public endpoint)

---

## 4. API Endpoints

### 4.1 Authentication Endpoints

#### `POST /api/auth/signup`
- **Description:** Register a new user account
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+21612345678",
    "role": "client" | "brand_owner",
    "brandData": {
      "name": "Brand Name",
      "description": "Brand description",
      "location": "Tunis, Tunisia",
      "website": "https://example.com",
      "instagram": "@brandname",
      "facebook": "https://facebook.com/brand"
    }
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "user": { ... },
    "token": "jwt_token_here"
    
  }
  ```
- **Features:**
  - Validates Tunisian phone number format
  - Generates 6-digit email verification code
  - Sends verification email via Brevo
  - For brand_owner: Creates brand with status 'pending'
  - Returns JWT token (7-day expiration)

#### `POST /api/auth/signin`
- **Description:** Authenticate user and get JWT token
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "user": { ... },
    "token": "jwt_token_here"
  }
  ```
- **Features:**
  - Blocks admin login (admins must use admin panel)
  - Returns user with `isEmailVerified` status
  - JWT token expires in 7 days

#### `POST /api/auth/signout`
- **Description:** Sign out (client-side token invalidation)
- **Access:** Authenticated
- **Response:** `200 OK` - `{ success: true }`

#### `GET /api/auth/me`
- **Description:** Get current authenticated user
- **Access:** Authenticated
- **Response:** `200 OK`
  ```json
  {
    "user": { ... }
  }
  ```
- **Features:**
  - Populates brand_id for brand owners
  - Returns user without sensitive fields

#### `POST /api/auth/verify-email`
- **Description:** Verify email with 6-digit code
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "verificationCode": "123456"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Email verified successfully",
    "user": { ... }
  }
  ```
- **Features:**
  - Validates code with bcrypt comparison
  - 10-minute expiration for codes
  - Rate limiting: 5 attempts before 15-minute block
  - Resets verification fields on success

#### `POST /api/auth/resend-verification`
- **Description:** Resend email verification code
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Verification code sent successfully"
  }
  ```
- **Features:**
  - 1-minute cooldown between resends
  - Generates new 6-digit code
  - Sends email via Brevo

### 4.2 User Management Endpoints

#### `PATCH /api/users/me`
- **Description:** Update current user's profile
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "full_name": "Updated Name",
    "phone": "+21698765432"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "user": { ... }
  }
  ```
- **Features:**
  - Validates Tunisian phone number format
  - Prevents role and brand_id changes
  - Returns updated user without password

### 4.3 Brand Endpoints

#### `GET /api/brands`
- **Description:** Get all approved brands with filtering
- **Access:** Public
- **Query Parameters:**
  - `featured`: boolean (filter featured brands)
  - `search`: string (search by name, case-insensitive)
  - `limit`: number (default: 50, max results)
- **Response:** `200 OK`
  ```json
  {
    "data": [Brand, ...]
  }
  ```
- **Features:**
  - Only returns brands with `status: 'approved'`
  - Supports search by name (regex)
  - Simple limit (no pagination in MVP)

#### `GET /api/brands/featured`
- **Description:** Get all featured and approved brands
- **Access:** Public
- **Response:** `200 OK`
  ```json
  {
    "data": [Brand, ...]
  }
  ```

#### `GET /api/brands/me`
- **Description:** Get brand owner's own brand
- **Access:** Authenticated, Brand Owner
- **Response:** `200 OK`
  ```json
  {
    "data": Brand
  }
  ```

#### `GET /api/brands/me/products`
- **Description:** Get brand owner's own products
- **Access:** Authenticated, Brand Owner
- **Response:** `200 OK`
  ```json
  {
    "data": [Product, ...]
  }
  ```

#### `GET /api/brands/:id`
- **Description:** Get brand by ID
- **Access:** Public
- **Response:** `200 OK`
  ```json
  {
    "data": Brand
  }
  ```
- **Features:**
  - Only returns approved brands (404 if not approved)

#### `GET /api/brands/:brandId/products`
- **Description:** Get products for a specific brand
- **Access:** Public
- **Response:** `200 OK`
  ```json
  {
    "data": [Product, ...]
  }
  ```
- **Features:**
  - Only returns products from approved brands

#### `POST /api/brands`
- **Description:** Create a new brand (brand owner only)
- **Access:** Authenticated, Brand Owner
- **Request Body:**
  ```json
  {
    "name": "Brand Name",
    "description": "Brand description",
    "logo_url": "data:image/png;base64,...",
    "location": "Tunis, Tunisia",
    "website": "https://example.com",
    "instagram": "@brandname",
    "facebook": "https://facebook.com/brand",
    "phone": "+21612345678",
    "email": "contact@brand.tn"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "data": Brand
  }
  ```
- **Features:**
  - Validates brand name uniqueness
  - Sets status to 'pending' by default
  - Links brand to user via `brand_id` and `ownerId`
  - Validates URL formats

#### `PATCH /api/brands/:id`
- **Description:** Update brand information
- **Access:** Authenticated, Brand Owner, Ownership Check
- **Request Body:**
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "logo_url": "https://example.com/logo.png",
    ...
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "data": Brand
  }
  ```
- **Features:**
  - Brand owners cannot change status (admin-only)
  - Validates ownership via `checkBrandOwnership` middleware
  - Preserves status from existing brand

### 4.4 Product Endpoints

#### `GET /api/products`
- **Description:** Get all products with filtering
- **Access:** Public
- **Query Parameters:**
  - `brand_id`: string (filter by brand)
  - `search`: string (search by name, case-insensitive)
  - `limit`: number (default: 50)
- **Response:** `200 OK`
  ```json
  {
    "data": [Product, ...]
  }
  ```
- **Features:**
  - Only returns products from approved brands
  - Populates brand information
  - Supports search by name (regex)

#### `GET /api/products/:id`
- **Description:** Get product by ID
- **Access:** Public
- **Response:** `200 OK`
  ```json
  {
    "data": Product
  }
  ```
- **Features:**
  - Only returns products from approved brands (404 if brand not approved)
  - Populates brand information

#### `POST /api/products`
- **Description:** Create a new product
- **Access:** Authenticated, Brand Owner Approved
- **Request Body:**
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "images": [
      "data:image/png;base64,...",
      "https://example.com/image.jpg"
    ]
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "data": Product
  }
  ```
- **Features:**
  - Requires brand owner to have approved brand
  - Validates at least one image
  - Validates image formats (JPG, PNG, WebP)
  - Price is required and must be >= 0
  - Automatically sets `brand_id` from authenticated user

#### `PATCH /api/products/:id`
- **Description:** Update product information
- **Access:** Authenticated, Brand Owner Approved, Ownership Check
- **Request Body:**
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "price": 129.99,
    "images": [...]
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "data": Product
  }
  ```
- **Features:**
  - Validates ownership via `checkProductOwnership` middleware
  - Price is always required in updates
  - Validates image formats if provided

#### `DELETE /api/products/:id`
- **Description:** Delete a product
- **Access:** Authenticated, Brand Owner Approved, Ownership Check
- **Response:** `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Features:**
  - Validates ownership
  - Cascade deletion: Removes associated favorites
  - Only brand owners can delete their own products

### 4.5 Favorites Endpoints

#### `GET /api/favorites`
- **Description:** Get user's favorite products
- **Access:** Authenticated, Client Only
- **Response:** `200 OK`
  ```json
  {
    "data": [Product, ...]
  }
  ```
- **Features:**
  - Returns products grouped by brand (via populate)
  - Filters out deleted products
  - Only clients can access

#### `POST /api/favorites`
- **Description:** Add product to favorites
- **Access:** Authenticated, Client Only
- **Request Body:**
  ```json
  {
    "product_id": "product_id_here"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "data": Favorite
  }
  ```
- **Features:**
  - Validates product exists
  - Prevents duplicate favorites (unique index)
  - Only clients can add favorites

#### `DELETE /api/favorites/:productId`
- **Description:** Remove product from favorites
- **Access:** Authenticated, Client Only
- **Response:** `200 OK`
  ```json
  {
    "success": true
  }
  ```

#### `GET /api/favorites/check/:productId`
- **Description:** Check if product is favorited
- **Access:** Authenticated, Client Only
- **Response:** `200 OK`
  ```json
  {
    "isFavorite": true
  }
  ```

### 4.6 Contact Messages Endpoints

#### `POST /api/contact-messages`
- **Description:** Submit a contact message
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Inquiry",
    "message": "Message content"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "data": ContactMessage
  }
  ```
- **Features:**
  - No authentication required
  - Validates all required fields
  - Validates email format

### 4.7 Health Check Endpoint

#### `GET /api/health`
- **Description:** Check API and database health
- **Access:** Public
- **Response:** `200 OK` or `503 Service Unavailable`
  ```json
  {
    "status": "OK" | "DEGRADED",
    "message": "Client Backend Server is running",
    "timestamp": "2026-01-28T...",
    "environment": "development" | "production",
    "database": {
      "status": "connected" | "disconnected" | "connecting" | "disconnecting",
      "connected": true | false,
      "host": "mongodb_host",
      "name": "database_name"
    }
  }
  ```

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

1. **Sign Up:**
   - User submits email, password, full_name, phone, role
   - System validates Tunisian phone format
   - Password is hashed with bcrypt (10 rounds)
   - Email verification code generated (6 digits, hashed)
   - Verification email sent via Brevo
   - JWT token generated (7-day expiration)
   - For brand_owner: Brand created with status 'pending'

2. **Email Verification:**
   - User submits email and 6-digit code
   - Code validated with bcrypt comparison
   - Rate limiting: 5 failed attempts = 15-minute block
   - Code expires after 10 minutes
   - On success: `isEmailVerified` set to true

3. **Sign In:**
   - User submits email and password
   - Password compared with bcrypt
   - Admin login blocked (must use admin panel)
   - JWT token generated (7-day expiration)
   - Token includes `userId` and `role`

4. **Authenticated Requests:**
   - Include `Authorization: Bearer <token>` header
   - Token validated via `authenticate` middleware
   - User loaded from database and attached to `req.user`
   - Token expiration checked automatically

### 5.2 Authorization Middleware

#### `authenticate`
- Validates JWT token
- Loads user from database
- Attaches user to `req.user` and `req.userId`
- Returns 401 if token invalid or user not found

#### `isBrandOwner`
- Checks `req.user.role === 'brand_owner'`
- Returns 403 if not brand owner

#### `isBrandOwnerApproved`
- Checks user is brand owner
- Checks `req.user.brand_id` exists (brand created)
- Returns 403 if brand not created

#### `isClient`
- Checks `req.user.role === 'client'`
- Returns 403 if not client

#### `isAdmin`
- Checks `req.user.role === 'admin'`
- Returns 403 if not admin

#### `checkBrandOwnership`
- Validates user owns the brand
- Checks `req.user.brand_id === brand._id` OR `brand.ownerId === req.user._id`
- Returns 403 if ownership invalid

#### `checkProductOwnership`
- Validates user owns the product's brand
- Checks `req.user.brand_id === product.brand_id`
- Returns 403 if ownership invalid

### 5.3 Security Features

- **Password Hashing:** bcrypt with 10 rounds
- **JWT Tokens:** 7-day expiration, includes userId and role
- **Email Verification:** 6-digit codes, hashed storage, rate limiting
- **CORS:** Configurable origins (all in dev, restricted in production)
- **Request Size Limit:** 50MB for base64 image uploads
- **Input Validation:** Mongoose schema validation + Joi (where applicable)
- **Phone Validation:** Tunisian mobile format enforcement
- **URL Validation:** All URL fields validated
- **Email Validation:** Regex validation for email fields
- **Admin Protection:** Admin login blocked from client API

---

## 6. Email Service Integration

### 6.1 Brevo (Sendinblue) Integration

**Configuration:**
- `BREVO_API_KEY`: Brevo API key
- `BREVO_SENDER_EMAIL`: Verified sender email
- `BREVO_SENDER_NAME`: Sender display name

**Email Templates:**
- **Verification Email:**
  - Subject: "Verify your email"
  - HTML template with 6-digit code
  - Code expiration: 10 minutes
  - Includes user's full name

**Features:**
- Graceful failure: Signup doesn't fail if email fails
- Resend cooldown: 1 minute between resends
- Error logging for debugging

---

## 7. Database Configuration

### 7.1 MongoDB Connection

**Connection String:** `MONGODB_URI` environment variable

**Connection Options:**
- Serverless-friendly caching (Vercel support)
- Connection pooling (max 10 connections)
- Timeout settings: 30s connection, 45s socket
- Retry writes and reads enabled
- DNS resolution timeout handling

**Database Middleware:**
- Ensures connection before handling requests
- Returns 503 if database unavailable
- Handles connection errors gracefully

### 7.2 Indexes

**Users:**
- `email`: unique index
- `brand_id`: sparse index
- `role`: index

**Brands:**
- `name`: unique index
- `ownerId`: unique, sparse index
- `is_featured`: index
- `createdAt`: descending index

**Products:**
- `brand_id`: index
- `name, description`: text search index
- `createdAt`: descending index

**Favorites:**
- `user_id, product_id`: compound unique index
- `user_id`: index
- `product_id`: index

**Contact Messages:**
- `createdAt`: descending index

---

## 8. Error Handling

### 8.1 Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### 8.2 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated or invalid token)
- `403` - Forbidden (not authorized for action)
- `404` - Not Found
- `409` - Conflict (duplicate email, already favorited, etc.)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection issues)

### 8.3 Error Types

**Mongoose Validation Errors:**
- Automatically converted to 400 with field-specific messages

**Duplicate Key Errors (11000):**
- Email already exists: 409
- Brand name already exists: 409
- Favorite already exists: 409

**Cast Errors:**
- Invalid ObjectId: 404

**JWT Errors:**
- Invalid token: 401
- Expired token: 401

**Custom Business Logic Errors:**
- Brand not approved: 403
- Ownership mismatch: 403
- Rate limiting: 429

---

## 9. API Response Format

### 9.1 Success Response

```json
{
  "data": { ... } | [ ... ],
  "message": "Optional success message"
}
```

### 9.2 Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### 9.3 Pagination Response (Future)

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 10. Environment Variables

### 10.1 Required Variables

```env
MONGODB_URI=mongodb://localhost:27017/brands_app
JWT_SECRET=your-secret-key-here-change-in-production
NODE_ENV=development
PORT=5000
```

### 10.2 Optional Variables

```env
FRONTEND_URL=http://localhost:8080
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=el mall
VERCEL=1
```

---

## 11. Deployment

### 11.1 Serverless (Vercel)

- Uses `api/index.js` for serverless function
- Connection caching for serverless environments
- Environment variables configured in Vercel dashboard

### 11.2 Traditional Server

- Runs `server.js` directly
- Listens on `PORT` environment variable (default: 5000)
- Database connection on startup
- CORS configured for production origins

---

## 12. Business Logic & Workflows

### 12.1 Brand Owner Registration Workflow

1. User signs up with `role: 'brand_owner'`
2. Brand created automatically with status 'pending'
3. User receives email verification code
4. User verifies email
5. Admin reviews and approves brand (sets status to 'approved')
6. Brand owner can now manage products

### 12.2 Product Creation Workflow

1. Brand owner must have approved brand (`brand_id` set, brand status 'approved')
2. Brand owner creates product via POST `/api/products`
3. Product automatically linked to brand
4. Product visible publicly (if brand is approved)

### 12.3 Favorites Workflow

1. Client browses products
2. Client adds product to favorites
3. Favorite stored with `user_id` and `product_id`
4. Client can view all favorites grouped by brand
5. Client can remove favorites

### 12.4 Email Verification Workflow

1. User signs up → 6-digit code generated and hashed
2. Code sent via Brevo email
3. Code expires in 10 minutes
4. User submits code → validated with bcrypt
5. On success: `isEmailVerified = true`, verification fields cleared
6. Rate limiting: 5 failed attempts = 15-minute block
7. Resend cooldown: 1 minute between requests

---

## 13. Data Validation Rules

### 13.1 Phone Number Validation

- **Format:** `+216[2-9]XXXXXXXX`
- **Rules:**
  - Must start with `+216`
  - Followed by 8 digits
  - First digit after country code must be 2, 4, 5, 6, 7, 8, or 9
  - Spaces and dashes are automatically removed

### 13.2 URL Validation

- **HTTP/HTTPS URLs:** Must match `/^https?:\/\/.+/`
- **Data URLs:** Must match `/^data:image\/(jpeg|jpg|png|webp);base64,.+/`
- **Instagram:** Can be URL or username format (`@username` or `username`)

### 13.3 Email Validation

- **Format:** Must match `/^\S+@\S+\.\S+$/`
- **Stored:** Lowercase, trimmed

### 13.4 Image Validation

- **Formats:** JPG, PNG, WebP
- **Sources:** HTTP/HTTPS URLs or base64 data URLs
- **Required:** At least one image for products, logo required for brands

---

## 14. Performance Considerations

### 14.1 Database Optimization

- Indexes on frequently queried fields
- Compound indexes for unique constraints
- Text search indexes for product search
- Sparse indexes for optional fields

### 14.2 Query Optimization

- `.populate()` for related data (brands, products)
- `.select()` to limit returned fields
- `.limit()` for result pagination (MVP: simple limit)
- Efficient filtering with MongoDB queries

### 14.3 Caching

- Database connection caching for serverless
- JWT token validation (stateless)

---

## 15. Security Considerations

### 15.1 Password Security

- bcrypt hashing (10 rounds)
- Minimum length: 6 characters
- Never returned in API responses

### 15.2 Token Security

- JWT with 7-day expiration
- Includes userId and role
- Validated on every authenticated request

### 15.3 Input Sanitization

- Mongoose schema validation
- URL format validation
- Email format validation
- Phone number format validation
- Request size limits (50MB)

### 15.4 CORS Configuration

- Development: Allows all origins
- Production: Restricted to `FRONTEND_URL`
- Credentials: Enabled

### 15.5 Rate Limiting

- Email verification: 5 attempts before 15-minute block
- Resend verification: 1-minute cooldown

---

## 16. API Versioning

**Current Version:** v1.0 (MVP)

**Base Path:** `/api`

**Future Considerations:**
- Versioning strategy: `/api/v1/`, `/api/v2/`
- Backward compatibility for breaking changes

---

## 17. Testing Considerations

### 17.1 Test Data

- Seed admin user via `scripts/seedAdmin.js`
- Test users for each role (client, brand_owner)
- Test brands with different statuses
- Test products for approved brands

### 17.2 Test Scenarios

- Authentication flows (signup, signin, verification)
- Authorization checks (role-based, ownership)
- CRUD operations for brands and products
- Favorites management
- Email verification with rate limiting
- Error handling and validation

---

## 18. Future Enhancements (Post-MVP)

### 18.1 Planned Features

- Pagination for all list endpoints
- Advanced search with filters
- Image upload service (currently base64 or URLs)
- Admin panel endpoints (brand owner management, analytics)
- Brand submission workflow
- Contact message status management
- Email notifications for brand approval/rejection
- Password reset functionality
- Social authentication (OAuth)
- API rate limiting (per user/IP)
- Webhook support for external integrations

### 18.2 Technical Improvements

- GraphQL API option
- Real-time updates (WebSockets)
- Caching layer (Redis)
- Full-text search (Elasticsearch)
- Image optimization service
- CDN integration for static assets
- API documentation (Swagger/OpenAPI)
- Comprehensive test suite
- Performance monitoring and logging

---

## 19. API Documentation

### 19.1 Endpoint Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/signup` | POST | Public | Register new user |
| `/api/auth/signin` | POST | Public | Authenticate user |
| `/api/auth/signout` | POST | Auth | Sign out |
| `/api/auth/me` | GET | Auth | Get current user |
| `/api/auth/verify-email` | POST | Public | Verify email |
| `/api/auth/resend-verification` | POST | Public | Resend code |
| `/api/users/me` | PATCH | Auth | Update profile |
| `/api/brands` | GET | Public | List brands |
| `/api/brands/featured` | GET | Public | Featured brands |
| `/api/brands/me` | GET | Brand Owner | Own brand |
| `/api/brands/me/products` | GET | Brand Owner | Own products |
| `/api/brands/:id` | GET | Public | Brand details |
| `/api/brands/:brandId/products` | GET | Public | Brand products |
| `/api/brands` | POST | Brand Owner | Create brand |
| `/api/brands/:id` | PATCH | Brand Owner | Update brand |
| `/api/products` | GET | Public | List products |
| `/api/products/:id` | GET | Public | Product details |
| `/api/products` | POST | Brand Owner | Create product |
| `/api/products/:id` | PATCH | Brand Owner | Update product |
| `/api/products/:id` | DELETE | Brand Owner | Delete product |
| `/api/favorites` | GET | Client | List favorites |
| `/api/favorites` | POST | Client | Add favorite |
| `/api/favorites/:productId` | DELETE | Client | Remove favorite |
| `/api/favorites/check/:productId` | GET | Client | Check favorite |
| `/api/contact-messages` | POST | Public | Submit message |
| `/api/health` | GET | Public | Health check |

---

## 20. Summary

The el mall backend API provides a complete RESTful interface for managing a Tunisian fashion brands directory platform. It supports three user roles (client, brand_owner, admin) with appropriate access controls, implements secure authentication with email verification, and provides full CRUD operations for brands and products with ownership validation.

**Key Features:**
- ✅ Secure authentication with JWT and email verification
- ✅ Role-based access control with ownership validation
- ✅ Brand approval workflow (pending → approved)
- ✅ Product management with brand ownership checks
- ✅ Client favorites system
- ✅ Public contact form
- ✅ Health monitoring endpoint
- ✅ Serverless deployment support (Vercel)
- ✅ Comprehensive input validation
- ✅ Error handling and logging

**MVP Status:**
- Core functionality implemented and tested
- Email verification working
- Brand and product CRUD operational
- Favorites system functional
- Ready for production deployment with proper environment configuration

---

*PRD generated based on codebase analysis - 2026-01-28*


