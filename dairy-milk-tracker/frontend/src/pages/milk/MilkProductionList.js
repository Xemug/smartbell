import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MilkProductionList = () => {
  const [milkProductions, setMilkProductions] = useState([]);
  const [herds, setHerds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHerd, setSelectedHerd] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch herds
        const herdsResponse = await axios.get('/api/herds/');
        setHerds(herdsResponse.data);
        
        // Fetch milk production data
        const url = selectedHerd === 'all' 
          ? '/api/milk-production/' 
          : `/api/milk-production/?herd_id=${selectedHerd}`;
        
        const milkResponse = await axios.get(url);
        setMilkProductions(milkResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedHerd]);

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/milk-production/${id}`);
        setMilkProductions(milkProductions.filter(record => record.id !== id));
      } catch (error) {
        console.error('Error deleting record', error);
        setError('Failed to delete record');
      }
    }
  };

  const handleHerdChange = (e) => {
    setSelectedHerd(e.target.value);
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Loading milk production records...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Milk Production Records</h2>
        <Link to="/milk-production/add" className="btn-primary">Add Milk Production</Link>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="herd-filter" style={{ marginRight: '10px' }}>Filter by Herd:</label>
        <select 
          id="herd-filter" 
          value={selectedHerd} 
          onChange={handleHerdChange}
          style={{ width: 'auto', display: 'inline-block' }}
        >
          <option value="all">All Herds</option>
          {herds.map(herd => (
            <option key={herd.id} value={herd.id}>{herd.name}</option>
          ))}
        </select>
      </div>
      
      {milkProductions.length === 0 ? (
        <div className="card">
          <p>No milk production records found for the selected criteria.</p>
          <Link to="/milk-production/add" className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>
            Add Milk Production
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Herd</th>
                <th>Amount (L)</th>
                <th>Fat %</th>
                <th>Protein %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milkProductions.map(record => {
                const herd = herds.find(h => h.id === record.herd_id);
                return (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{herd ? herd.name : 'Unknown'}</td>
                    <td>{record.amount_liters.toFixed(1)}</td>
                    <td>{record.fat_percentage ? record.fat_percentage.toFixed(1) : 'N/A'}</td>
                    <td>{record.protein_percentage ? record.protein_percentage.toFixed(1) : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <Link to={`/milk-production/edit/${record.id}`} className="btn-primary">
                          Edit
                        </Link>
                        <button 
                          className="btn-danger" 
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MilkProductionList;
