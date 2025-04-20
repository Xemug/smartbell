import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const HerdDetail = () => {
  const [herd, setHerd] = useState(null);
  const [milkProductions, setMilkProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    const fetchHerdData = async () => {
      try {
        setLoading(true);
        
        // Fetch herd details
        const herdResponse = await axios.get(`/api/herds/${id}`);
        setHerd(herdResponse.data);
        
        // Fetch milk production data for this herd
        const milkResponse = await axios.get(`/api/milk-production/?herd_id=${id}`);
        setMilkProductions(milkResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching herd data', error);
        setError('Failed to load herd data');
        setLoading(false);
      }
    };
    
    fetchHerdData();
  }, [id]);

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

  const calculateStats = () => {
    if (milkProductions.length === 0) {
      return {
        totalLiters: 0,
        averagePerDay: 0,
        daysRecorded: 0
      };
    }
    
    const totalLiters = milkProductions.reduce((sum, record) => sum + record.amount_liters, 0);
    const daysRecorded = milkProductions.length;
    const averagePerDay = totalLiters / daysRecorded;
    
    return {
      totalLiters,
      averagePerDay,
      daysRecorded
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
  const stats = calculateStats();

  if (loading) {
    return (
      <div className="container">
        <h2>Loading herd details...</h2>
      </div>
    );
  }

  if (!herd) {
    return (
      <div className="container">
        <div className="alert alert-error">Herd not found</div>
        <Link to="/herds" className="btn-secondary">Back to Herds</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{herd.name}</h2>
        <div>
          <Link to={`/milk-production/add?herd_id=${herd.id}`} className="btn-primary" style={{ marginRight: '10px' }}>
            Add Milk Production
          </Link>
          <Link to="/herds" className="btn-secondary">
            Back to Herds
          </Link>
        </div>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Herd Details</h3>
        <p><strong>Number of Cows:</strong> {herd.cow_count}</p>
        <p><strong>Created:</strong> {new Date(herd.created_at).toLocaleDateString()}</p>
      </div>
      
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
          <h3>Average Per Cow</h3>
          <div className="stat-value">
            {herd.cow_count > 0 
              ? (stats.averagePerDay / herd.cow_count).toFixed(1) 
              : '0'} L
          </div>
        </div>
      </div>
      
      {chartData && (
        <div className="chart-container">
          <Line options={chartOptions} data={chartData} />
        </div>
      )}
      
      <h3>Milk Production Records</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount (L)</th>
              <th>Fat %</th>
              <th>Protein %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {milkProductions.map(record => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString()}</td>
                <td>{record.amount_liters.toFixed(1)}</td>
                <td>{record.fat_percentage ? record.fat_percentage.toFixed(1) : 'N/A'}</td>
                <td>{record.protein_percentage ? record.protein_percentage.toFixed(1) : 'N/A'}</td>
                <td>
                  <Link to={`/milk-production/edit/${record.id}`} className="btn-primary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {milkProductions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No milk production records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HerdDetail;
