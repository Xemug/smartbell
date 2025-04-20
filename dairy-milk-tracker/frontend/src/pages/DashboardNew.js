import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DashboardNew = () => {
  const { currentUser } = useAuth();
  const [selectedHerd, setSelectedHerd] = useState('');
  const [herds, setHerds] = useState([]);
  const [milkProductions, setMilkProductions] = useState([]);
  const [stats, setStats] = useState({
    totalLiters: 0,
    averagePerDay: 0,
    daysRecorded: 0,
    litersPerCow: 0
  });
  const [timeSpan, setTimeSpan] = useState('week');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState({
    stats: false,
    productions: false
  });
  const [error, setError] = useState('');
  const [newProduction, setNewProduction] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedHerd) {
      fetchStats();
      fetchMilkProductions();
    }
  }, [selectedHerd, timeSpan]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch herds
      const herdsResponse = await axios.get('/api/herds/');
      setHerds(herdsResponse.data);
      
      if (herdsResponse.data.length > 0) {
        setSelectedHerd(herdsResponse.data[0].id.toString());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setDataLoading(prev => ({ ...prev, stats: true }));
      setError('');
      
      const statsResponse = await axios.get(`/api/milk-production/stats?herd_id=${selectedHerd}&time_span=${timeSpan}`);
      setStats({
        totalLiters: statsResponse.data.total_liters,
        averagePerDay: statsResponse.data.average_per_day,
        daysRecorded: statsResponse.data.days_recorded,
        litersPerCow: statsResponse.data.liters_per_cow
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setDataLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchMilkProductions = async () => {
    try {
      const milkResponse = await axios.get(`/api/milk-production/?herd_id=${selectedHerd}`);
      setMilkProductions(milkResponse.data);
    } catch (error) {
      console.error('Error fetching milk production data:', error);
      setError('Failed to load milk production data');
    }
  };

  const handleSubmitProduction = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!newProduction || newProduction.trim() === '') {
      setError('Please enter a milk production amount');
      return;
    }
    
    const productionValue = parseFloat(newProduction);
    
    if (isNaN(productionValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (productionValue <= 0) {
      setError('Production amount must be greater than zero');
      return;
    }
    
    if (productionValue > 100000) {
      setError('Production amount seems too high. Please check your input');
      return;
    }
    
    try {
      setError('');
      const payload = {
        herd_id: parseInt(selectedHerd),
        date: new Date().toISOString(),
        amount_liters: productionValue,
      };
      
      await axios.post('/api/milk-production/', payload);
      
      // Refresh data
      fetchStats();
      fetchMilkProductions();
      setNewProduction('');
    } catch (error) {
      console.error('Error adding milk production:', error);
      let errorMessage = 'Failed to add milk production';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || 
          `Server error (${error.response.status}): Unable to add milk production record`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setError(errorMessage);
    }
  };

  const handleHerdChange = (e) => {
    setSelectedHerd(e.target.value);
  };

  const handleTimeSpanChange = (e) => {
    setTimeSpan(e.target.value);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (milkProductions.length === 0) return null;
    
    // Sort by date
    const sortedProductions = [...milkProductions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Get the last 7 or relevant number of entries
    let filteredProductions = sortedProductions;
    if (timeSpan === 'week') {
      filteredProductions = sortedProductions.slice(-7);
    } else if (timeSpan === 'month') {
      filteredProductions = sortedProductions.slice(-30);
    }
    
    // Use Spanish day abbreviations
    const dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    
    // Extract dates and amounts
    const labels = filteredProductions.map(item => {
      const date = new Date(item.date);
      return dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
    });
    
    const data = filteredProductions.map(item => item.amount_liters);
    
    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Milk Production (Liters)',
          data,
          backgroundColor: 'rgba(184, 196, 211, 0.7)',
          barThickness: 20,
        },
        {
          type: 'line',
          label: 'Trend',
          data,
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
  const selectedHerdData = herds.find(h => h.id.toString() === selectedHerd);

  if (loading) {
    return (
      <div className="milk-log-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (herds.length === 0) {
    return (
      <div className="milk-log-container">
        <div className="empty-state">
          <p>You don't have any herds yet. Create your first herd to start tracking milk production.</p>
          <Link to="/herds/add" className="btn-primary">Add New Herd</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="milk-log-container">
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
        <div className="icon">📈</div>
        <span>Milk production</span>
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
          <div className="icon">🥛</div>
          <span>Milk production</span>
        </div>
        <div className="stat-value">
          <span className="number">{stats.litersPerCow.toFixed(1)}</span>
          <span className="unit">lt/day per cow in average</span>
        </div>
      </div>
      
      <div className="add-production">
        <h3>Log your today's herd milk production</h3>
        <form onSubmit={handleSubmitProduction}>
          <input
            type="number"
            step="0.1"
            placeholder="1,000 liters produced today"
            value={newProduction}
            onChange={(e) => setNewProduction(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Log my today's production</button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <div className="tab-navigation">
        <Link to="/dashboard" className="tab active">
          <div className="icon">📊</div>
          <span>Milk Log</span>
        </Link>
        <Link to="/herds" className="tab">
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

export default DashboardNew;
