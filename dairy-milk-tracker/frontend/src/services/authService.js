/**
 * Authentication Service
 * 
 * A lightweight service that handles token management and authentication
 * persistence across the application, particularly during viewport changes.
 */

import api from './api';

/**
 * Apply the authentication token to API requests
 * Returns true if token was successfully applied, false otherwise
 */
const applyAuthToken = () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token applied successfully');
    return true;
  }
  console.warn('No auth token found to apply');
  return false;
};

/**
 * Remove the authentication token
 */
const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

/**
 * Store the authentication token
 */
const storeAuthToken = (token) => {
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Set up global event listeners for viewport changes
 * This is called once at application startup
 */
const setupAuthListeners = () => {
  // Apply token on load
  applyAuthToken();
  
  // Handle resize events efficiently with debouncing
  let resizeTimer;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const applied = applyAuthToken();
      if (applied) {
        console.log('Re-applied token on resize');
      }
    }, 100); // 100ms debounce
  };
  
  // Handle focus events - reapply token when tab/window regains focus
  const handleFocus = () => {
    const applied = applyAuthToken();
    if (applied) {
      console.log('Re-applied token on window focus');
    }
  };
  
  // Handle storage events - if token changes in another tab
  const handleStorage = (event) => {
    if (event.key === 'token') {
      if (event.newValue) {
        api.defaults.headers.common['Authorization'] = `Bearer ${event.newValue}`;
        console.log('Token updated from storage event');
      } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('Token removed from storage event');
      }
    }
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('storage', handleStorage);
  
  // Apply token on orientation change (specific to mobile)
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', () => {
      applyAuthToken();
      console.log('Re-applied token on orientation change');
    });
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('storage', handleStorage);
    
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', applyAuthToken);
    }
  };
};

/**
 * Verify if the current token is valid
 * This can be used before critical operations
 */
const verifyToken = async () => {
  try {
    // Apply the current token first
    applyAuthToken();
    
    // Try to make a lightweight request to validate token
    await api.get('/api/users/me');
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

export { 
  applyAuthToken, 
  removeAuthToken, 
  storeAuthToken, 
  setupAuthListeners,
  verifyToken 
};
