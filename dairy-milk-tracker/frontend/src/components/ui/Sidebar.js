import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Typography from './Typography';

/**
 * Sidebar Component
 * 
 * A sliding sidebar for navigation on mobile devices.
 * 
 * Props:
 * - isOpen: Whether the sidebar is open
 * - onClose: Function to call when the sidebar should close
 * - title: Title to display at the top of the sidebar
 * - items: Array of navigation items
 * - position: Position of the sidebar (left, right)
 * - className: Additional CSS classes
 */
const Sidebar = ({ 
  isOpen = false, 
  onClose, 
  title = 'Menu',
  items = [],
  position = 'left',
  className = '',
  ...restProps 
}) => {
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const sidebarClasses = [
    'sidebar',
    isOpen ? 'sidebar-open' : '',
    `sidebar-${position}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose}
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={sidebarClasses}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        {...restProps}
      >
        <div className="sidebar-header">
          <Typography variant="h5">{title}</Typography>
          <button 
            className="sidebar-close" 
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            &times;
          </button>
        </div>
        
        <nav className="sidebar-content">
          <ul className="sidebar-nav">
            {items.map((item, index) => (
              <li key={index} className="sidebar-nav-item">
                <Link 
                  to={item.path} 
                  className={item.isActive ? 'active' : ''}
                  onClick={onClose}
                >
                  {item.icon && <span className="sidebar-nav-icon">{item.icon}</span>}
                  <Typography variant="body1">{item.label}</Typography>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      isActive: PropTypes.bool
    })
  ),
  position: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string
};

export default Sidebar;
