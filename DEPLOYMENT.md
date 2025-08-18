# 🚀 ImagePro Deployment Guide

## 📋 Prerequisites

1. **MongoDB Atlas Account** (Free): https://www.mongodb.com/atlas
2. **Render Account** (Free): https://render.com
3. **Google Cloud Account** (Optional): For image storage

## 🗄️ Step 1: Setup MongoDB Atlas

1. **Create MongoDB Atlas Cluster**
   - Go to https://www.mongodb.com/atlas
   - Create free account and cluster
   - Choose AWS/Free tier
   - Create database user with username/password
   - Add IP address `0.0.0.0/0` to whitelist (for Render)

2. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/imagepro?retryWrites=true&w=majority
   ```

## 🔧 Step 2: Deploy Backend on Render

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `imagepro-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd SERVER && npm install`
     - **Start Command**: `cd SERVER && node index.js`

2. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/imagepro?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
   ```

## 🎨 Step 3: Deploy Frontend on Render

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect same GitHub repository
   - Configure:
     - **Name**: `imagepro-frontend`
     - **Build Command**: `cd client && npm install && npm run build`
     - **Publish Directory**: `client/dist`

2. **Update API Configuration**
   - Frontend will automatically use production API URL
   - No additional environment variables needed

## 🔗 Step 4: Update API URLs

Your deployed URLs will be:
- **Backend**: `https://imagepro-backend.onrender.com`
- **Frontend**: `https://imagepro-frontend.onrender.com`

Update `client/src/config/api.js`:
```javascript
const config = {
  production: {
    API_BASE_URL: 'https://imagepro-backend.onrender.com/api'
  }
};
```

## ✅ Step 5: Test Deployment

1. **Backend Health Check**
   ```
   curl https://imagepro-backend.onrender.com/health
   ```

2. **Frontend Access**
   - Visit your frontend URL
   - Test registration/login
   - Test image processing features

## 🐛 Common Issues & Solutions

### ❌ Database Connection Failed
**Problem**: `getaddrinfo ENOTFOUND database`
**Solution**: Update `MONGO_URI` to MongoDB Atlas connection string

### ❌ 404 API Errors
**Problem**: Routes not found
**Solution**: Ensure API calls use `/api` prefix

### ❌ CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Update CORS settings in backend

### ❌ Build Failures
**Problem**: npm install fails
**Solution**: Check Node.js version compatibility

## 🔒 Security Checklist

- ✅ Use strong JWT_SECRET
- ✅ MongoDB Atlas IP whitelist configured
- ✅ Environment variables set correctly
- ✅ No sensitive data in repository
- ✅ HTTPS enabled (automatic on Render)

## 📊 Monitoring

- **Render Dashboard**: Monitor deployments and logs
- **MongoDB Atlas**: Monitor database usage
- **Google Cloud Console**: Monitor storage usage

Your ImagePro application is now live! 🎉
