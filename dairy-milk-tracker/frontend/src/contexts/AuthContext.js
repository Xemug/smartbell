import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';
import { applyAuthToken, removeAuthToken, storeAuthToken } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Setup auth check effect
  useEffect(() => {
    // No need to set up interceptors here anymore - moved to api.js
  }, [navigate]);

  // Setup auth check effect - run when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Make sure the token is properly set in the axios instance
          applyAuthToken();
          
          // Validate token and get user data
          const response = await api.get('/api/users/me');
          setCurrentUser(response.data);
        } catch (error) {
          // Clear invalid token
          removeAuthToken();
          setCurrentUser(null);
          
          // If we're not on the login page, redirect to login
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            navigate('/login');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        // If we're not on the login page and there's no token, redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          navigate('/login');
        }
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      setError('');
      // Use the correct backend URL
      const response = await axios.post('http://localhost:8000/api/auth/token', new URLSearchParams({
        'username': email,
        'password': password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      
      // Store token in localStorage
      storeAuthToken(access_token);
      
      // Fetch user data
      await fetchUserData();
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/users/me');
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const register = async (email, password, username) => {
    try {
      setError('');
      await api.post('/api/auth/register', {
        email,
        password,
        username: username || email // Use email as username if not provided
      });
      
      // Login after registration
      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.detail || 'Registration failed. This email may already be in use.');
      return false;
    }
  };

  const logout = () => {
    // Remove token
    removeAuthToken();
    
    // Clear user
    setCurrentUser(null);
    
    // Redirect to login
    navigate('/login');
  };

  const updateMembership = async (membershipType) => {
    try {
      const response = await api.put(`/api/users/membership?membership_type=${membershipType}`);
      setCurrentUser(response.data);
      return true;
    } catch (error) {
      console.error('Error updating membership:', error);
      setError(error.response?.data?.detail || 'Failed to update membership');
      return false;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/api/users/profile', userData);
      setCurrentUser(response.data);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.detail || 'Failed to update profile');
      return false;
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/api/users/');
      localStorage.removeItem('token');
      setCurrentUser(null);
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.detail || 'Failed to delete account');
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    updateMembership,
    updateProfile,
    deleteAccount,
    fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
