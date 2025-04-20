import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditHerd = () => {
  const [herdName, setHerdName] = useState('');
  const [cowCount, setCowCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchHerd = async () => {
      try {
        const response = await axios.get(`/api/herds/${id}`);
        setHerdName(response.data.name);
        setCowCount(response.data.cow_count.toString());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching herd', error);
        setError('Failed to load herd data');
        setLoading(false);
      }
    };
    
    fetchHerd();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!herdName || !cowCount) {
      return setError('Please fill out all fields');
    }
    
    try {
      setError('');
      setSaving(true);
      
      await axios.put(`/api/herds/${id}`, {
        name: herdName,
        cow_count: parseInt(cowCount)
      });
      
      navigate('/herds');
    } catch (error) {
      console.error('Error updating herd', error);
      setError('Failed to update herd');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2 className="form-title">Loading herd data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Edit Herd</h2>
        
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
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHerd;
