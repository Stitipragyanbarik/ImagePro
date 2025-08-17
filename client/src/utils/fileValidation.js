// Comprehensive file validation utility for all image processing features

export const FILE_VALIDATION = {
  // File size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 20, // Maximum files per upload
  
  // Supported formats by feature
  FORMATS: {
    BG_REMOVER: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    COMPRESSOR: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    CONVERTER: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
  },
  
  // Error messages
  ERRORS: {
    INVALID_TYPE: 'Invalid file type. Please select a valid image file.',
    FILE_TOO_LARGE: 'File size must be less than 10MB.',
    TOO_MANY_FILES: 'Maximum 20 files allowed per upload.',
    NO_FILES: 'Please select at least one file.',
    CORRUPTED_FILE: 'File appears to be corrupted or invalid.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    PROCESSING_ERROR: 'Failed to process image. Please try with a different image.',
    UNSUPPORTED_FORMAT: 'This image format is not supported.',
    EMPTY_FILE: 'File is empty or corrupted.'
  }
};

// Validate individual file
export const validateFile = (file, feature = 'CONVERTER') => {
  const errors = [];
  
  // Check if file exists
  if (!file) {
    errors.push(FILE_VALIDATION.ERRORS.NO_FILES);
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size === 0) {
    errors.push(`${file.name}: ${FILE_VALIDATION.ERRORS.EMPTY_FILE}`);
  } else if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(`${file.name}: File size (${sizeMB}MB) exceeds 10MB limit.`);
  }
  
  // Check file type
  const allowedTypes = FILE_VALIDATION.FORMATS[feature] || FILE_VALIDATION.FORMATS.CONVERTER;
  if (!allowedTypes.includes(file.type)) {
    const supportedFormats = allowedTypes
      .map(type => type.replace('image/', '').toUpperCase())
      .join(', ');
    errors.push(`${file.name}: Unsupported format. Supported: ${supportedFormats}`);
  }
  
  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('File has no name or invalid name.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate multiple files
export const validateFiles = (files, feature = 'CONVERTER') => {
  const fileArray = Array.from(files);
  const allErrors = [];
  const validFiles = [];
  
  // Check file count
  if (fileArray.length === 0) {
    allErrors.push(FILE_VALIDATION.ERRORS.NO_FILES);
    return { isValid: false, errors: allErrors, validFiles };
  }
  
  if (fileArray.length > FILE_VALIDATION.MAX_FILES_COUNT) {
    allErrors.push(`Too many files. Maximum ${FILE_VALIDATION.MAX_FILES_COUNT} files allowed.`);
    return { isValid: false, errors: allErrors, validFiles };
  }
  
  // Validate each file
  fileArray.forEach(file => {
    const validation = validateFile(file, feature);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      allErrors.push(...validation.errors);
    }
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    validFiles,
    totalFiles: fileArray.length,
    validCount: validFiles.length,
    invalidCount: fileArray.length - validFiles.length
  };
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file is likely corrupted
export const isFileCorrupted = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const img = new Image();
        img.onload = () => resolve(false); // File is valid
        img.onerror = () => resolve(true);  // File is corrupted
        img.src = reader.result;
      } catch (error) {
        resolve(true); // Error reading file
      }
    };
    
    reader.onerror = () => resolve(true); // Error reading file
    reader.readAsDataURL(file);
  });
};

// Validate image dimensions (optional)
export const validateImageDimensions = (file, minWidth = 1, minHeight = 1, maxWidth = 10000, maxHeight = 10000) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const errors = [];
        
        if (img.width < minWidth || img.height < minHeight) {
          errors.push(`${file.name}: Image too small. Minimum ${minWidth}x${minHeight} pixels.`);
        }
        
        if (img.width > maxWidth || img.height > maxHeight) {
          errors.push(`${file.name}: Image too large. Maximum ${maxWidth}x${maxHeight} pixels.`);
        }
        
        resolve({
          isValid: errors.length === 0,
          errors,
          dimensions: { width: img.width, height: img.height }
        });
      };
      
      img.onerror = () => {
        resolve({
          isValid: false,
          errors: [`${file.name}: Invalid or corrupted image file.`],
          dimensions: null
        });
      };
      
      img.src = reader.result;
    };
    
    reader.onerror = () => {
      resolve({
        isValid: false,
        errors: [`${file.name}: Failed to read image file.`],
        dimensions: null
      });
    };
    
    reader.readAsDataURL(file);
  });
};

// Network error handler
export const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please try again.';
  }
  
  return 'Connection error. Please try again.';
};

// Server error handler
export const handleServerError = (response) => {
  if (!response) {
    return 'Server is not responding. Please try again later.';
  }
  
  switch (response.status) {
    case 400:
      return 'Invalid request. Please check your file and try again.';
    case 401:
      return 'Authentication required. Please log in and try again.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 404:
      return 'Service not found. Please try again later.';
    case 413:
      return 'File too large. Please use a smaller file.';
    case 415:
      return 'Unsupported file type. Please use a supported image format.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Server temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `Server error (${response.status}). Please try again later.`;
  }
};
