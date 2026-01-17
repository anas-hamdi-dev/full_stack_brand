# Vercel Deployment Guide

This guide explains how to deploy the Brands App frontend and backend to Vercel.

## Overview

The application consists of two separate projects:
- **Frontend**: React + Vite application (located in `/frontend`)
- **Backend**: Express.js API server (located in `/backend`)

## Prerequisites

1. Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. MongoDB database (MongoDB Atlas recommended)
4. Environment variables configured

## Deployment Steps

### Step 1: Deploy Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Login to Vercel (if not already):
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Set environment variables in Vercel Dashboard or via CLI:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add BREVO_API_KEY
   vercel env add FRONTEND_URL
   ```

5. Deploy:
   ```bash
   vercel --prod
   ```

6. Note the deployment URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Deploy Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Set environment variables:
   ```bash
   vercel env add VITE_API_URL
   ```
   - Enter the backend API URL from Step 1 (e.g., `https://your-backend.vercel.app/api`)

4. Deploy:
   ```bash
   vercel --prod
   ```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `BREVO_API_KEY` | Brevo (Sendinblue) API key for email service | Yes |
| `FRONTEND_URL` | Frontend URL for CORS (e.g., `https://your-frontend.vercel.app`) | Recommended |
| `PORT` | Server port (auto-set by Vercel) | No |
| `NODE_ENV` | Environment (production/development) | Auto-set |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL (e.g., `https://your-backend.vercel.app/api`) | Yes |

## Setting Environment Variables in Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development** environments
4. Redeploy after adding environment variables

## Project Structure for Vercel

### Backend Structure
```
backend/
├── api/
│   └── index.js          # Serverless entry point
├── config/
│   └── database.js       # MongoDB connection
├── routes/               # API routes
├── models/               # Mongoose models
├── middleware/           # Express middleware
├── utils/                # Utility functions
├── vercel.json           # Vercel configuration
└── package.json
```

### Frontend Structure
```
frontend/
├── src/                  # React source code
├── dist/                 # Build output (generated)
├── vercel.json           # Vercel configuration
└── package.json
```

## Configuration Files

### `backend/vercel.json`
Configures Vercel to use the serverless function at `api/index.js` and routes all API requests to it.

### `frontend/vercel.json`
Configures Vercel to:
- Build using `npm run build`
- Serve static files from `dist` directory
- Handle client-side routing with rewrites

### `backend/api/index.js`
Converts the Express app into a Vercel serverless function. This is the entry point for all API requests.

## MongoDB Connection in Serverless

The backend uses MongoDB with connection pooling optimized for serverless:
- Database connection is established on cold start
- Connection is reused across invocations
- Automatic reconnection on connection loss

## CORS Configuration

The backend has CORS enabled. For production, update CORS settings if needed:
- In `backend/api/index.js`, the `cors()` middleware allows all origins by default
- For security, restrict CORS to your frontend domain in production

## Testing the Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.vercel.app/api/health
   ```

2. **Frontend**: Visit your frontend URL and verify it loads correctly

3. **API Integration**: Test login, signup, and other API endpoints through the frontend

## Troubleshooting

### Backend Issues

1. **Database Connection Errors**:
   - Verify `MONGODB_URI` is set correctly
   - Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for Vercel)
   - Ensure MongoDB Atlas allows connections from anywhere or add Vercel IPs

2. **Environment Variables Not Loading**:
   - Ensure variables are set in Vercel Dashboard
   - Redeploy after adding environment variables
   - Check variable names match exactly (case-sensitive)

3. **Function Timeout**:
   - Vercel free tier: 10 seconds max execution time
   - Hobby tier: 60 seconds max execution time
   - Optimize database queries if timeouts occur

### Frontend Issues

1. **API Connection Errors**:
   - Verify `VITE_API_URL` is set correctly
   - Check browser console for CORS errors
   - Ensure backend is deployed and accessible

2. **Build Errors**:
   - Check Node.js version (Vercel uses Node 18.x by default)
   - Review build logs in Vercel Dashboard
   - Ensure all dependencies are in `package.json`

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository:
- Connect your GitHub/GitLab/Bitbucket repository in Vercel Dashboard
- Every push to `main`/`master` triggers a production deployment
- Push to other branches triggers preview deployments

## Custom Domains

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Monitoring and Logs

- View deployment logs in Vercel Dashboard → **Deployments**
- View function logs: `vercel logs [deployment-url]`
- Set up monitoring in Vercel Dashboard → **Analytics**

## Next Steps

- Set up monitoring and error tracking (e.g., Sentry)
- Configure CDN caching for static assets
- Set up database backups
- Configure rate limiting for API endpoints
- Enable SSL/TLS (automatically handled by Vercel)

## Support

For Vercel-specific issues, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord Community](https://vercel.com/discord)

