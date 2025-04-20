import React, { useEffect, useState } from 'react';

// Simple hook to detect if the user is on a mobile device
export const useMobileDetector = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile || window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

const MobileDetector = ({ children, mobileComponent }) => {
  const isMobile = useMobileDetector();
  
  return isMobile ? mobileComponent : children;
};

export default MobileDetector;
