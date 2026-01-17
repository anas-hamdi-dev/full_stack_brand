# Vercel Deployment Guide for MERN Stack MVP

Complete guide for deploying your MERN stack application to Vercel.

## 📋 Table of Contents

1. [Deployment Strategy](#deployment-strategy)
2. [Environment Variables](#environment-variables)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Vercel Setup](#vercel-setup)
6. [Deployment Steps](#deployment-steps)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Pre-Deployment Checklist](#pre-deployment-checklist)

---

## 🎯 Deployment Strategy

### Recommended: Separate Deployments (Two Projects)

**Why?** Better separation of concerns, independent scaling, cleaner URLs.

- **Backend Project**: `your-backend.vercel.app`
- **Frontend Project**: `your-app.vercel.app`

**Alternative: Monorepo Single Deployment**
- Can deploy both from root with careful routing
- More complex, less flexible

We'll proceed with **separate deployments** for simplicity and best practices.

---

## 🔐 Environment Variables

### Backend Environment Variables

Set these in **Vercel Dashboard → Your Backend Project → Settings → Environment Variables**:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-change-in-production` | ✅ Yes |
| `FRONTEND_URL` | Your frontend URL | `https://your-app.vercel.app` | ✅ Yes |
| `NODE_ENV` | Environment mode | `production` | ✅ Yes |
| `BREVO_API_KEY` | Email service API key (if using) | `your-brevo-api-key` | Optional |

**⚠️ Important Security Notes:**
- Use **MongoDB Atlas** connection string (not local MongoDB)
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `FRONTEND_URL` to your actual frontend domain
- Never commit `.env` files to git

### Frontend Environment Variables

Set these in **Vercel Dashboard → Your Frontend Project → Settings → Environment Variables**:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.vercel.app/api` | ✅ Yes |

**Note:** In production, this should be your backend Vercel URL (e.g., `https://brands-app-backend.vercel.app/api`)

---

## 🔧 Backend Configuration

### 1. Serverless Entry Point

The backend uses `backend/api/index.js` as the Vercel serverless entry point. This file:
- Handles database connection reuse (optimized for serverless)
- Configures CORS properly
- Exports the Express app for Vercel

### 2. Database Connection Optimization

The `backend/config/database.js` file has been optimized for serverless:
- **Connection caching**: Reuses connections across invocations
- **Connection pooling**: Configures max pool size
- **Error handling**: Graceful connection failures

### 3. Health Check Endpoint

Available at: `GET /api/health`

Returns:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 4. Vercel Configuration (`backend/vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 5. API Routes Structure

All API routes are prefixed with `/api`:
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/brands/*` - Brands CRUD
- `/api/products/*` - Products CRUD
- `/api/favorites/*` - Favorites
- `/api/admin/*` - Admin operations
- `/api/health` - Health check

---

## 🎨 Frontend Configuration

### 1. Environment Variables

The frontend reads the API URL from `VITE_API_URL` environment variable:

```typescript
// frontend/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### 2. Vercel Configuration (`frontend/vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Key Points:**
- `rewrites`: Handles React Router refresh issue (404 on direct routes)
- `headers`: Caches static assets for performance
- `framework: "vite"`: Auto-detected, but explicit for clarity

### 3. Routing Configuration

React Router is configured with `BrowserRouter` in `App.tsx`. The `vercel.json` rewrites ensure all routes serve `index.html` to handle client-side routing.

---

## 🚀 Vercel Setup

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Create Two Vercel Projects

#### Backend Project

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your Git repository
3. **Root Directory**: Select `backend`
4. **Framework Preset**: Other
5. **Build Command**: Leave empty (Vercel auto-detects)
6. **Output Directory**: Leave empty (not applicable for serverless)
7. **Install Command**: `npm install`
8. Add environment variables (see above)
9. Deploy

#### Frontend Project

1. Create another project (or use different branch/root)
2. **Root Directory**: Select `frontend`
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build` (auto-detected)
5. **Output Directory**: `dist` (auto-detected)
6. **Install Command**: `npm install`
7. Add `VITE_API_URL` environment variable
8. Deploy

### Step 3: Update Environment Variables After First Deploy

After deploying, you'll get URLs like:
- Backend: `https://brands-app-backend.vercel.app`
- Frontend: `https://brands-app.vercel.app`

**Update these environment variables:**

**Backend:**
- `FRONTEND_URL` → `https://brands-app.vercel.app`

**Frontend:**
- `VITE_API_URL` → `https://brands-app-backend.vercel.app/api`

Then **redeploy** both projects.

---

## 📝 Deployment Steps

### Initial Deployment

1. **Push code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Deploy Backend**
   - Connect GitHub repo to Vercel
   - Set root directory to `backend`
   - Add environment variables
   - Deploy

3. **Deploy Frontend**
   - Create second Vercel project
   - Set root directory to `frontend`
   - Add `VITE_API_URL` environment variable (use backend URL)
   - Deploy

4. **Update and Redeploy**
   - Update `FRONTEND_URL` in backend env vars
   - Update `VITE_API_URL` in frontend env vars (if needed)
   - Redeploy both

### Subsequent Deployments

- Push to `main` branch → Auto-deploys
- Or use Vercel CLI: `vercel --prod`

---

## 🐛 Common Issues & Solutions

### 1. 404 Error on Page Refresh (Frontend)

**Problem:** Direct URL access or refresh returns 404.

**Solution:** The `vercel.json` rewrites handle this. Ensure:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. CORS Errors

**Problem:** Frontend can't access backend API.

**Solution:**
- Check `FRONTEND_URL` in backend env vars matches your frontend domain
- Ensure backend CORS middleware is configured correctly
- Check browser console for exact error

### 3. Environment Variables Not Working

**Problem:** `VITE_API_URL` is undefined or wrong value.

**Solution:**
- **Frontend env vars must be prefixed with `VITE_`**
- Redeploy after changing env vars (they're injected at build time)
- Check Vercel Dashboard → Settings → Environment Variables

### 4. MongoDB Connection Errors

**Problem:** `MongoDB connection failed` errors.

**Solution:**
- Use **MongoDB Atlas** (not local MongoDB)
- Ensure connection string is correct: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Check network access in Atlas (allow Vercel IPs or 0.0.0.0/0)
- Connection reuse is handled automatically in serverless mode

### 5. "Cannot find module" Errors

**Problem:** Build fails with module errors.

**Solution:**
- Ensure `package.json` has all dependencies
- Check `node_modules` is not committed (should be in `.gitignore`)
- Vercel runs `npm install` automatically

### 6. API Routes Not Found (404)

**Problem:** Backend routes return 404.

**Solution:**
- Verify routes are prefixed with `/api/*`
- Check `backend/vercel.json` routing configuration
- Ensure `api/index.js` exists and exports the Express app correctly

### 7. Build Timeouts

**Problem:** Frontend build exceeds timeout.

**Solution:**
- Optimize build (remove unused dependencies)
- Check for large files in public folder
- Vercel free tier: 45s build timeout

### 8. Function Execution Timeout

**Problem:** API requests timeout (10s on free tier).

**Solution:**
- Optimize database queries
- Add indexes to MongoDB
- Consider upgrading Vercel plan for longer timeouts

---

## ✅ Pre-Deployment Checklist

### Backend

- [ ] All environment variables set in Vercel Dashboard
- [ ] `MONGODB_URI` points to MongoDB Atlas (production database)
- [ ] `JWT_SECRET` is strong and unique (not default)
- [ ] `FRONTEND_URL` matches your frontend domain
- [ ] `backend/api/index.js` exists and exports Express app
- [ ] `backend/vercel.json` is configured correctly
- [ ] All routes are prefixed with `/api/*`
- [ ] Health check endpoint works (`/api/health`)
- [ ] Error handling is production-safe (no stack traces)
- [ ] CORS is configured correctly

### Frontend

- [ ] `VITE_API_URL` environment variable is set
- [ ] `frontend/vercel.json` has rewrites for routing
- [ ] Build command works locally: `npm run build`
- [ ] No hardcoded API URLs (all use `VITE_API_URL`)
- [ ] `.env` files are in `.gitignore`
- [ ] All routes work in production build preview

### Security

- [ ] No secrets in code or `.env` files committed to git
- [ ] `JWT_SECRET` is strong (32+ characters, random)
- [ ] MongoDB Atlas network access configured (whitelist Vercel IPs)
- [ ] Admin endpoints are protected with authentication middleware
- [ ] CORS only allows your frontend domain

### Database

- [ ] MongoDB Atlas cluster is created
- [ ] Database user has proper permissions
- [ ] Network access allows Vercel IPs (0.0.0.0/0 for development, specific IPs for production)
- [ ] Connection string is correct format
- [ ] Backup strategy in place (if needed)

### Testing

- [ ] Backend health check works: `curl https://your-backend.vercel.app/api/health`
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] Authentication flow works (signup, login, logout)
- [ ] Protected routes redirect correctly
- [ ] All CRUD operations work
- [ ] File uploads work (if applicable)

---

## 📊 Monitoring & Logs

### View Logs

- **Vercel Dashboard** → Your Project → Deployments → Click deployment → Functions tab
- Or use CLI: `vercel logs`

### Monitor API Performance

- Check function execution time in Vercel Dashboard
- Monitor MongoDB Atlas metrics
- Set up error tracking (e.g., Sentry) if needed

---

## 🔄 CI/CD with Git

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployments

Each preview gets its own URL for testing.

---

## 💡 Best Practices

1. **Use MongoDB Atlas** for production (not local MongoDB)
2. **Separate deployments** for frontend and backend (easier to manage)
3. **Environment variables** for all config (never hardcode)
4. **Test preview deployments** before promoting to production
5. **Monitor function logs** for errors
6. **Optimize bundle size** (check Vite build output)
7. **Use connection pooling** (already configured in `database.js`)
8. **Set appropriate cache headers** (already in `vercel.json`)

---

## 🆘 Getting Help

If you encounter issues:

1. Check **Vercel logs** in Dashboard
2. Verify **environment variables** are set correctly
3. Test **health endpoint**: `GET /api/health`
4. Check **browser console** for frontend errors
5. Verify **CORS configuration** matches your domains
6. Review **MongoDB Atlas** connection and network settings

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [React Router Vercel Deployment](https://reactrouter.com/en/main/start/overview#deploying)

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0

