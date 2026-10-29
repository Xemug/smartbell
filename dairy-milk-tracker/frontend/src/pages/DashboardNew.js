import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { applyAuthToken } from '../services/authService';
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
    // Check if user is authenticated before fetching data
    if (currentUser) {
      // Apply token before fetching data
      applyAuthToken();
      fetchInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedHerd && currentUser) {
      fetchStats();
      fetchMilkProductions();
    }
  }, [selectedHerd, timeSpan, currentUser]);

  // Track resize events to ensure token persistence during responsive testing
  useEffect(() => {
    // This is now handled by AuthProvider and MobileDetector
    // No need for additional token handling here
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Ensure token is set before making request
      applyAuthToken();
      
      // Fetch herds
      const herdsResponse = await api.get('/api/herds/');
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
      
      // Ensure token is set before making request
      applyAuthToken();
      
      const statsResponse = await api.get(`/api/milk-production/stats?herd_id=${selectedHerd}&time_span=${timeSpan}`);
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
      // Ensure token is set before making request
      applyAuthToken();
      
      const milkResponse = await api.get(`/api/milk-production/?herd_id=${selectedHerd}`);
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
      
      await api.post('/api/milk-production/', payload);
      
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
      <div className="milk-log-container">
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
    <div className="milk-log-container">
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
              <div className="icon">📈</div>
              <Typography variant="h5" component="span">Milk production</Typography>
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
                    <div className="icon">🥛</div>
                    <Typography variant="body2">Milk production</Typography>
                  </div>
                  <div className="stat-value">
                    <Typography variant="h3" className="number">{stats.litersPerCow.toFixed(1)}</Typography>
                    <Typography variant="caption" className="unit">lt/day per cow in average</Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
        
        <GridRow>
          <GridCol xs={12}>
            <Card title="Log your today's herd milk production" elevation={1}>
              <CardContent>
                <Form onSubmit={handleSubmitProduction}>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="1,000 liters produced today"
                    value={newProduction}
                    onChange={(e) => setNewProduction(e.target.value)}
                    required
                  />
                  <Button 
                    variant="primary" 
                    size="medium" 
                    fullWidth 
                    type="submit"
                  >
                    Log my today's production
                  </Button>
                </Form>
                {error && <Typography variant="caption" color="error" className="error-message">{error}</Typography>}
              </CardContent>
            </Card>
          </GridCol>
        </GridRow>
        
        <Spacer size="md" />
      </GridContainer>
    </div>
  );
};

export default DashboardNew;
