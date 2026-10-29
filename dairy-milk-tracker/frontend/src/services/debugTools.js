/**
 * Debug Tools for Dairy Milk Tracker
 * 
 * A collection of utilities to help diagnose and fix common issues
 */

import api from './api';
import { applyAuthToken } from './authService';

/**
 * Fix authentication issues
 * 
 * A utility function that users can run from the console to fix authentication issues
 */
const fixAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No authentication token found. Please log in again.');
    return false;
  }

  try {
    // Force apply the token to the API
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Authentication token manually applied!');
    console.log('Token:', token.substring(0, 15) + '...');
    console.log('Base URL:', api.defaults.baseURL);
    
    // Verify what URL is being used
    console.log('API requests will go to:', 
      api.defaults.baseURL ? `${api.defaults.baseURL}/api/...` : 'http://localhost:3000/api/...'
    );

    return true;
  } catch (error) {
    console.error('Error fixing authentication:', error);
    return false;
  }
};

/**
 * Check the current configuration
 */
const checkConfig = () => {
  console.log('Current configuration:');
  console.log('API Base URL:', api.defaults.baseURL || 'Using relative paths (proxy)');
  console.log('Token present:', localStorage.getItem('token') ? 'Yes' : 'No');
  console.log('Auth header present:', api.defaults.headers.common['Authorization'] ? 'Yes' : 'No');
  
  // Detect if proxy is being used
  const isUsingProxy = !api.defaults.baseURL || api.defaults.baseURL === '';
  console.log('Using React proxy:', isUsingProxy ? 'Yes' : 'No');
  
  return {
    baseURL: api.defaults.baseURL,
    hasToken: !!localStorage.getItem('token'),
    hasAuthHeader: !!api.defaults.headers.common['Authorization'],
    isUsingProxy
  };
};

// Expose to window for console debugging
window.milkTrackerDebug = {
  fixAuth,
  checkConfig,
  applyAuthToken
};

export {
  fixAuth,
  checkConfig
};
