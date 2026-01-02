# Admin System Documentation

## Overview

The admin system provides secure, role-based access control for managing the Brands App platform. Admin users have elevated privileges to manage users, brands, products, and system-wide data.

## Security Features

### Admin User Creation
- **No Public Signup**: Admin users cannot be created via the public signup endpoint (`/api/auth/signup`)
- **Manual Creation Only**: Admin users must be created manually using the seeding script or by existing admins
- **Backend Enforcement**: The signup route explicitly rejects `role: 'admin'` (returns 400 error)

### Authentication
- **JWT Tokens**: All authentication uses JWT tokens with 7-day expiration
- **Password Hashing**: Passwords are hashed using bcrypt (10 rounds) before storage
- **Secure Storage**: Passwords are never returned in API responses (`select: false` in schema)

### Authorization
- **Role-Based Access Control (RBAC)**: All admin routes are protected with:
  1. `authenticate` middleware - Verifies JWT token
  2. `isAdmin` middleware - Ensures user has `role: 'admin'`
- **Backend Enforcement**: Frontend checks are not sufficient - all admin endpoints verify role on the backend

## Creating Admin Users

### Method 1: Using the Seeding Script (Recommended for Initial Setup)

```bash
# Navigate to backend directory
cd backend

# Run the seeding script
node scripts/seedAdmin.js <email> <password> <fullName>

# Example:
node scripts/seedAdmin.js admin@example.com SecurePassword123 "Admin User"
```

**Default credentials** (if no arguments provided):
- Email: `admin@tunisfashion.com`
- Password: `admin123`
- Name: `Admin User`

**⚠️ IMPORTANT**: Change the default password immediately after first login!

### Method 2: Using Environment Variables

You can also set default admin credentials in `.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
ADMIN_NAME=Admin User
```

Then run:
```bash
node scripts/seedAdmin.js
```

### Method 3: Programmatically (by existing admins)

Existing admins can create new admin users via the admin panel user management interface (when implemented).

## Admin User Constraints

Admin users have the following constraints enforced by the User model:

1. **No Status Field**: Admin users do not have a `status` field (unlike brand_owner users)
2. **No Brand Association**: Admin users cannot have a `brand_id` (must be `null`)
3. **Role Validation**: Role must be exactly `'admin'` (enum validation)
4. **Email Uniqueness**: Email must be unique across all users

## Admin Capabilities

Admin users can:

1. **Manage Users**
   - View all users (clients, brand owners, admins)
   - Approve/decline brand owner accounts
   - Update user profiles
   - Delete users (except themselves)

2. **Manage Brands**
   - View all brands
   - Create, update, and delete brands
   - Change brand status (pending, approved, banned)
   - Feature/unfeature brands

3. **Manage Products**
   - View all products
   - Create, update, and delete products
   - Moderate product content

4. **Manage Categories**
   - Create, update, and delete categories
   - Manage category icons and descriptions

5. **Manage Brand Submissions**
   - Review brand submission requests
   - Approve or reject submissions
   - Create brands from approved submissions

6. **Manage Contact Messages**
   - View all contact form submissions
   - Mark messages as read/replied
   - Delete messages

7. **Access Dashboard**
   - View system statistics
   - Monitor recent activity

## API Endpoints

All admin endpoints are prefixed with `/api/admin` and require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User role must be `'admin'`

### Protected Routes

All routes in `backend/routes/admin.js` are protected by:
```javascript
router.use(authenticate);  // Verify JWT token
router.use(isAdmin);       // Verify admin role
```

### Key Endpoints

- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/recent-brands` - Get recent brands
- `GET /api/admin/brands` - List all brands (with filters)
- `POST /api/admin/brands` - Create brand
- `PATCH /api/admin/brands/:id` - Update brand
- `DELETE /api/admin/brands/:id` - Delete brand
- `GET /api/admin/products` - List all products
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id` - Update user
- ... and many more (see `backend/routes/admin.js` for complete list)

## Frontend Admin Panel

The admin frontend (`admin/` directory) provides:
- Separate login page (`/admin/login`)
- Protected routes that redirect non-admin users
- Full CRUD interfaces for all admin capabilities
- Real-time data from backend API

### Authentication Flow

1. Admin enters credentials on `/admin/login`
2. Frontend calls `POST /api/auth/signin`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. All subsequent API calls include token in `Authorization` header
6. Backend validates token and checks admin role on every request

### Protected Routes

Frontend routes are protected by `ProtectedRoute` component which:
- Checks for authenticated user
- Verifies admin role
- Redirects to login if unauthorized

## Security Best Practices

1. **Strong Passwords**: Use strong, unique passwords for admin accounts
2. **Token Expiration**: JWT tokens expire after 7 days - users must re-authenticate
3. **Environment Variables**: Never commit `.env` files with real credentials
4. **HTTPS in Production**: Always use HTTPS in production environments
5. **Regular Audits**: Regularly review admin user list and remove unused accounts
6. **Principle of Least Privilege**: Only create admin accounts when absolutely necessary

## Troubleshooting

### Cannot Login as Admin

1. Verify admin user exists: Check database or run seeding script
2. Verify credentials: Email and password must match exactly
3. Check JWT_SECRET: Must be set in `.env` file
4. Check token expiration: Tokens expire after 7 days

### "Access denied. Admin role required" Error

1. Verify user role in database: `db.users.findOne({ email: 'admin@example.com' })`
2. Ensure role is exactly `'admin'` (case-sensitive)
3. Clear browser localStorage and re-authenticate

### Admin User Creation Fails

1. Check email uniqueness: Email must not already exist
2. Check password length: Must be at least 6 characters
3. Check database connection: MongoDB must be running
4. Check environment variables: MONGODB_URI must be set

## Database Schema

Admin users follow the same User schema but with constraints:

```javascript
{
  email: String (unique, required),
  password: String (hashed, required, minlength: 6),
  full_name: String (required),
  role: 'admin' (required, enum),
  status: undefined/null (only for brand_owner),
  brand_id: null (only for brand_owner),
  // ... other fields
}
```

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/brands_app
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=5000

# Optional: Default admin credentials for seeding
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
ADMIN_NAME=Admin User
```

## Testing

To test the admin system:

1. Seed an admin user:
   ```bash
   node scripts/seedAdmin.js testadmin@example.com testpass123 "Test Admin"
   ```

2. Login via API:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"testadmin@example.com","password":"testpass123"}'
   ```

3. Use returned token for admin endpoints:
   ```bash
   curl -X GET http://localhost:5000/api/admin/dashboard/stats \
     -H "Authorization: Bearer <token>"
   ```
