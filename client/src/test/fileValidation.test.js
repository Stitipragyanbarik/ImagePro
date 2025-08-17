import { describe, test, expect } from 'vitest'
import { validateFile, validateFiles, formatFileSize, handleServerError } from '../utils/fileValidation'

describe('File Validation Utility', () => {
  
  describe('validateFile', () => {
    test('validates correct image file', () => {
      const validFile = new File(['test'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      })
      
      const result = validateFile(validFile, 'CONVERTER')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects invalid file type', () => {
      const invalidFile = new File(['test'], 'test.txt', { 
        type: 'text/plain',
        size: 1024
      })
      
      const result = validateFile(invalidFile, 'CONVERTER')
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Unsupported format')
    })

test('rejects file too large', () => {
  // create fake 15MB data
  const largeContent = new Uint8Array(15 * 1024 * 1024); // 15MB of empty bytes
  const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
  
  const result = validateFile(largeFile, 'CONVERTER');
  
  expect(result.isValid).toBe(false);
  expect(result.errors[0]).toContain('exceeds 10MB limit');
});



    test('rejects empty file', () => {
      const emptyFile = new File([''], 'empty.jpg', { 
        type: 'image/jpeg',
        size: 0
      })
      
      const result = validateFile(emptyFile, 'CONVERTER')
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('empty or corrupted')
    })
  })

  describe('validateFiles', () => {
    test('validates multiple valid files', () => {
      const validFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg', size: 1024 }),
        new File(['test2'], 'test2.png', { type: 'image/png', size: 2048 })
      ]
      
      const result = validateFiles(validFiles, 'CONVERTER')
      
      expect(result.isValid).toBe(true)
      expect(result.validFiles).toHaveLength(2)
      expect(result.invalidCount).toBe(0)
    })

    test('handles mixed valid and invalid files', () => {
      const mixedFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg', size: 1024 }),
        new File(['test2'], 'test2.txt', { type: 'text/plain', size: 1024 })
      ]
      
      const result = validateFiles(mixedFiles, 'CONVERTER')
      
      expect(result.isValid).toBe(false)
      expect(result.validFiles).toHaveLength(1)
      expect(result.invalidCount).toBe(1)
      expect(result.errors[0]).toContain('Unsupported format')
    })

    test('rejects too many files', () => {
      const tooManyFiles = Array.from({ length: 25 }, (_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg', size: 1024 })
      )
      
      const result = validateFiles(tooManyFiles, 'CONVERTER')
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Maximum 20 files allowed')
    })
  })

  describe('formatFileSize', () => {
    test('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('handleServerError', () => {
    test('handles different HTTP status codes', () => {
      expect(handleServerError({ status: 400 })).toContain('Invalid request')
      expect(handleServerError({ status: 413 })).toContain('File too large')
      expect(handleServerError({ status: 415 })).toContain('Unsupported file type')
      expect(handleServerError({ status: 500 })).toContain('Server error')
    })

    test('handles missing response', () => {
      expect(handleServerError(null)).toContain('Server is not responding')
    })
  })

})