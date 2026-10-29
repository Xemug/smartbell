import React from 'react';
import PropTypes from 'prop-types';
import Typography from './Typography';

/**
 * Logo Component
 * 
 * A simple logo component for the Dairy Milk Tracker application.
 * Can be rendered as text or with an icon.
 * 
 * Props:
 * - size: Size of the logo (small, medium, large)
 * - variant: Variant of the logo (text, icon, full)
 * - color: Color scheme (light, dark, primary)
 * - className: Additional CSS classes
 */
const Logo = ({ 
  size = 'medium', 
  variant = 'full',
  color = 'primary',
  className = '',
  ...restProps 
}) => {
  const logoClasses = [
    'app-logo',
    `app-logo-${size}`,
    `app-logo-${variant}`,
    `app-logo-${color}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={logoClasses} {...restProps}>
      {/* Logo Icon */}
      {(variant === 'icon' || variant === 'full') && (
        <div className="app-logo-icon">
          <span role="img" aria-label="Milk bottle icon">🥛</span>
        </div>
      )}
      
      {/* Logo Text */}
      {(variant === 'text' || variant === 'full') && (
        <div className="app-logo-text">
          <Typography 
            variant={size === 'small' ? 'body1' : size === 'medium' ? 'h6' : 'h5'}
            component="span"
          >
            Dairy Milk Tracker
          </Typography>
        </div>
      )}
    </div>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['text', 'icon', 'full']),
  color: PropTypes.oneOf(['light', 'dark', 'primary']),
  className: PropTypes.string,
};

export default Logo;
