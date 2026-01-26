# Backend Integration Documentation

This document describes the integration of the **admin-backend** and **backend** (client-side) to work seamlessly with the same MongoDB database.

## Overview

Both backends are now fully integrated to share the same MongoDB database while maintaining independent API endpoints and functionality. The integration ensures:

- ✅ Consistent database connection pooling
- ✅ Synchronized model schemas
- ✅ Standardized API response formats
- ✅ Enhanced error handling for race conditions
- ✅ Database health monitoring
- ✅ Proper connection management for serverless environments

## Database Connection

### Shared Configuration

Both backends connect to the **same MongoDB database** using the `MONGODB_URI` environment variable. The connection configuration is consistent across both backends:

- **Connection Pooling**: Maximum 10 socket connections per backend
- **Timeout Settings**: 
  - Server selection: 30 seconds
  - Socket timeout: 45 seconds
  - Connection timeout: 30 seconds
- **Retry Logic**: Enabled for both reads and writes
- **Connection Caching**: Uses global caching for serverless environments (Vercel)

### Connection Management

Both backends implement:
1. **Connection middleware** that ensures database connectivity before handling requests
2. **Startup connection** for non-serverless environments
3. **Serverless connection handling** in `api/index.js` for Vercel deployments

## Model Schema Synchronization

All models are now synchronized between both backends:

### Brand Model
- `ownerId` is **optional** (can be `null` for admin-created brands)
- Uses **sparse unique index** on `ownerId` to allow multiple admin-created brands while enforcing one brand per owner

### User Model
- Added `tokenVersion` field for session invalidation (synchronized across both backends)
- All other fields remain consistent

### Other Models
- **Product**: Identical schemas
- **Favorite**: Identical schemas
- **ContactMessage**: Identical schemas

## API Structure

### Route Separation

The backends use different route prefixes to avoid conflicts:

**Client Backend** (`backend/`):
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/brands` - Brand operations (client-facing)
- `/api/products` - Product operations
- `/api/favorites` - Favorite management
- `/api/contact-messages` - Contact form submissions

**Admin Backend** (`admin-backend/`):
- `/api/admin/*` - All admin operations
  - `/api/admin/dashboard/*` - Dashboard statistics
  - `/api/admin/brands/*` - Brand management
  - `/api/admin/products/*` - Product management
  - `/api/admin/messages/*` - Message management
  - `/api/admin/users/*` - User management

### Response Format Standardization

Both backends use consistent response formats:

**Success Responses:**
```json
{
  "data": { ... }
}
```
or
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

**Error Responses:**
```json
{
  "error": {
    "message": "Error description"
  }
}
```

## Error Handling

### Enhanced Error Handling

Both backends now include enhanced error handling for:

1. **Race Conditions**: Detects duplicate key errors (11000) and logs them as potential race conditions
2. **Write Conflicts**: Handles version errors when documents are modified concurrently
3. **Database Connection Errors**: Provides clear error messages for connection issues
4. **Comprehensive Logging**: All errors are logged with context (method, path, timestamp)

### Error Response Codes

- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entries, race conditions, write conflicts)
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection issues)

## Environment Variables

### Required Environment Variables

Both backends require the following environment variables:

#### Shared Variables (Same for Both Backends)

```bash
# MongoDB Connection (REQUIRED - Must be identical for both backends)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Environment
NODE_ENV=development|production
```

#### Client Backend Specific

```bash
# Server Port (default: 5000)
PORT=5000

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-secret-key

# Email Service (if using email verification)
BREVO_API_KEY=your-brevo-api-key
```

#### Admin Backend Specific

```bash
# Server Port (default: 5001)
PORT=5001

# Admin Frontend URL for CORS
ADMIN_FRONTEND_URL=http://localhost:3001

# Main Frontend URL (fallback)
FRONTEND_URL=http://localhost:3000
```

### Environment Setup

1. **Development**: Create `.env` files in both `backend/` and `admin-backend/` directories
2. **Production**: Set environment variables in your deployment platform (Vercel, etc.)

**Important**: Both backends **MUST** use the **same `MONGODB_URI`** to share the database.

## Deployment

### Running Both Backends Locally

1. **Start Client Backend**:
   ```bash
   cd backend
   npm install
   npm run dev  # Runs on port 5000
   ```

2. **Start Admin Backend**:
   ```bash
   cd admin-backend
   npm install
   npm run dev  # Runs on port 5001
   ```

Both backends can run simultaneously without conflicts.

### Vercel Deployment

Both backends are configured for Vercel serverless deployment:

- **Client Backend**: Deploy from `backend/` directory
- **Admin Backend**: Deploy from `admin-backend/` directory

Each backend has its own `vercel.json` configuration and `api/index.js` handler.

**Important**: Ensure both Vercel projects use the **same `MONGODB_URI`** environment variable.

## Health Checks

### Health Check Endpoints

Both backends provide health check endpoints that include database connection status:

**Client Backend**: `GET /api/health`
**Admin Backend**: `GET /api/health`

**Response Example:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "connected": true,
    "host": "cluster.mongodb.net",
    "name": "brands_app"
  }
}
```

## Data Consistency

### Timestamps

All models use Mongoose `timestamps: true`, which automatically adds:
- `createdAt` - Set when document is created
- `updatedAt` - Updated whenever document is modified

Both backends see these timestamps immediately after operations.

### Concurrent Updates

The integration handles concurrent updates through:

1. **MongoDB's built-in atomic operations**
2. **Unique indexes** to prevent duplicate entries
3. **Version error handling** for write conflicts
4. **Retry logic** in connection configuration

### Best Practices

1. **Use transactions** for multi-document operations when needed
2. **Handle 409 conflicts** in frontend by refreshing and retrying
3. **Monitor logs** for race condition warnings
4. **Use health checks** to monitor database connectivity

## Monitoring and Logging

### Logging

Both backends log:
- Database connection events
- Error occurrences with full context
- Race condition detections
- Write conflicts

### Monitoring

Monitor the following:
1. **Health check endpoints** - Regular checks for database connectivity
2. **Error logs** - Watch for frequent race conditions or connection issues
3. **Database connection pool** - Monitor connection usage

## Troubleshooting

### Common Issues

1. **Connection Pool Exhausted**
   - Check if both backends are using the same connection string
   - Verify `maxPoolSize` settings (currently 10 per backend = 20 total)

2. **Race Conditions**
   - Check logs for `[Race Condition Detected]` warnings
   - Implement retry logic in frontend for 409 responses
   - Consider using optimistic locking for critical operations

3. **Schema Mismatches**
   - Ensure both backends have the latest model files
   - Run database migrations if needed
   - Check for index conflicts

4. **Data Not Visible**
   - Verify both backends use the same `MONGODB_URI`
   - Check database connection status via health endpoints
   - Ensure transactions are committed

## Migration Notes

If you're migrating from separate databases:

1. **Export data** from both databases
2. **Merge data** carefully, resolving conflicts
3. **Update environment variables** to point to shared database
4. **Test thoroughly** in development before production

## Support

For issues or questions:
1. Check health endpoints for database connectivity
2. Review error logs for detailed error information
3. Verify environment variables are set correctly
4. Ensure both backends are using the same MongoDB URI

---

**Last Updated**: Integration completed with full database sharing, consistent models, and enhanced error handling.







