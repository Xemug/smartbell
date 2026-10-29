import React, { useEffect } from 'react';
import { applyAuthToken, setupAuthListeners } from '../services/authService';

/**
 * AuthProvider Component
 * 
 * A lightweight component that ensures authentication is maintained
 * across the application, particularly during viewport changes.
 */
const AuthProvider = ({ children }) => {
  // Set up global auth listeners once on mount
  useEffect(() => {
    // Apply token on mount
    applyAuthToken();
    
    // Set up global listeners and get cleanup function
    const cleanup = setupAuthListeners();
    
    // Clean up on unmount
    return cleanup;
  }, []);

  // Simply render children - all auth logic is in the useEffect
  return <>{children}</>;
};

export default AuthProvider;
