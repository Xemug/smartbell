import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HerdsList = () => {
  const [herds, setHerds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHerds = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/herds/');
        setHerds(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching herds', error);
        setError('Failed to load herds');
        setLoading(false);
      }
    };
    
    fetchHerds();
  }, []);

  const handleDeleteHerd = async (id) => {
    if (window.confirm('Are you sure you want to delete this herd?')) {
      try {
        await axios.delete(`/api/herds/${id}`);
        setHerds(herds.filter(herd => herd.id !== id));
      } catch (error) {
        console.error('Error deleting herd', error);
        setError('Failed to delete herd');
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Loading herds...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Your Herds</h2>
        <Link to="/herds/add" className="btn-primary">Add New Herd</Link>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {herds.length === 0 ? (
        <div className="card">
          <p>You don't have any herds yet. Create your first herd to start tracking milk production.</p>
          <Link to="/herds/add" className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>
            Add New Herd
          </Link>
        </div>
      ) : (
        <div className="grid">
          {herds.map(herd => (
            <div className="card" key={herd.id}>
              <h3>{herd.name}</h3>
              <p><strong>Number of Cows:</strong> {herd.cow_count}</p>
              <p><strong>Created:</strong> {new Date(herd.created_at).toLocaleDateString()}</p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Link to={`/herds/${herd.id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  View
                </Link>
                <Link to={`/herds/edit/${herd.id}`} className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Edit
                </Link>
                <button 
                  className="btn-danger" 
                  style={{ flex: 1 }} 
                  onClick={() => handleDeleteHerd(herd.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HerdsList;
