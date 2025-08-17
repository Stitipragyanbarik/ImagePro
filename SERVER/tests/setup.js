// Backend Test Setup for Jest
import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Google Cloud Storage
jest.mock('@google-cloud/storage', () => {
  return {
    Storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({
          save: jest.fn().mockResolvedValue(),
          delete: jest.fn().mockResolvedValue(),
          getSignedUrl: jest.fn().mockResolvedValue(['http://mock-signed-url.com']),
          exists: jest.fn().mockResolvedValue([true])
        })),
        upload: jest.fn().mockResolvedValue([{ name: 'mock-uploaded-file.jpg' }])
      }))
    }))
  };
});

// Mock Mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  connection: {
    close: jest.fn().mockResolvedValue()
  },
  Schema: jest.fn(),
  model: jest.fn()
}));

// Mock Sharp for image processing
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    avif: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-processed-image-data')),
    toFile: jest.fn().mockResolvedValue({ size: 1024 })
  }));
});

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token-12345'),
  verify: jest.fn(() => ({ 
    email: 'test@example.com', 
    userId: 'mock-user-id-123' 
  }))
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('mock-hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock axios for external API calls
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ 
    data: { 
      success: true,
      result: 'mock-api-response' 
    } 
  }),
  get: jest.fn().mockResolvedValue({ 
    data: { 
      success: true 
    } 
  })
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test helpers
global.mockUser = {
  email: 'test@example.com',
  userId: 'mock-user-id-123'
};

global.mockFile = {
  originalname: 'test-image.jpg',
  mimetype: 'image/jpeg',
  size: 1024 * 1024, // 1MB
  buffer: Buffer.from('mock-image-data')
};
