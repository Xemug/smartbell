import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AddMilkProduction = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [herdId, setHerdId] = useState('');
  const [amountLiters, setAmountLiters] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [proteinPercentage, setProteinPercentage] = useState('');
  const [herds, setHerds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchHerds = async () => {
      try {
        const response = await axios.get('/api/herds/');
        setHerds(response.data);
        
        // Check if herd_id is provided in query params
        const params = new URLSearchParams(location.search);
        const herdIdParam = params.get('herd_id');
        
        if (herdIdParam && response.data.some(herd => herd.id === parseInt(herdIdParam))) {
          setHerdId(herdIdParam);
        } else if (response.data.length > 0) {
          setHerdId(response.data[0].id.toString());
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching herds', error);
        setError('Failed to load herds');
        setLoading(false);
      }
    };
    
    fetchHerds();
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date || !herdId || !amountLiters) {
      return setError('Please fill out all required fields');
    }
    
    try {
      setError('');
      setSaving(true);
      
      const payload = {
        date: new Date(date).toISOString(),
        herd_id: parseInt(herdId),
        amount_liters: parseFloat(amountLiters)
      };
      
      // Add optional fields if provided
      if (fatPercentage) {
        payload.fat_percentage = parseFloat(fatPercentage);
      }
      
      if (proteinPercentage) {
        payload.protein_percentage = parseFloat(proteinPercentage);
      }
      
      await axios.post('/api/milk-production/', payload);
      
      navigate('/milk-production');
    } catch (error) {
      console.error('Error adding milk production', error);
      setError('Failed to add milk production record');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2 className="form-title">Loading...</h2>
        </div>
      </div>
    );
  }

  if (herds.length === 0) {
    return (
      <div className="container">
        <div className="form-container">
          <h2 className="form-title">Add Milk Production</h2>
          <div className="alert alert-error">
            You need to create a herd before adding milk production.
          </div>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/herds/add')} 
            style={{ width: '100%' }}
          >
            Create Herd
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Add Milk Production</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Date*</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="herd">Herd*</label>
            <select
              id="herd"
              value={herdId}
              onChange={(e) => setHerdId(e.target.value)}
              required
            >
              {herds.map(herd => (
                <option key={herd.id} value={herd.id}>{herd.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (Liters)*</label>
            <input
              type="number"
              id="amount"
              step="0.1"
              min="0"
              value={amountLiters}
              onChange={(e) => setAmountLiters(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="fat">Fat Percentage (optional)</label>
            <input
              type="number"
              id="fat"
              step="0.1"
              min="0"
              max="100"
              value={fatPercentage}
              onChange={(e) => setFatPercentage(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="protein">Protein Percentage (optional)</label>
            <input
              type="number"
              id="protein"
              step="0.1"
              min="0"
              max="100"
              value={proteinPercentage}
              onChange={(e) => setProteinPercentage(e.target.value)}
            />
          </div>
          
          <div className="form-buttons">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => navigate('/milk-production')}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMilkProduction;
