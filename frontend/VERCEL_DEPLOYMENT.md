# Frontend Vercel Deployment Guide

This guide explains how to deploy the React + Vite frontend to Vercel.

## Quick Start

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Link your project** (first time only):
   ```bash
   vercel link
   ```

5. **Set environment variables**:
   ```bash
   vercel env add VITE_API_URL
   ```
   - Enter your backend API URL (e.g., `https://your-backend.vercel.app/api`)

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-backend.vercel.app/api` |

### Setting Environment Variables

#### Via Vercel Dashboard (Recommended)
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add `VITE_API_URL` with your backend API URL
4. Select environments: **Production**, **Preview**, and **Development**
5. Click **Save**
6. Redeploy your application

#### Via Vercel CLI
```bash
vercel env add VITE_API_URL production
vercel env add VITE_API_URL preview
vercel env add VITE_API_URL development
```

## Project Configuration

### Build Configuration

The project is configured with:
- **Framework**: Vite (auto-detected by Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: Auto (Vercel uses Node.js 18.x by default)

### Vercel Configuration (`vercel.json`)

The `vercel.json` file includes:
- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Cache Headers**: Static assets (JS, CSS, images) are cached for 1 year
- **Security Headers**: XSS protection, frame options, content type options

## Deployment Options

### Option 1: Git Integration (Recommended)

1. Connect your GitHub/GitLab/Bitbucket repository in Vercel Dashboard
2. Import your project
3. Set root directory to `frontend` (if using monorepo)
4. Configure build settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add environment variables
6. Deploy!

**Benefits**:
- Automatic deployments on every push to `main`/`master`
- Preview deployments for pull requests
- Rollback capabilities

### Option 2: Vercel CLI

Deploy directly from command line:
```bash
cd frontend
vercel --prod
```

## Build Process

Vercel will:
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Optimize and deploy static files from `dist/` directory

## Optimizations

The Vercel configuration includes:

### Caching
- Static assets (JS, CSS, images) cached for 1 year
- HTML files are not cached (allows SPA updates)

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Performance
- Automatic image optimization
- Automatic compression (gzip/brotli)
- Edge caching via Vercel's CDN

## Testing the Deployment

1. **Check Build Logs**: Review the build output in Vercel Dashboard
2. **Test API Connection**: Open browser console and verify API calls work
3. **Test Routing**: Navigate through pages to ensure SPA routing works
4. **Test on Mobile**: Check responsive design on mobile devices

## Troubleshooting

### Build Fails

**Issue**: Build errors during deployment
**Solution**:
- Check Node.js version (should be 18.x or 20.x)
- Verify all dependencies in `package.json`
- Check build logs in Vercel Dashboard
- Test build locally: `npm run build`

### API Connection Issues

**Issue**: Frontend can't connect to backend API
**Solution**:
- Verify `VITE_API_URL` environment variable is set correctly
- Check CORS settings on backend
- Ensure backend is deployed and accessible
- Check browser console for CORS errors

### Routing Issues

**Issue**: 404 errors on page refresh or direct navigation
**Solution**:
- Verify `vercel.json` has correct rewrites configuration
- Ensure all routes redirect to `/index.html`
- Check that `rewrites` section is present in `vercel.json`

### Environment Variables Not Working

**Issue**: Environment variables not available in production
**Solution**:
- Ensure variables start with `VITE_` prefix (required for Vite)
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set for the correct environment (Production/Preview/Development)

## Custom Domain

1. Go to **Settings** → **Domains** in Vercel Dashboard
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for DNS propagation (can take up to 48 hours)
5. SSL certificate is automatically provisioned

## Monitoring

- **Analytics**: View in Vercel Dashboard → **Analytics**
- **Logs**: View in Vercel Dashboard → **Deployments** → Click deployment → **Functions** tab
- **Real User Monitoring**: Available in Vercel Dashboard

## Performance Tips

1. **Image Optimization**: Use Vercel's Image Optimization API
2. **Code Splitting**: Vite automatically splits code for optimal loading
3. **Tree Shaking**: Unused code is automatically removed in production builds
4. **Minification**: JavaScript and CSS are minified automatically

## Next Steps

- Set up monitoring and error tracking (e.g., Sentry)
- Configure custom domain
- Enable Vercel Analytics
- Set up preview deployments for staging
- Configure redirects if needed

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel Support](https://vercel.com/support)

