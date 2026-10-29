import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * TabNavigation Component
 * 
 * A mobile-friendly tab navigation component.
 * 
 * Props:
 * - tabs: Array of tab objects with { path, label, icon, isActive }
 * - position: Position of the tab navigation ('bottom', 'top')
 * - variant: Visual style ('filled', 'outlined', 'minimal')
 * - className: Additional CSS classes
 */
const TabNavigation = ({ 
  tabs, 
  position = 'bottom',
  variant = 'filled',
  className = '',
  ...restProps 
}) => {
  const navClasses = [
    'tab-navigation',
    `tab-navigation-${position}`,
    `tab-navigation-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={navClasses} {...restProps}>
      {tabs.map((tab) => (
        <TabItem 
          key={tab.path} 
          path={tab.path} 
          label={tab.label} 
          icon={tab.icon}
          isActive={tab.isActive}
        />
      ))}
    </nav>
  );
};

TabNavigation.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      isActive: PropTypes.bool,
    })
  ).isRequired,
  position: PropTypes.oneOf(['bottom', 'top']),
  variant: PropTypes.oneOf(['filled', 'outlined', 'minimal']),
  className: PropTypes.string,
};

/**
 * TabItem Component
 * 
 * An individual tab item with icon and label.
 */
const TabItem = ({ 
  path, 
  label, 
  icon, 
  isActive = false,
  ...restProps 
}) => {
  const tabClasses = [
    'tab',
    isActive ? 'active' : '',
  ].filter(Boolean).join(' ');

  return (
    <Link to={path} className={tabClasses} {...restProps}>
      <div className="tab-icon">{icon}</div>
      <span className="tab-label">{label}</span>
    </Link>
  );
};

TabItem.propTypes = {
  path: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
};

export default TabNavigation;
