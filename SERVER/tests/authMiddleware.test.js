// Auth Middleware Test - Beginner Level
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
// Mock the authenticate function (simplified version)
const authenticate = (req, res, next) => {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Check token format
    const authHeader = req.headers.authorization;
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

describe('Auth Middleware - Beginner Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should pass with valid token', () => {
    // Mock valid token verification
    jwt.verify.mockReturnValue({ 
      email: 'test@example.com', 
      userId: 'mock-user-id' 
    });
    
    req.headers.authorization = 'Bearer valid-jwt-token';

    authenticate(req, res, next);

    expect(req.user).toEqual({ 
      email: 'test@example.com', 
      userId: 'mock-user-id' 
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject request without authorization header', () => {
    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Access denied. No token provided.' 
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token format', () => {
    req.headers.authorization = 'InvalidFormat token';

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Access denied. Invalid token format.' 
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject expired token', () => {
    jwt.verify.mockImplementation(() => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    req.headers.authorization = 'Bearer expired-token';

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Token expired. Please log in again.' 
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject invalid token', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    req.headers.authorization = 'Bearer invalid-token';

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Invalid token.' 
    });
    expect(next).not.toHaveBeenCalled();
  });
});
