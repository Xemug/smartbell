import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ProfileNew = () => {
  const { currentUser, updateMembership, logout } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState({
    username: false,
    email: false,
    password: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (field) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const data = {};
      if (field === 'username') data.username = username;
      if (field === 'email') data.email = email;
      if (field === 'password') data.password = password;
      
      await axios.put('/api/users/profile', data);
      
      setIsEditing({ ...isEditing, [field]: false });
      if (field === 'password') setPassword('');
      
      setMessage({ 
        type: 'success', 
        text: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully` 
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      let errorMessage = `Failed to update ${field}`;
      
      if (error.response) {
        errorMessage = error.response.data?.detail || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Here we're hardcoding to annual for the demo
      const success = await updateMembership('annual');
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: 'Membership successfully upgraded to Annual'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to upgrade membership'
        });
      }
    } catch (error) {
      console.error('Error upgrading membership:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while upgrading membership'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete('/api/users/');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete account'
      });
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="header-controls">
        <div className="notification-icon">🔔</div>
        <div className="herd-selector">
          <select disabled>
            <option>{currentUser?.herds?.[0]?.name || 'my ranch'}</option>
          </select>
        </div>
        <div className="profile-icon">👤</div>
      </div>
      
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}
      
      <div className="profile-avatar">
        <div className="avatar-image">
          👤
          <div className="avatar-edit">✏️</div>
        </div>
      </div>
      
      <div className="profile-form">
        <div className="form-group">
          <label>Username</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing.username}
            />
            {!isEditing.username ? (
              <span className="edit-icon" onClick={() => setIsEditing({...isEditing, username: true})}>✏️</span>
            ) : (
              <span className="edit-icon" onClick={() => handleSave('username')}>✓</span>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>e-mail</label>
          <div className="input-wrapper">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing.email}
            />
            {!isEditing.email ? (
              <span className="edit-icon" onClick={() => setIsEditing({...isEditing, email: true})}>✏️</span>
            ) : (
              <span className="edit-icon" onClick={() => handleSave('email')}>✓</span>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>password</label>
          <div className="input-wrapper">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!isEditing.password}
              placeholder="••••••••••••"
            />
            {!isEditing.password ? (
              <span className="edit-icon" onClick={() => setIsEditing({...isEditing, password: true})}>✏️</span>
            ) : (
              <span className="edit-icon" onClick={() => handleSave('password')}>✓</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="membership-card">
        <div className="membership-info">
          <span className="label">Membership</span>
        </div>
        <div className="membership-type">
          {currentUser?.membership_type.charAt(0).toUpperCase() + currentUser?.membership_type.slice(1)}
        </div>
      </div>
      
      <div className="upgrade-button">
        <button 
          className="btn-primary" 
          onClick={handleUpgrade}
          disabled={loading || currentUser?.membership_type === 'lifetime'}
        >
          {loading ? 'Processing...' : 'Upgrade my membership'}
        </button>
      </div>
      
      <div className="delete-account">
        <button onClick={handleDeleteAccount} disabled={loading}>
          {deleteConfirm ? 'Are you sure? Click again to confirm' : 'Delete my account'}
        </button>
      </div>
      
      <div className="tab-navigation">
        <Link to="/dashboard" className="tab">
          <div className="icon">📊</div>
          <span>Milk Log</span>
        </Link>
        <Link to="/herds" className="tab">
          <div className="icon">🐄</div>
          <span>My Ranch</span>
        </Link>
        <Link to="/profile" className="tab active">
          <div className="icon">👤</div>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default ProfileNew;
