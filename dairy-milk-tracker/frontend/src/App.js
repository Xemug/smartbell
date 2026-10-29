import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './Mobile.css'; // New mobile-friendly styles

// UI Components
import { Header, MobileLayout } from './components/ui';

// Original Components
import Footer from './components/Footer';
import MobileDetector from './components/MobileDetector';
import AuthProvider from './components/AuthProvider';

// Original Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// New Mobile-Friendly Pages
import DashboardNew from './pages/DashboardNew';
import ProfileNew from './pages/ProfileNew';
import RanchNew from './pages/RanchNew';

// Herd Pages
import HerdsList from './pages/herds/HerdsList';
import AddHerd from './pages/herds/AddHerd';
import EditHerd from './pages/herds/EditHerd';
import HerdDetail from './pages/herds/HerdDetail';

// Milk Production Pages
import MilkProductionList from './pages/milk/MilkProductionList';
import AddMilkProduction from './pages/milk/AddMilkProduction';
import EditMilkProduction from './pages/milk/EditMilkProduction';

// Auth Context
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="container">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const location = useLocation();
  
  // Navigation configuration
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <div className="icon">📊</div>,
      isActive: location.pathname === '/dashboard'
    },
    { 
      path: '/herds', 
      label: 'My Ranch', 
      icon: <div className="icon">🐄</div>,
      isActive: location.pathname === '/herds' || location.pathname.startsWith('/herds/')
    },
    { 
      path: '/milk-production', 
      label: 'Milk Production', 
      icon: <div className="icon">🥛</div>,
      isActive: location.pathname === '/milk-production' || location.pathname.startsWith('/milk-production/')
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: <div className="icon">👤</div>,
      isActive: location.pathname === '/profile'
    }
  ];
  
  // Custom header for authenticated pages
  const AuthenticatedHeader = () => (
    <Header navItems={navItems} />
  );
  
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
        {/* Public Routes - Login/Register can be used for both desktop and mobile */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main routes with responsive design */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MobileDetector
                mobileComponent={
                  <>
                    <AuthenticatedHeader />
                    <MobileLayout>
                      <DashboardNew />
                    </MobileLayout>
                  </>
                }
              >
                <AuthenticatedHeader />
                <main>
                  <Dashboard />
                </main>
                <Footer />
              </MobileDetector>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MobileDetector
                mobileComponent={
                  <>
                    <AuthenticatedHeader />
                    <MobileLayout>
                      <ProfileNew />
                    </MobileLayout>
                  </>
                }
              >
                <AuthenticatedHeader />
                <main>
                  <Profile />
                </main>
                <Footer />
              </MobileDetector>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/herds" 
          element={
            <ProtectedRoute>
              <MobileDetector
                mobileComponent={
                  <>
                    <AuthenticatedHeader />
                    <MobileLayout>
                      <RanchNew />
                    </MobileLayout>
                  </>
                }
              >
                <AuthenticatedHeader />
                <main>
                  <HerdsList />
                </main>
                <Footer />
              </MobileDetector>
            </ProtectedRoute>
          } 
        />
        
        {/* Other Protected Routes */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <Onboarding />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/herds/add" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <AddHerd />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/herds/edit/:id" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <EditHerd />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/herds/:id" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <HerdDetail />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/milk-production" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <MilkProductionList />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/milk-production/add" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <AddMilkProduction />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/milk-production/edit/:id" 
          element={
            <ProtectedRoute>
              <AuthenticatedHeader />
              <main>
                <EditMilkProduction />
              </main>
              <Footer />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
      </div>
      </AuthProvider>
  );
}

export default App;
