// API Routes Test - Beginner Level
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { jest } from '@jest/globals';
// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Mock routes
app.get('/', (req, res) => {
  res.send('Image processing server is running!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Mock protected route
app.get('/protected', (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  res.json({ message: 'Access granted', user: 'test@example.com' });
});

// Mock image upload route
app.post('/api/image/upload', (req, res) => {
  if (!req.body.imageData) {
    return res.status(400).json({ error: 'No image data provided' });
  }
  
  res.json({
    message: 'Image uploaded successfully',
    imageId: 'mock-image-id-123',
    uploadTime: new Date().toISOString()
  });
});

describe('API Routes -  Tests', () => {
  
  describe('Basic Routes', () => {
    test('GET / should return server running message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Image processing server is running!');
    });

    test('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /nonexistent should return 404', async () => {
      await request(app)
        .get('/nonexistent-route')
        .expect(404);
    });
  });

  describe('Protected Routes', () => {
    test('should allow access with authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Access granted');
      expect(response.body).toHaveProperty('user');
    });

    test('should deny access without authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('Image Upload Routes', () => {
    test('should accept image upload with data', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .send({ imageData: 'base64-image-data' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image uploaded successfully');
      expect(response.body).toHaveProperty('imageId');
      expect(response.body).toHaveProperty('uploadTime');
    });

    test('should reject upload without image data', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('No image data provided');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should handle OPTIONS request', async () => {
      await request(app)
        .options('/health')
        .expect(204);
    });
  });

  describe('Content Type Headers', () => {
    test('JSON routes should return JSON content type', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('should accept JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .send({ imageData: 'test' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });
  });
});
