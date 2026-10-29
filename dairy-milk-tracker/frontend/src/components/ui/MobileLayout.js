import React from 'react';
import PropTypes from 'prop-types';
import { GridContainer } from './Grid';
import { applyAuthToken } from '../../services/authService';

/**
 * MobileLayout Component
 * 
 * A layout component for mobile screens that provides consistent spacing
 * and padding for content, accounting for fixed headers and tab navigation.
 * 
 * Props:
 * - children: The content to display in the layout
 * - hasHeader: Whether the layout includes a fixed header
 * - hasTabNavigation: Whether the layout includes fixed tab navigation
 * - className: Additional CSS classes
 */
const MobileLayout = ({ 
  children, 
  hasHeader = true,
  hasTabNavigation = true,
  className = '',
  ...restProps 
}) => {
  // Ensure authentication token is applied on every render
  // This is a quick and lightweight operation
  applyAuthToken();
  
  // Apply appropriate padding based on fixed elements
  const layoutClasses = [
    'mobile-layout',
    hasHeader ? 'has-header' : '',
    hasTabNavigation ? 'has-tab-navigation' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={layoutClasses} {...restProps}>
      <div className="mobile-layout-content">
        <GridContainer>
          {children}
        </GridContainer>
      </div>
    </div>
  );
};

MobileLayout.propTypes = {
  children: PropTypes.node.isRequired,
  hasHeader: PropTypes.bool,
  hasTabNavigation: PropTypes.bool,
  className: PropTypes.string,
};

export default MobileLayout;
