import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  // React app is served from port 3000, but the API is on port 8000
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Force timeout so requests don't hang indefinitely
  timeout: 10000, // 10 seconds
});

// Add request interceptor to ensure token is applied to every request
api.interceptors.request.use(
  (config) => {
    // Apply authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network errors or timeout
    if (!error.response) {
      console.error('Network error or timeout:', error.message);
      return Promise.reject(error);
    }
    
    // Handle authentication errors (401)
    if (error.response.status === 401) {
      console.warn('Authentication error: 401 Unauthorized');
      
      // Check if we're in the middle of a responsive testing session
      const isDevToolsOpen = /Chrome\//.test(navigator.userAgent) && /Google Inc\./.test(navigator.vendor) && 
                            window.outerWidth !== window.innerWidth || 
                            window.outerHeight !== window.innerHeight;
                            
      if (isDevToolsOpen) {
        console.warn('DevTools detected - attempting to reapply token');
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Token reapplied during DevTools session');
          
          // If we're in a responsive testing scenario, don't remove the token
          // This allows the AuthDebug tool to fix the issue
          return Promise.reject({
            ...error,
            isDevToolsAuth: true
          });
        }
      }
      
      // Regular auth error - clear token and redirect
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle other common errors
    if (error.response.status === 403) {
      console.warn('Authorization error: 403 Forbidden');
    } else if (error.response.status === 404) {
      console.warn('Resource not found: 404');
    } else if (error.response.status >= 500) {
      console.error('Server error:', error.response.status);
    }
    
    return Promise.reject(error);
  }
);

export default api;
