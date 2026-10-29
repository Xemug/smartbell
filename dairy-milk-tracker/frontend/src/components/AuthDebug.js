import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { applyAuthToken, verifyToken } from '../services/authService';

const AuthDebug = () => {
  const { currentUser } = useAuth();
  const [token, setToken] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  
  // Only show in development mode
  const isDev = process.env.NODE_ENV === 'development';
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('unknown');
  const intervalRef = useRef(null);
  
  // Force re-apply token on open
  const applyToken = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      console.log('Auth token re-applied from debug panel');
      
      // Verify token is working
      try {
        const isValid = await verifyToken();
        setTokenStatus(isValid ? 'valid' : 'invalid');
        return isValid;
      } catch (error) {
        console.error('Token verification failed:', error);
        setTokenStatus('invalid');
        return false;
      }
    }
    setTokenStatus('missing');
    return false;
  };
  
  // Check if DevTools is open in responsive mode
  useEffect(() => {
    const checkDevTools = () => {
      const isInDevTools = /Chrome\//.test(navigator.userAgent) && /Google Inc\./.test(navigator.vendor) && 
                          (window.outerWidth !== window.innerWidth || 
                          window.outerHeight !== window.innerHeight);
      setIsDevToolsOpen(isInDevTools);
      
      // If DevTools detected, ensure token is applied
      if (isInDevTools && currentUser) {
        applyAuthToken();
      }
    };
    
    // Check immediately
    checkDevTools();
    
    // Check periodically
    const interval = setInterval(checkDevTools, 2000); // Check every 2 seconds
    intervalRef.current = interval;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentUser]);
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || 'No token found');
  }, [currentUser]);
  
  if (!isDev) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '5px',
        padding: '10px',
        fontSize: '12px',
        zIndex: 1000,
        maxWidth: '300px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: showDebug ? 'block' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <button 
        onClick={() => {
          setShowDebug(!showDebug);
          if (!showDebug) applyToken();
        }}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1001,
          backgroundColor: isDevToolsOpen 
            ? '#ff9800' // Orange if DevTools is open in responsive mode
            : currentUser 
              ? tokenStatus === 'valid' 
                ? '#28a745' // Green if logged in with valid token
                : '#ffc107' // Yellow if logged in but token might have issues
              : '#dc3545', // Red if not logged in
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: isDevToolsOpen ? '0 0 8px rgba(255, 152, 0, 0.8)' : 'none',
          animation: isDevToolsOpen ? 'pulse 2s infinite' : 'none',
        }}
      >
        {showDebug ? 'X' : 'A'}
      </button>
      
      {/* Add CSS for the pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      
      {showDebug && (
        <>
          <h4 style={{ margin: '0 0 8px 0' }}>Auth Debug</h4>
          <div>
            <strong>Auth Status:</strong> {currentUser ? 'Logged In' : 'Not Logged In'}
          </div>
          {currentUser && (
            <div>
              <strong>User:</strong> {currentUser.email}
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <strong>Token:</strong>
            <div style={{ 
              fontSize: '10px', 
              wordBreak: 'break-all', 
              maxHeight: '80px', 
              overflowY: 'auto',
              backgroundColor: '#eee',
              padding: '4px',
              borderRadius: '3px'
            }}>
              {token ? token.substring(0, 20) + '...' : 'No token'}
            </div>
          </div>
          
          {/* Token status */}
          <div style={{ marginTop: '8px' }}>
            <strong>Token Status:</strong> 
            <span style={{
              color: tokenStatus === 'valid' ? '#28a745' : tokenStatus === 'invalid' ? '#dc3545' : '#ffc107',
              fontWeight: 'bold'
            }}>
              {tokenStatus === 'valid' ? 'Valid' : tokenStatus === 'invalid' ? 'Invalid' : tokenStatus === 'missing' ? 'Missing' : 'Unknown'}
            </span>
          </div>
          
          {/* DevTools Status */}
          <div style={{ marginTop: '8px' }}>
            <strong>DevTools:</strong> 
            <span style={{
              color: isDevToolsOpen ? '#ff9800' : '#6c757d',
              fontWeight: isDevToolsOpen ? 'bold' : 'normal'
            }}>
              {isDevToolsOpen ? 'Detected (Responsive Mode)' : 'Not Detected'}
            </span>
          </div>

          {/* Debug actions */}
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={async () => {
                const applied = await applyToken();
                if (applied) {
                  alert('Token re-applied and verified!');
                } else if (tokenStatus === 'invalid') {
                  alert('Token is invalid. Please log in again.');
                } else {
                  alert('No token to apply!');
                }
              }}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Re-apply & Verify Token
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                setToken('Token cleared');
                setTokenStatus('missing');
                alert('Token removed! You will need to log in again.');
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Clear Token
            </button>
          </div>
          
          {/* Responsive testing info */}
          <div style={{ marginTop: '12px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
            <strong>Responsive Testing:</strong>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              {isDevToolsOpen ? (
                <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                  DevTools detected in responsive mode. If you see 401 errors, click "Re-apply & Verify Token".
                </span>
              ) : (
                <span>
                  If you're using DevTools to test responsive design, token issues may occur. Click "Re-apply & Verify Token" if you encounter 401 errors.
                </span>
              )}
            </div>
          </div>
          
          {/* Fix 401 Errors button - only shown when DevTools is detected */}
          {isDevToolsOpen && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={async () => {
                  try {
                    // Apply token with extended verification
                    const token = localStorage.getItem('token');
                    if (!token) {
                      alert('No token found. Please log in again.');
                      return;
                    }
                    
                    // Apply token to all future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Force a token verification
                    const isValid = await verifyToken();
                    
                    if (isValid) {
                      setTokenStatus('valid');
                      alert('Authentication fixed! Your token is working correctly now.');
                    } else {
                      setTokenStatus('invalid');
                      alert('Unable to fix authentication. Please try logging in again.');
                    }
                  } catch (error) {
                    console.error('Error fixing authentication:', error);
                    alert('Error fixing authentication. Please try logging in again.');
                  }
                }}
                style={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                Fix 401 Errors in DevTools
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuthDebug;
