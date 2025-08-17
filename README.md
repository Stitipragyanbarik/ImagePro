# 🖼️ ImagePro - Professional Image Processing Platform

A modern, full-stack web application for image compression, format conversion, and background removal with automatic privacy protection.

## ✨ Features

### 🔧 **Image Processing Tools**
- **Image Compression** - Reduce file sizes while maintaining quality
- **Format Conversion** - Convert between JPEG, PNG, WebP formats
- **Background Removal** - AI-powered background removal tool

### 🔐 **User Management**
- User registration and authentication
- Secure JWT-based sessions
- Upload history tracking (for logged-in users)

### 🛡️ **Privacy & Security**
- **Automatic Cleanup** - All uploaded images deleted after 6 hours
- **Anonymous Usage** - All features work without login
- **Data Migration** - Anonymous uploads migrate to account on login

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### 🐳 **Run with Docker (Recommended)**

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MAJORPROJECT
   ```

2. **Set up environment variables**
   ```bash
   cp SERVER/.env.example SERVER/.env
   # Edit SERVER/.env with your actual values
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000
   - **Database:** mongodb://localhost:27017

5. **Stop services**
   ```bash
   docker-compose down
   ```

### 💻 **Local Development**

1. **Start MongoDB**
   ```bash
   docker run -d --name imagepro-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:5.0
   ```

2. **Start Backend**
   ```bash
   cd SERVER
   npm install
   npm start
   ```

3. **Start Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Multer** - File upload middleware
- **Sharp** - Image processing library

### **Cloud & DevOps**
- **Google Cloud Storage** - File storage
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline

### **Image Processing APIs**
- **Remove.bg** - Background removal
- **PhotoRoom** - Alternative background removal
- **Clipdrop** - AI-powered image editing

## 📁 Project Structure

```
MAJORPROJECT/
├── SERVER/                 # Backend API
│   ├── controllers/        # Route handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middlewares/       # Auth & upload middleware
│   ├── services/          # Background services
│   └── error/             # Error handling
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS styles
└── docker-compose.yml     # Docker configuration
```

## 🔧 Configuration

### **Environment Variables**

1. **Copy the example file:**
   ```bash
   cp SERVER/.env.example SERVER/.env
   ```

2. **Update the values in SERVER/.env:**
   - Add your Google Cloud Storage credentials
   - Add your background removal API keys (optional)
   - Change JWT_SECRET for production

**⚠️ Important:** Never commit the actual `.env` file to GitHub!

## 🧪 Testing

```bash
# Backend tests
cd SERVER
npm test

# Frontend tests
cd client
npm test
```

## 📦 Docker Services

- **database** - MongoDB 5.0 with persistent storage
- **backend** - Node.js API server with auto-restart
- **frontend** - React app served on port 3000

## 🔒 Privacy Features

- **6-Hour Auto-Delete** - All images automatically deleted
- **Anonymous Processing** - No login required for basic features
- **Secure Storage** - Images stored securely in cloud storage
- **Data Migration** - Anonymous data migrates to account on login

## 🛠️ Development

### **Adding New Features**
1. Backend: Add routes in `SERVER/routes/`
2. Frontend: Add pages in `client/src/pages/`
3. Database: Add models in `SERVER/models/`

### **Code Style**
- Clean, readable code with proper formatting
- Error handling throughout the application
- Responsive design for all screen sizes

## 🎥 Demo

### **Live Features**
- **Image Compression:** Upload any image and reduce file size while maintaining quality
- **Format Conversion:** Convert between JPEG, PNG, and WebP formats
- **Background Removal:** AI-powered background removal with transparent PNG output
- **User Authentication:** Register/login to save upload history
- **Privacy Protection:** All images automatically deleted after 6 hours

### **Screenshots**
```
🏠 Homepage → 🖼️ Upload → ⚙️ Process → 📥 Download → 🗑️ Auto-cleanup
```

## 📝 API Documentation

### **Authentication Endpoints**
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile

```

### **Image Processing Endpoints**
```http
POST /api/image/compress           # Compress images
POST /api/image/convert            # Convert image formats
POST /api/image/remove-background  # Removebackgrounds      
                                   # Download processed image
         
```

### **User Data Endpoints**
```http
GET    /api/image/history          # Get upload history
DELETE /api/image/clear-activity   # Clear user history
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## � Project Highlights

### **Technical Excellence**
- **Clean Architecture** - Separation of concerns with modular design
- **Security First** - JWT authentication, input validation, automatic cleanup
- **Performance Optimized** - Image compression, efficient file handling
- **Scalable Design** - Docker containerization, cloud storage integration
- **Modern Stack** - Latest React, Node.js, and MongoDB versions

### **User Experience**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Intuitive Interface** - Simple drag-and-drop file uploads
- **Real-time Processing** - Live preview and progress indicators
- **Privacy Focused** - No permanent data storage, automatic cleanup
- **Cross-platform** - Works on Windows, macOS, and Linux

### **Development Best Practices**
- **CI/CD Pipeline** - Automated testing and deployment
- **Environment Management** - Secure configuration with .env files
- **Error Handling** - Comprehensive error management
- **Code Quality** - Clean, readable, and well-documented code
- **Version Control** - Git with meaningful commit messages

## 🆘 Troubleshooting

### **Common Issues**
```bash
# Check if all services are running
docker ps

# View backend logs
docker logs imagepro-backend

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build
```

### **Port Conflicts**
If ports 3000, 5000, or 27017 are in use:
```bash
docker-compose down
# Kill processes using the ports
docker-compose up -d
```

---

