import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header>
      <div className="container header-content">
        <div className="logo">
          <h1>Dairy Milk Tracker</h1>
        </div>
        
        {currentUser ? (
          <nav className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/herds">Herds</Link>
            <Link to="/milk-production">Milk Production</Link>
            <Link to="/profile">Profile</Link>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </nav>
        ) : (
          <nav className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
