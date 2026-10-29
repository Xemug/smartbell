import React, { useEffect, useState, useRef } from 'react';
import { applyAuthToken, verifyToken } from '../services/authService';
import api from '../services/api';

// Enhanced hook to detect if the user is on a mobile device and handle auth correctly
export const useMobileDetector = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDevToolsResponsiveMode, setIsDevToolsResponsiveMode] = useState(false);
  const authVerificationTimer = useRef(null);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile || window.innerWidth <= 768);
      
      // Check if we're in DevTools responsive mode
      const isInDevTools = /Chrome\//.test(navigator.userAgent) && /Google Inc\./.test(navigator.vendor) && 
                          (window.outerWidth !== window.innerWidth || 
                          window.outerHeight !== window.innerHeight);
      
      if (isInDevTools !== isDevToolsResponsiveMode) {
        setIsDevToolsResponsiveMode(isInDevTools);
        
        // When entering DevTools responsive mode, ensure token is applied
        if (isInDevTools) {
          console.log('DevTools responsive mode detected');
          // Immediately apply token
          applyAuthToken();
          
          // Set up periodic token verification while in DevTools mode
          if (authVerificationTimer.current) {
            clearInterval(authVerificationTimer.current);
          }
          
          authVerificationTimer.current = setInterval(() => {
            applyAuthToken();
            console.log('Periodic token verification in DevTools mode');
          }, 5000); // Check every 5 seconds while in DevTools mode
        } else if (authVerificationTimer.current) {
          // Clear verification timer when exiting DevTools mode
          clearInterval(authVerificationTimer.current);
          authVerificationTimer.current = null;
        }
      }
    };

    checkIfMobile();
    
    // Handle resize events with enhanced auth handling
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        checkIfMobile();
        // Apply token on resize
        const applied = applyAuthToken();
        if (applied) {
          console.log('Token re-applied on resize');
        }
        
        // If the resize is a major viewport change, verify token works
        const viewportChange = Math.abs(window.innerWidth - (window._lastWidth || 0)) > 100;
        if (viewportChange) {
          window._lastWidth = window.innerWidth;
          
          // Schedule a token verification
          setTimeout(async () => {
            try {
              const tokenValid = await verifyToken();
              if (!tokenValid) {
                console.warn('Token verification failed after viewport change');
                // Force token reapplication
                applyAuthToken();
              }
            } catch (error) {
              console.error('Error verifying token after resize:', error);
            }
          }, 500);
        }
      }, 250); // 250ms debounce
    };
    
    // Track initial viewport width
    window._lastWidth = window.innerWidth;
    
    window.addEventListener('resize', handleResize);
    
    // Add orientation change handler for mobile devices
    const handleOrientationChange = () => {
      console.log('Orientation changed - reapplying token');
      applyAuthToken();
    };
    
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    return () => {
      clearTimeout(resizeTimer);
      if (authVerificationTimer.current) {
        clearInterval(authVerificationTimer.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, [isDevToolsResponsiveMode]);

  return { isMobile, isDevToolsResponsiveMode };
};

const MobileDetector = ({ children, mobileComponent }) => {
  const { isMobile, isDevToolsResponsiveMode } = useMobileDetector();
  
  // Every time the view changes (mobile vs desktop), ensure token is applied
  useEffect(() => {
    const reapplyToken = async () => {
      const applied = applyAuthToken();
      if (applied) {
        console.log(`Token applied on view change to ${isMobile ? 'mobile' : 'desktop'}`);
        
        // Verify token is working after view change
        try {
          const isValid = await verifyToken();
          if (!isValid) {
            console.warn('Token verification failed after view change');
            // Try again with delay
            setTimeout(() => {
              applyAuthToken();
              console.log('Retry token application after failed verification');
            }, 500);
          }
        } catch (error) {
          console.error('Error verifying token after view change:', error);
        }
      }
    };
    
    reapplyToken();
  }, [isMobile]);
  
  // Additional handling for DevTools responsive mode
  useEffect(() => {
    if (isDevToolsResponsiveMode) {
      console.log('DevTools responsive mode detected in MobileDetector');
      // Apply auth token for all future requests
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Set Authorization header explicitly for DevTools mode');
      }
    }
  }, [isDevToolsResponsiveMode]);
  
  return isMobile ? mobileComponent : children;
};

export default MobileDetector;
