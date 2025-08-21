import express from "express";
import mongoose from 'mongoose';
import dotenv from "dotenv";
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authroutes.js';
import imageRoutes from "./routes/imageroutes.js";
import { errorMiddleware } from "./error/error.js";
import { startCleanupScheduler } from './services/cleanupService.js';

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('❌ Database error:', err));

// AGGRESSIVE CORS FIX - This will definitely work
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
  res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight request for:', req.url);
    return res.status(200).end();
  }

  console.log(`📡 ${req.method} ${req.url} - CORS headers set`);
  next();
});

// Also use the cors middleware as backup
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/image', imageRoutes);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.send("ImagePro API Server is running! CORS should work now.");
});

// Test CORS endpoint
app.get("/test-cors", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ message: "CORS is working!", timestamp: new Date().toISOString() });
});

// Handle favicon requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Health check endpoint for CI/CD
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
app.listen(PORT,HOST, () => {
  console.log(`🚀 ImagePro API running on port ${PORT}`);
  startCleanupScheduler();
});