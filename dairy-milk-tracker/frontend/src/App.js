import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './Mobile.css'; // New mobile-friendly styles

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import MobileDetector from './components/MobileDetector';

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
  return (
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
                mobileComponent={<DashboardNew />}
              >
                <Header />
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
                mobileComponent={<ProfileNew />}
              >
                <Header />
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
                mobileComponent={<RanchNew />}
              >
                <Header />
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
              <Header />
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
              <Header />
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
              <Header />
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
              <Header />
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
              <Header />
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
              <Header />
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
              <Header />
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
  );
}

export default App;
