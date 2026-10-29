import React, { useEffect } from 'react';
import api from '../services/api';

/**
 * AuthWrapper Component
 * 
 * A higher-order component that ensures authentication token is properly
 * applied to all API requests when components mount/unmount, particularly
 * important during responsive testing and view transitions.
 */
const AuthWrapper = ({ children }) => {
  useEffect(() => {
    // Function to ensure token is applied
    const ensureAuthentication = () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthWrapper: Authentication token verified and applied');
      }
    };

    // Apply token on mount
    ensureAuthentication();

    // Set up listeners for resize events (which often trigger responsive changes)
    window.addEventListener('resize', ensureAuthentication);
    
    // Set up mutation observer to detect DOM changes (like responsive view changes)
    const observer = new MutationObserver((mutations) => {
      ensureAuthentication();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', ensureAuthentication);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default AuthWrapper;
