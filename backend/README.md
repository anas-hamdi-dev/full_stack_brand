# Brands App Backend

Backend API for Brands App using MongoDB and Node.js.

## Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB (v6+)
- **ODM:** Mongoose (v7+)
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Joi
- **Environment:** dotenv

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/brands_app
     JWT_SECRET=your-secret-key-here-change-in-production
     NODE_ENV=development
     PORT=5000
     ```

3. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/brands_app`

4. **Run the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

### Brands
- `GET /api/brands` - Get all brands (with filters: category_id, featured, search)
- `GET /api/brands/featured` - Get featured brands
- `GET /api/brands/:id` - Get brand by ID
- `GET /api/brands/:brandId/products` - Get products by brand
- `PATCH /api/brands/:id` - Update brand (brand owner only)

### Products
- `GET /api/products` - Get all products (with filters: brand_id, category_id, search)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (brand owner only)
- `PATCH /api/products/:id` - Update product (brand owner only)
- `DELETE /api/products/:id` - Delete product (brand owner only)

### Favorites
- `GET /api/favorites` - Get user's favorites (client only)
- `POST /api/favorites` - Add to favorites (client only)
- `DELETE /api/favorites/:productId` - Remove from favorites (client only)
- `GET /api/favorites/check/:productId` - Check if product is favorited (client only)

### Brand Submissions
- `POST /api/brand-submissions` - Submit a new brand

### Contact Messages
- `POST /api/contact-messages` - Submit a contact message

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- **client**: Can browse brands/products, manage favorites, update profile
- **brand_owner**: All client capabilities + manage own brand and products

## Response Format

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

## Database Models

- **Users**: User accounts with roles (client/brand_owner)
- **Categories**: Product categories
- **Brands**: Brand information
- **Products**: Products belonging to brands
- **Favorites**: User favorite products
- **Brand Submissions**: Pending brand submissions
- **Contact Messages**: Contact form submissions

## Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Brand owners must have a brand_id set
- Products must belong to a brand
- Only clients can create favorites
- Brand owners can only edit their own brands and products
