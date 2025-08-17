// Utility Functions Test - Beginner Level
import { jest } from '@jest/globals';
// Simple utility functions to test
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateFileName = (originalName, suffix = '') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000); // Add randomness
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}${suffix}_${timestamp}_${random}.${extension}`;
};

const validateImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  return allowedTypes.includes(mimetype);
};

const calculateCompressionRatio = (originalSize, compressedSize) => {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};

const isValidQuality = (quality) => {
  const q = parseInt(quality);
  return !isNaN(q) && q >= 1 && q <= 100;
};

describe('Utility Functions - Beginner Tests', () => {
  
  describe('Email Validation', () => {
    test('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('File Size Formatting', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    test('should handle large numbers', () => {
      const result = formatFileSize(5 * 1024 * 1024 * 1024);
      expect(result).toBe('5 GB');
    });
  });

  describe('File Name Generation', () => {
    test('should generate unique file names', () => {
      const name1 = generateFileName('test.jpg');
      const name2 = generateFileName('test.jpg');

      expect(name1).not.toBe(name2);
      expect(name1).toContain('test');
      expect(name1).toContain('.jpg');
    });

    test('should add suffix when provided', () => {
      const name = generateFileName('image.png', '_compressed');
      
      expect(name).toContain('image_compressed');
      expect(name).toContain('.png');
    });

    test('should preserve file extension', () => {
      expect(generateFileName('photo.jpeg')).toContain('.jpeg');
      expect(generateFileName('document.pdf')).toContain('.pdf');
    });
  });

  describe('Image Type Validation', () => {
    test('should accept valid image types', () => {
      expect(validateImageType('image/jpeg')).toBe(true);
      expect(validateImageType('image/jpg')).toBe(true);
      expect(validateImageType('image/png')).toBe(true);
      expect(validateImageType('image/webp')).toBe(true);
      expect(validateImageType('image/avif')).toBe(true);
    });

    test('should reject invalid image types', () => {
      expect(validateImageType('text/plain')).toBe(false);
      expect(validateImageType('application/pdf')).toBe(false);
      expect(validateImageType('video/mp4')).toBe(false);
      expect(validateImageType('image/gif')).toBe(false);
    });
  });

  describe('Compression Ratio Calculation', () => {
    test('should calculate compression ratio correctly', () => {
      expect(calculateCompressionRatio(1000, 500)).toBe(50);
      expect(calculateCompressionRatio(2000, 1000)).toBe(50);
      expect(calculateCompressionRatio(1000, 800)).toBe(20);
    });

    test('should handle edge cases', () => {
      expect(calculateCompressionRatio(0, 0)).toBe(0);
      expect(calculateCompressionRatio(1000, 0)).toBe(100);
      expect(calculateCompressionRatio(1000, 1000)).toBe(0);
    });
  });

  describe('Quality Validation', () => {
    test('should accept valid quality values', () => {
      expect(isValidQuality(1)).toBe(true);
      expect(isValidQuality(50)).toBe(true);
      expect(isValidQuality(100)).toBe(true);
      expect(isValidQuality('80')).toBe(true);
    });

    test('should reject invalid quality values', () => {
      expect(isValidQuality(0)).toBe(false);
      expect(isValidQuality(101)).toBe(false);
      expect(isValidQuality(-10)).toBe(false);
      expect(isValidQuality('invalid')).toBe(false);
      expect(isValidQuality(null)).toBe(false);
    });
  });
});
