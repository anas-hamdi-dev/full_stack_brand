# Quick Start Guide - Backend Integration

## Prerequisites

- Node.js installed
- MongoDB database (local or Atlas)
- Both backend directories set up

## Setup Steps

### 1. Environment Variables

Create `.env` files in both `backend/` and `admin-backend/` directories:

**backend/.env**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**admin-backend/.env**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5001
ADMIN_FRONTEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**⚠️ IMPORTANT**: Both backends **MUST** use the **same `MONGODB_URI`**

### 2. Install Dependencies

```bash
# Client Backend
cd backend
npm install

# Admin Backend
cd ../admin-backend
npm install
```

### 3. Run Both Backends

**Terminal 1 - Client Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Admin Backend:**
```bash
cd admin-backend
npm run dev
# Server runs on http://localhost:5001
```

### 4. Verify Integration

**Check Client Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**Check Admin Backend Health:**
```bash
curl http://localhost:5001/api/health
```

Both should return `"database": { "connected": true }`

## API Endpoints

### Client Backend (Port 5000)
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/brands` - List brands
- `GET /api/products` - List products
- ... (see backend routes)

### Admin Backend (Port 5001)
- `GET /api/health` - Health check
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/brands` - List all brands
- `POST /api/admin/brands` - Create brand
- ... (see admin-backend routes)

## Testing Data Consistency

1. **Create a brand via Admin Backend:**
   ```bash
   curl -X POST http://localhost:5001/api/admin/brands \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Brand", "logo_url": "https://example.com/logo.png"}'
   ```

2. **Verify it appears in Client Backend:**
   ```bash
   curl http://localhost:5000/api/brands
   ```

Both backends should see the same data immediately.

## Troubleshooting

### Database Not Connecting
- Verify `MONGODB_URI` is identical in both `.env` files
- Check MongoDB network access (if using Atlas)
- Review connection logs in both terminals

### Data Not Syncing
- Ensure both backends are running
- Check health endpoints for database status
- Verify both use the same database name in URI

### Port Conflicts
- Change `PORT` in `.env` files if ports 5000/5001 are in use
- Update frontend API URLs accordingly

## Next Steps

- Review `BACKEND_INTEGRATION.md` for detailed documentation
- Set up production environment variables
- Configure CORS for production frontend URLs
- Deploy to Vercel (see deployment section in main docs)







