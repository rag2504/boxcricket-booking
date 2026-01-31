# Render Deployment Guide

## 🚀 Deployment Fix Applied

### Issues Fixed:
1. **Vite not found** - Moved build dependencies to production dependencies
2. **Missing scripts** - Cleaned up package.json scripts
3. **Build command** - Updated to use `npm install` instead of `npm ci`
4. **Environment variables** - Updated production URLs

### Changes Made:

#### 1. Package.json Updates
- Moved `vite`, `typescript`, `tailwindcss`, and other build tools to `dependencies`
- Removed references to non-existent deployment scripts
- Cleaned up script definitions

#### 2. Render Configuration
- Updated `render.yaml` build command
- Corrected environment variables
- Set proper PORT for Render (10000)

#### 3. Environment Configuration
- Updated `.env.production` with correct Render URL
- Set proper frontend URL for CORS

## 🔧 Deployment Steps

### For Render:
1. **Push changes to GitHub**
2. **Render will automatically deploy** using the updated configuration
3. **Environment variables** will be loaded from Render dashboard

### Required Environment Variables in Render Dashboard:
```
NODE_ENV=production
RENDER=true
PORT=10000
MONGODB_URI=your_mongodb_connection_string
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://boxcric.netlify.app
```

## 🎯 Expected Build Process

1. **Install dependencies**: `npm install`
2. **TypeScript compilation**: `tsc`
3. **Vite build**: `vite build`
4. **Start server**: `npm run start:render`

## 🔍 Troubleshooting

### If build still fails:
1. Check Render logs for specific error messages
2. Verify all environment variables are set in Render dashboard
3. Ensure GitHub repository is up to date
4. Check Node.js version (should be 20.x as specified in .nvmrc)

### Common Issues:
- **Missing environment variables**: Add them in Render dashboard
- **Build timeout**: Increase build timeout in Render settings
- **Memory issues**: Upgrade to a paid plan if needed

## 📋 Post-Deployment Checklist

1. ✅ Check health endpoint: `https://box-junu.onrender.com/api/health`
2. ✅ Verify frontend can connect to API
3. ✅ Test user registration/login
4. ✅ Test booking flow
5. ✅ Check payment integration (use sandbox mode first)

## 🌐 URLs After Deployment

- **Backend API**: https://box-junu.onrender.com
- **Health Check**: https://box-junu.onrender.com/api/health
- **Frontend**: https://boxcric.netlify.app (separate deployment)

## 🔄 Continuous Deployment

Render is configured for auto-deployment:
- Push to `main` branch triggers automatic deployment
- Build logs available in Render dashboard
- Rollback available if deployment fails