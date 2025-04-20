import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLiters: 0,
    averagePerDay: 0,
    daysRecorded: 0
  });
  const [herds, setHerds] = useState([]);
  const [milkProductions, setMilkProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await axios.get('/api/milk-production/stats');
        setStats({
          totalLiters: statsResponse.data.total_liters,
          averagePerDay: statsResponse.data.average_per_day,
          daysRecorded: statsResponse.data.days_recorded
        });
        
        // Fetch herds
        const herdsResponse = await axios.get('/api/herds/');
        setHerds(herdsResponse.data);
        
        // Fetch milk production data
        const milkResponse = await axios.get('/api/milk-production/');
        setMilkProductions(milkResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    if (milkProductions.length === 0) return null;
    
    // Sort by date
    const sortedProductions = [...milkProductions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Extract dates and amounts
    const labels = sortedProductions.map(item => 
      new Date(item.date).toLocaleDateString()
    );
    
    const data = sortedProductions.map(item => item.amount_liters);
    
    return {
      labels,
      datasets: [
        {
          label: 'Milk Production (Liters)',
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Milk Production Over Time',
      },
    },
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="container">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Dashboard</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="dashboard">
        <div className="stat-card">
          <h3>Total Milk Production</h3>
          <div className="stat-value">{stats.totalLiters.toFixed(1)} L</div>
        </div>
        
        <div className="stat-card">
          <h3>Average Per Day</h3>
          <div className="stat-value">{stats.averagePerDay.toFixed(1)} L</div>
        </div>
        
        <div className="stat-card">
          <h3>Days Recorded</h3>
          <div className="stat-value">{stats.daysRecorded}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Herds</h3>
          <div className="stat-value">{herds.length}</div>
        </div>
      </div>
      
      {chartData && (
        <div className="chart-container">
          <Line options={chartOptions} data={chartData} />
        </div>
      )}
      
      <h3>Recent Milk Production</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Herd</th>
              <th>Amount (L)</th>
              <th>Fat %</th>
              <th>Protein %</th>
            </tr>
          </thead>
          <tbody>
            {milkProductions.slice(0, 5).map(record => {
              const herd = herds.find(h => h.id === record.herd_id);
              return (
                <tr key={record.id}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{herd ? herd.name : 'Unknown'}</td>
                  <td>{record.amount_liters.toFixed(1)}</td>
                  <td>{record.fat_percentage ? record.fat_percentage.toFixed(1) : 'N/A'}</td>
                  <td>{record.protein_percentage ? record.protein_percentage.toFixed(1) : 'N/A'}</td>
                </tr>
              );
            })}
            {milkProductions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No milk production records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <Link to="/milk-production/add" className="btn-primary" style={{ display: 'inline-block', marginRight: '10px' }}>
          Add Milk Production
        </Link>
        <Link to="/herds/add" className="btn-secondary" style={{ display: 'inline-block' }}>
          Add New Herd
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
