import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
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

  // Setup axios defaults and interceptors
  useEffect(() => {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Handle token expiration
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
  }, [navigate]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await axios.get('/api/users/me');
          setCurrentUser(response.data);
        } catch (error) {
          console.error('Auth check error:', error);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/token', new URLSearchParams({
        'username': email,
        'password': password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', access_token);
      
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
      const response = await axios.get('/api/users/me');
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
      await axios.post('/api/auth/register', {
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
    localStorage.removeItem('token');
    
    // Clear user
    setCurrentUser(null);
    
    // Redirect to login
    navigate('/login');
  };

  const updateMembership = async (membershipType) => {
    try {
      const response = await axios.put(`/api/users/membership?membership_type=${membershipType}`);
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
      const response = await axios.put('/api/users/profile', userData);
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
      await axios.delete('/api/users/');
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
