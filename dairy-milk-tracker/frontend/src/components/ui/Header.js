import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Hamburger from './Hamburger';
import Sidebar from './Sidebar';
import { GridContainer, GridRow, GridCol } from './Grid';
import Logo from './Logo';

/**
 * Header Component
 * 
 * A responsive header with logo and hamburger menu that opens a sidebar on mobile.
 * 
 * Props:
 * - title: The title/brand to display
 * - navItems: Array of navigation items
 * - logoUrl: URL of the logo image
 * - className: Additional CSS classes
 */
const Header = ({
  title = 'Dairy Milk Tracker',
  navItems = [],
  logoUrl,
  className = '',
  ...restProps
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const headerClasses = [
    'app-header',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <header className={headerClasses} {...restProps}>
      <GridContainer>
        <GridRow alignItems="center">
          <GridCol xs={8} md={3}>
            <div className="header-brand">
              {/* Hamburger menu (mobile only) */}
              <div className="header-hamburger-wrapper">
                <Hamburger 
                  isOpen={sidebarOpen}
                  onClick={toggleSidebar}
                  className="header-hamburger"
                  size="medium"
                  color="inherit"
                />
              </div>
              
              {/* Logo or title */}
              <Link to="/" className="header-logo-link">
                <Logo 
                  variant="full" 
                  size="medium" 
                  color="light"
                />
              </Link>
            </div>
          </GridCol>
          
          <GridCol xs={4} md={9}>
            {/* Desktop navigation */}
            <nav className="header-nav">
              <ul className="header-nav-list">
                {navItems.map((item, index) => (
                  <li key={index} className="header-nav-item">
                    <Link 
                      to={item.path} 
                      className={`header-nav-link ${item.isActive ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </GridCol>
        </GridRow>
      </GridContainer>
      
      {/* Sidebar for mobile navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        title={title}
        items={navItems}
        position="left"
      />
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      isActive: PropTypes.bool
    })
  ),
  logoUrl: PropTypes.string,
  className: PropTypes.string
};

export default Header;
