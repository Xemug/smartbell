import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddHerd = () => {
  const [herdName, setHerdName] = useState('');
  const [cowCount, setCowCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!herdName || !cowCount) {
      return setError('Please fill out all fields');
    }
    
    try {
      setError('');
      setLoading(true);
      
      await axios.post('/api/herds/', {
        name: herdName,
        cow_count: parseInt(cowCount)
      });
      
      navigate('/herds');
    } catch (error) {
      console.error('Error creating herd', error);
      setError('Failed to create herd');
    }
    
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Add New Herd</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="herd-name">Herd Name</label>
            <input
              type="text"
              id="herd-name"
              value={herdName}
              onChange={(e) => setHerdName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="cow-count">Number of Cows</label>
            <input
              type="number"
              id="cow-count"
              min="1"
              value={cowCount}
              onChange={(e) => setCowCount(e.target.value)}
              required
            />
          </div>
          
          <div className="form-buttons">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => navigate('/herds')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Herd'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHerd;
