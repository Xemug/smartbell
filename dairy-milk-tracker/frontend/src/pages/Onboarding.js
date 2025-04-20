import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [herdName, setHerdName] = useState('');
  const [cowCount, setCowCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmitHerd = async (e) => {
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
      
      // Move to next step
      setStep(2);
    } catch (error) {
      setError('Failed to create herd');
      console.error(error);
    }
    
    setLoading(false);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container">
      <div className="auth-container" style={{ maxWidth: '500px' }}>
        <h2 className="auth-title">Welcome to Dairy Milk Tracker</h2>
        
        {step === 1 ? (
          <>
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Let's set up your first herd to track milk production.
            </p>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form className="auth-form" onSubmit={handleSubmitHerd}>
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
              
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Herd...' : 'Create Herd'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="alert alert-success">
              Your herd has been created successfully!
            </div>
            
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Now you can start tracking your milk production. Head to the dashboard to get started.
            </p>
            
            <button onClick={handleContinue} className="btn-primary" style={{ width: '100%' }}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
