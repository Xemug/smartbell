import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return setError('Please enter both email and password');
    }
    
    try {
      setError('');
      setLoading(true);
      
      const success = await login(email, password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Failed to sign in');
      }
    } catch (error) {
      setError('Failed to sign in');
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Login</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="auth-switch">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
