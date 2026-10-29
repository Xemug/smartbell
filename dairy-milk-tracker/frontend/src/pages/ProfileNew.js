import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, 
  GridContainer, 
  GridRow, 
  GridCol, 
  Input, 
  Select, 
  Form, 
  Card, 
  CardContent, 
  TabNavigation,
  Typography,
  Spacer 
} from '../components/ui';

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
      <GridContainer>
        
        {message.text && (
          <GridRow>
            <GridCol xs={12}>
              <Card elevation={1} className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                <CardContent>
                  <Typography variant="body2" align="center" color={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                  </Typography>
                </CardContent>
              </Card>
              <Spacer size="sm" />
            </GridCol>
          </GridRow>
        )}
        
        <GridRow>
          <GridCol xs={12}>
            <div className="profile-avatar">
              <div className="avatar-image">
                👤
                <div className="avatar-edit">✏️</div>
              </div>
            </div>
          </GridCol>
        </GridRow>
        
        <Spacer size="sm" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card elevation={1}>
              <CardContent>
                <div className="profile-form">
                  <div className="form-group">
                    <Typography variant="subtitle2" component="label">Username</Typography>
                    <div className="input-wrapper">
                      <Input 
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
                    <Typography variant="subtitle2" component="label">e-mail</Typography>
                    <div className="input-wrapper">
                      <Input 
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
                    <Typography variant="subtitle2" component="label">password</Typography>
                    <div className="input-wrapper">
                      <Input 
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
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card elevation={1}>
              <CardContent>
                <div className="membership-card">
                  <div className="membership-info">
                    <Typography variant="caption">Membership</Typography>
                  </div>
                  <div className="membership-type">
                    <Typography variant="h4">
                      {currentUser?.membership_type.charAt(0).toUpperCase() + currentUser?.membership_type.slice(1)}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Button 
              variant="primary" 
              size="medium" 
              fullWidth
              onClick={handleUpgrade}
              disabled={loading || currentUser?.membership_type === 'lifetime'}
            >
              {loading ? 'Processing...' : 'Upgrade my membership'}
            </Button>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12} className="delete-account">
            <Button 
              variant="text" 
              color="error"
              onClick={handleDeleteAccount} 
              disabled={loading}
            >
              {deleteConfirm ? 'Are you sure? Click again to confirm' : 'Delete my account'}
            </Button>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
      </GridContainer>
    </div>
  );
};

export default ProfileNew;
