import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const RanchNew = () => {
  const { currentUser } = useAuth();
  const [selectedHerd, setSelectedHerd] = useState('');
  const [herds, setHerds] = useState([]);
  const [herdData, setHerdData] = useState(null);
  const [cowCount, setCowCount] = useState('');
  const [ranchName, setRanchName] = useState('');
  const [locationLine1, setLocationLine1] = useState('');
  const [locationLine2, setLocationLine2] = useState('');
  const [timeSpan, setTimeSpan] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState({
    ranchName: false,
    location: false
  });

  useEffect(() => {
    fetchHerds();
  }, []);

  useEffect(() => {
    if (selectedHerd) {
      fetchHerdDetails();
    }
  }, [selectedHerd]);

  const fetchHerds = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/herds/');
      setHerds(response.data);
      
      if (response.data.length > 0) {
        setSelectedHerd(response.data[0].id.toString());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching herds:', error);
      setError('Failed to load herds');
      setLoading(false);
    }
  };

  const fetchHerdDetails = async () => {
    try {
      const response = await axios.get(`/api/herds/${selectedHerd}`);
      setHerdData(response.data);
      setCowCount(response.data.cow_count.toString());
      setRanchName(response.data.name);
      setLocationLine1(response.data.location_line1 || '');
      setLocationLine2(response.data.location_line2 || '');
    } catch (error) {
      console.error('Error fetching herd details:', error);
      setError('Failed to load herd details');
    }
  };

  const handleHerdChange = (e) => {
    setSelectedHerd(e.target.value);
  };

  const handleTimeSpanChange = (e) => {
    setTimeSpan(e.target.value);
  };

  const handleUpdateCowCount = async () => {
    // Validate cow count
    if (!cowCount || cowCount.trim() === '') {
      setError('Please enter the number of cows');
      return;
    }
    
    const cowCountValue = parseInt(cowCount);
    
    if (isNaN(cowCountValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (cowCountValue <= 0) {
      setError('Cow count must be greater than zero');
      return;
    }
    
    if (cowCountValue > 10000) {
      setError('Cow count seems unusually high. Please verify your input');
      return;
    }
    
    try {
      setError('');
      
      await axios.put(`/api/herds/${selectedHerd}`, {
        name: herdData.name,
        cow_count: cowCountValue,
        location_line1: herdData.location_line1 || null,
        location_line2: herdData.location_line2 || null
      });
      
      // Refresh herd data
      fetchHerdDetails();
    } catch (error) {
      console.error('Error updating cow count:', error);
      setError('Failed to update cow count');
    }
  };

  const handleUpdateRanchName = async () => {
    // Validate ranch name
    if (!ranchName || ranchName.trim() === '') {
      setError('Ranch name cannot be empty');
      return;
    }
    
    if (ranchName.trim().length < 2) {
      setError('Ranch name must be at least 2 characters');
      return;
    }
    
    if (ranchName.trim().length > 50) {
      setError('Ranch name must be less than 50 characters');
      return;
    }
    
    try {
      setError('');
      
      await axios.put(`/api/herds/${selectedHerd}`, {
        name: ranchName,
        cow_count: herdData.cow_count,
        location_line1: herdData.location_line1,
        location_line2: herdData.location_line2
      });
      
      setIsEditing({...isEditing, ranchName: false});
      fetchHerds(); // To update the dropdown
      fetchHerdDetails();
    } catch (error) {
      console.error('Error updating ranch name:', error);
      setError('Failed to update ranch name');
    }
  };

  const handleUpdateLocation = async () => {
    try {
      setError('');
      
      await axios.put(`/api/herds/${selectedHerd}`, {
        name: herdData.name,
        cow_count: herdData.cow_count,
        location_line1: locationLine1,
        location_line2: locationLine2
      });
      
      setIsEditing({...isEditing, location: false});
      fetchHerdDetails();
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location');
    }
  };

  // Prepare chart data for cows in production history
  const prepareChartData = () => {
    if (!herdData) return null;
    
    // In a real app, we'd fetch historical cow count data
    // For this demo, we'll use dummy data
    const dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    
    // Generate some sample data based on current cow count
    const cowCountHistory = [
      Math.round(herdData.cow_count * 0.9),
      Math.round(herdData.cow_count * 0.85),
      Math.round(herdData.cow_count * 0.88),
      Math.round(herdData.cow_count * 0.92),
      Math.round(herdData.cow_count * 0.95),
      Math.round(herdData.cow_count * 0.98),
      herdData.cow_count
    ];
    
    return {
      labels: dayLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Cows in Production',
          data: cowCountHistory,
          backgroundColor: 'rgba(184, 196, 211, 0.7)',
          barThickness: 20,
        },
        {
          type: 'line',
          label: 'Trend',
          data: cowCountHistory,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.3)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            size: 12,
          },
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="my-ranch-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (herds.length === 0) {
    return (
      <div className="my-ranch-container">
        <div className="empty-state">
          <p>You don't have any herds yet. Create your first herd to start tracking milk production.</p>
          <Link to="/herds/add" className="btn-primary">Add New Herd</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-ranch-container">
      <div className="header-controls">
        <div className="notification-icon">🔔</div>
        <div className="herd-selector">
          <select value={selectedHerd} onChange={handleHerdChange}>
            {herds.map(herd => (
              <option key={herd.id} value={herd.id}>{herd.name}</option>
            ))}
          </select>
        </div>
        <div className="profile-icon">👤</div>
      </div>
      
      <div className="section-header">
        <div className="icon">🐄</div>
        <span>Cows in production</span>
      </div>
      
      <div className="production-history">
        <div className="time-span-filter">
          <select value={timeSpan} onChange={handleTimeSpanChange}>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 365 days</option>
          </select>
        </div>
        
        <div className="chart-container">
          {chartData ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <div className="empty-chart">No data available for the selected time period</div>
          )}
        </div>
      </div>
      
      <div className="stats-card">
        <div className="icon-container">
          <div className="icon">🐄</div>
          <span>Cows in production</span>
        </div>
        <div className="stat-value">
          <span className="number">{herdData?.cow_count || 0}</span>
        </div>
      </div>
      
      <div className="cow-count-update">
        <h3>Update my cows in production</h3>
        <input
          type="number"
          value={cowCount}
          onChange={(e) => setCowCount(e.target.value)}
          placeholder="Number of cows"
        />
        <button className="btn-primary" onClick={handleUpdateCowCount}>
          Update my cows in production
        </button>
      </div>
      
      <div className="ranch-form">
        <div className="form-group">
          <label>Ranch Name</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              value={ranchName}
              onChange={(e) => setRanchName(e.target.value)}
              disabled={!isEditing.ranchName}
            />
            {!isEditing.ranchName ? (
              <span className="edit-icon" onClick={() => setIsEditing({...isEditing, ranchName: true})}>✏️</span>
            ) : (
              <span className="edit-icon" onClick={handleUpdateRanchName}>✓</span>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>Ranch Location</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              value={locationLine1}
              onChange={(e) => setLocationLine1(e.target.value)}
              placeholder="Address line 1"
              disabled={!isEditing.location}
            />
            {!isEditing.location ? (
              <span className="edit-icon" onClick={() => setIsEditing({...isEditing, location: true})}>✏️</span>
            ) : (
              <span className="edit-icon" onClick={handleUpdateLocation}>✓</span>
            )}
          </div>
          {isEditing.location && (
            <input 
              type="text" 
              value={locationLine2}
              onChange={(e) => setLocationLine2(e.target.value)}
              placeholder="Address line 2 (optional)"
            />
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="tab-navigation">
        <Link to="/dashboard" className="tab">
          <div className="icon">📊</div>
          <span>Milk Log</span>
        </Link>
        <Link to="/herds" className="tab active">
          <div className="icon">🐄</div>
          <span>My Ranch</span>
        </Link>
        <Link to="/profile" className="tab">
          <div className="icon">👤</div>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default RanchNew;
