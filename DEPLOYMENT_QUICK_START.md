# Vercel Deployment - Quick Start Guide

Quick reference for deploying your MERN stack app to Vercel.

## 🚀 Quick Steps

### 1. Deploy Backend (5 minutes)

```bash
# Via Vercel Dashboard:
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Root Directory: `backend`
4. Framework: Other
5. Add Environment Variables:
   - MONGODB_URI=mongodb+srv://...
   - JWT_SECRET=your-secret-key
   - FRONTEND_URL=https://your-frontend.vercel.app (set after frontend deploy)
   - NODE_ENV=production
6. Deploy
```

### 2. Deploy Frontend (5 minutes)

```bash
# Via Vercel Dashboard:
1. Create another project (or use different repo)
2. Root Directory: `frontend`
3. Framework: Vite (auto-detected)
4. Add Environment Variable:
   - VITE_API_URL=https://your-backend.vercel.app/api
5. Deploy
```

### 3. Update URLs & Redeploy

```bash
# After both deploy, update:
Backend → Environment Variables → FRONTEND_URL = your-frontend-url
Frontend → Environment Variables → VITE_API_URL = your-backend-url/api

# Redeploy both
```

## 📋 Environment Variables Cheat Sheet

### Backend
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Strong random secret (32+ chars)
- `FRONTEND_URL` - Your frontend URL (defaults to `https://www.el-mall.tn` if not set)
- `NODE_ENV` - `production`

### Frontend
- `VITE_API_URL` - Your backend Vercel URL + `/api`

## ✅ Health Check

```bash
# Test backend
curl https://your-backend.vercel.app/api/health

# Should return:
{"status":"OK","message":"Server is running",...}
```

## 🐛 Common Fixes

| Problem | Solution |
|---------|----------|
| CORS error | Check `FRONTEND_URL` matches frontend domain |
| 404 on refresh | Already handled by `vercel.json` rewrites |
| Env var not working | Must start with `VITE_` for frontend, redeploy |
| MongoDB error | Use Atlas, check network access (0.0.0.0/0) |

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT.md` for detailed guide.

