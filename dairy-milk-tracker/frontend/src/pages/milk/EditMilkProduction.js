import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditMilkProduction = () => {
  const [date, setDate] = useState('');
  const [herdId, setHerdId] = useState('');
  const [amountLiters, setAmountLiters] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [proteinPercentage, setProteinPercentage] = useState('');
  const [herds, setHerds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch herds
        const herdsResponse = await axios.get('/api/herds/');
        setHerds(herdsResponse.data);
        
        // Fetch milk production record
        const recordResponse = await axios.get(`/api/milk-production/${id}`);
        const record = recordResponse.data;
        
        // Format date to YYYY-MM-DD
        const recordDate = new Date(record.date);
        setDate(recordDate.toISOString().split('T')[0]);
        
        setHerdId(record.herd_id.toString());
        setAmountLiters(record.amount_liters.toString());
        
        if (record.fat_percentage !== null) {
          setFatPercentage(record.fat_percentage.toString());
        }
        
        if (record.protein_percentage !== null) {
          setProteinPercentage(record.protein_percentage.toString());
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

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
      
      await axios.put(`/api/milk-production/${id}`, payload);
      
      navigate('/milk-production');
    } catch (error) {
      console.error('Error updating milk production', error);
      setError('Failed to update milk production record');
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

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Edit Milk Production</h2>
        
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMilkProduction;
