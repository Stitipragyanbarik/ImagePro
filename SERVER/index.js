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

app.use(cors());
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