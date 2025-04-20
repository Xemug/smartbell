import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser, updateMembership } = useAuth();
  const [selectedMembership, setSelectedMembership] = useState(currentUser?.membership_type || 'free');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleMembershipChange = (e) => {
    setSelectedMembership(e.target.value);
  };

  const handleUpdateMembership = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const success = await updateMembership(selectedMembership);
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: `Membership successfully updated to ${selectedMembership}`
        });
        setShowConfirm(false);
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to update membership'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while updating membership'
      });
      console.error(error);
    }
    
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="container">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Your Profile</h2>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}
        
        <div className="form-group">
          <label>Email</label>
          <input type="text" value={currentUser.email} disabled />
        </div>
        
        <div className="form-group">
          <label>Current Membership</label>
          <input 
            type="text" 
            value={currentUser.membership_type.charAt(0).toUpperCase() + currentUser.membership_type.slice(1)} 
            disabled 
          />
        </div>
        
        <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Update Membership</h3>
        
        <div className="form-group">
          <label>Select Membership Type</label>
          <select 
            value={selectedMembership} 
            onChange={handleMembershipChange}
            disabled={loading}
          >
            <option value="free">Free</option>
            <option value="annual">Annual</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
        
        {!showConfirm ? (
          <button 
            className="btn-primary" 
            onClick={() => setShowConfirm(true)}
            disabled={selectedMembership === currentUser.membership_type || loading}
          >
            Update Membership
          </button>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p>Are you sure you want to change your membership to <strong>{selectedMembership}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                className="btn-primary" 
                onClick={handleUpdateMembership}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Confirm'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
