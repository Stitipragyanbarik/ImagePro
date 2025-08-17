// Image Controller Test - Beginner Level
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
// Create test app
const app = express();
app.use(express.json());

// Mock image compression controller
const compressImage = (req, res) => {
  // Check if file is provided
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Check quality parameter
  const quality = parseInt(req.body.quality);
  if (!quality || quality < 1 || quality > 100) {
    return res.status(400).json({ error: 'Quality must be between 1 and 100' });
  }

  // Mock successful compression
  res.json({
    message: 'Image compressed successfully',
    fileUrl: 'http://mock-storage.com/compressed-image.jpg',
    downloadUrl: 'http://mock-storage.com/download/compressed-image.jpg',
    originalSize: req.file.size,
    compressedSize: Math.floor(req.file.size * (quality / 100)),
    quality: quality
  });
};

// Mock image conversion controller
const convertImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const format = req.body.format;
  const validFormats = ['jpeg', 'png', 'webp', 'avif'];
  
  if (!format || !validFormats.includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Supported: jpeg, png, webp, avif' });
  }

  res.json({
    message: 'Image converted successfully',
    fileUrl: `http://mock-storage.com/converted-image.${format}`,
    downloadUrl: `http://mock-storage.com/download/converted-image.${format}`,
    originalFormat: 'jpeg',
    newFormat: format
  });
};

// Mock background removal controller
const removeBackground = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Simulate credits exhausted scenario
  if (req.body.simulateCreditsExhausted) {
    return res.status(402).json({ 
      error: 'Credits exhausted',
      code: 'CREDITS_EXHAUSTED',
      useClientSide: true
    });
  }

  res.json({
    message: 'Background removed successfully',
    fileUrl: 'http://mock-storage.com/no-bg-image.png',
    downloadUrl: 'http://mock-storage.com/download/no-bg-image.png',
    filename: 'no-bg-image.png'
  });
};

// Mock file upload middleware
const mockUpload = (req, res, next) => {
  req.file = global.mockFile;
  next();
};

// Setup routes
app.post('/compress', mockUpload, compressImage);
app.post('/convert', mockUpload, convertImage);
app.post('/remove-bg', mockUpload, removeBackground);

describe('Image Controller - Beginner Tests', () => {
  
  describe('Image Compression', () => {
    test('should compress image with valid quality', async () => {
      const response = await request(app)
        .post('/compress')
        .send({ quality: 80 })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image compressed successfully');
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body).toHaveProperty('originalSize');
      expect(response.body).toHaveProperty('compressedSize');
      expect(response.body.quality).toBe(80);
    });

    test('should reject compression without quality', async () => {
      const response = await request(app)
        .post('/compress')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Quality must be between 1 and 100');
    });

    test('should reject invalid quality values', async () => {
      const response = await request(app)
        .post('/compress')
        .send({ quality: 150 })
        .expect(400);

      expect(response.body.error).toContain('Quality must be between 1 and 100');
    });
  });

  describe('Image Conversion', () => {
    test('should convert image with valid format', async () => {
      const response = await request(app)
        .post('/convert')
        .send({ format: 'webp' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image converted successfully');
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body.newFormat).toBe('webp');
    });

    test('should reject conversion without format', async () => {
      const response = await request(app)
        .post('/convert')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Invalid format');
    });

    test('should reject invalid format', async () => {
      const response = await request(app)
        .post('/convert')
        .send({ format: 'invalid' })
        .expect(400);

      expect(response.body.error).toContain('Invalid format');
    });
  });

  describe('Background Removal', () => {
    test('should remove background successfully', async () => {
      const response = await request(app)
        .post('/remove-bg')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Background removed successfully');
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body.filename).toContain('no-bg');
    });

    test('should handle credits exhausted scenario', async () => {
      const response = await request(app)
        .post('/remove-bg')
        .send({ simulateCreditsExhausted: true })
        .expect(402);

      expect(response.body.error).toContain('Credits exhausted');
      expect(response.body.code).toBe('CREDITS_EXHAUSTED');
      expect(response.body.useClientSide).toBe(true);
    });
  });
});
