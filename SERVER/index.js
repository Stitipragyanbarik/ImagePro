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

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000', // Local development
    'https://image-c6ytee32p-stitipragyanbarik-9052s-projects.vercel.app', // Your Vercel frontend
    /\.vercel\.app$/, // Allow all Vercel domains
    /\.onrender\.com$/ // Allow all Render domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/image', imageRoutes);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("ImagePro API Server is running!");
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