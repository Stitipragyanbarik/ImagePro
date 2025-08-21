// API Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api'
  },
  production: {
    API_BASE_URL: 'https://imageproo.onrender.com/api'
  }
};

// Determine current environment
const environment = import.meta.env.MODE || 'development';

// Export the configuration for current environment
export const API_CONFIG = config[environment] || config.development;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  
  // Image Processing
  COMPRESS: '/image/compress',
  CONVERT: '/image/convert',
  REMOVE_BG: '/image/remove-bg',
  DOWNLOAD: '/image/download',
  HISTORY: '/image/history',
  RECENT_ACTIVITY: '/image/recent-activity',
  SAVE_ACTIVITY: '/image/save-activity',
  CLEAR_ACTIVITY: '/image/clear-activity',
  CLEAR_RECENT_ACTIVITY: '/image/clear-recent-activity'
};

export default API_CONFIG;
