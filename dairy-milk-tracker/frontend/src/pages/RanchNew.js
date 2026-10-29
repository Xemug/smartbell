import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, 
  GridContainer, 
  GridRow, 
  GridCol, 
  Input, 
  Select, 
  Form, 
  Card, 
  CardContent, 
  TabNavigation,
  Typography,
  Spacer 
} from '../components/ui';

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
    if (currentUser) {
      fetchHerds();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedHerd && currentUser) {
      fetchHerdDetails();
    }
  }, [selectedHerd, currentUser]);

  const fetchHerds = async () => {
    try {
      setLoading(true);
      
      // Ensure token is applied before request
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await api.get('/api/herds/');
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
      // Ensure token is applied before request
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await api.get(`/api/herds/${selectedHerd}`);
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
      
      await api.put(`/api/herds/${selectedHerd}`, {
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
      
      await api.put(`/api/herds/${selectedHerd}`, {
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
      
      await api.put(`/api/herds/${selectedHerd}`, {
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
        <GridContainer>
          <GridRow>
            <GridCol xs={12}>
              <div className="loading">
                <Typography variant="h5" align="center" color="secondary">
                  Loading...
                </Typography>
              </div>
            </GridCol>
          </GridRow>
        </GridContainer>
      </div>
    );
  }

  if (herds.length === 0) {
    return (
      <div className="my-ranch-container">
        <GridContainer>
          <GridRow>
            <GridCol xs={12}>
              <div className="empty-state">
                <Typography variant="body1" align="center" gutterBottom>
                  You don't have any herds yet. Create your first herd to start tracking milk production.
                </Typography>
                <Button 
                  variant="primary" 
                  size="medium" 
                  to="/herds/add"
                >
                  Add New Herd
                </Button>
              </div>
            </GridCol>
          </GridRow>
        </GridContainer>
      </div>
    );
  }

  return (
    <div className="my-ranch-container">
      <GridContainer>
        <GridRow>
          <GridCol xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Select
                  value={selectedHerd}
                  onChange={handleHerdChange}
                  options={herds.map(herd => ({
                    value: herd.id,
                    label: herd.name
                  }))}
                />
              </CardContent>
            </Card>
            <Spacer size="md" />
          </GridCol>
        </GridRow>
        
        <GridRow>
          <GridCol xs={12}>
            <div className="section-header">
              <div className="icon">🐄</div>
              <Typography variant="h5" component="span">Cows in production</Typography>
            </div>
          </GridCol>
        </GridRow>
        
        <Spacer size="sm" />
        
        <GridRow>
          <GridCol xs={12}>
            <div className="production-history">
              <div className="time-span-filter">
                <Select
                  value={timeSpan}
                  onChange={handleTimeSpanChange}
                  options={[
                    { value: 'week', label: 'Last 7 days' },
                    { value: 'month', label: 'Last 30 days' },
                    { value: 'year', label: 'Last 365 days' }
                  ]}
                />
              </div>
              
              <Spacer size="sm" />
              
              <Card elevation={1}>
                <CardContent>
                  {chartData ? (
                    <Bar options={chartOptions} data={chartData} />
                  ) : (
                    <div className="empty-chart">
                      <Typography variant="body2" align="center" color="secondary">
                        No data available for the selected time period
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card elevation={1}>
              <CardContent>
                <div className="stats-card">
                  <div className="icon-container">
                    <div className="icon">🐄</div>
                    <Typography variant="body2">Cows in production</Typography>
                  </div>
                  <div className="stat-value">
                    <Typography variant="h3" className="number">{herdData?.cow_count || 0}</Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card title="Update my cows in production" elevation={1}>
              <CardContent>
                <Form>
                  <Input
                    type="number"
                    value={cowCount}
                    onChange={(e) => setCowCount(e.target.value)}
                    placeholder="Number of cows"
                  />
                  <Button 
                    variant="primary" 
                    size="medium" 
                    fullWidth
                    onClick={handleUpdateCowCount}
                  >
                    Update my cows in production
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card elevation={1}>
              <CardContent>
                <div className="ranch-form">
                  <div className="form-group">
                    <Typography variant="subtitle2" component="label">Ranch Name</Typography>
                    <div className="input-wrapper">
                      <Input 
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
                  
                  <Spacer size="sm" />
                  
                  <div className="form-group">
                    <Typography variant="subtitle2" component="label">Ranch Location</Typography>
                    <div className="input-wrapper">
                      <Input 
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
                      <div>
                        <Spacer size="xs" />
                        <Input 
                          type="text" 
                          value={locationLine2}
                          onChange={(e) => setLocationLine2(e.target.value)}
                          placeholder="Address line 2 (optional)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        {error && (
          <GridRow>
            <GridCol xs={12}>
              <Spacer size="sm" />
              <Typography variant="caption" color="error" className="error-message">{error}</Typography>
            </GridCol>
          </GridRow>
        )}
        
        <Spacer size="md" />
      </GridContainer>
    </div>
  );
};

export default RanchNew;
