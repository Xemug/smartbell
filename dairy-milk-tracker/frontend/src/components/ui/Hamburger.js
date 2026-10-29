import React from 'react';
import PropTypes from 'prop-types';

/**
 * Hamburger Menu Icon Component
 * 
 * A toggleable hamburger menu icon that animates between hamburger and X states.
 * 
 * Props:
 * - isOpen: Whether the menu is open
 * - onClick: Function to call when the icon is clicked
 * - className: Additional CSS classes
 * - size: Size of the icon (small, medium, large)
 * - color: Color of the icon (inherit, primary, secondary)
 */
const Hamburger = ({ 
  isOpen = false, 
  onClick, 
  className = '',
  size = 'medium',
  color = 'inherit',
  ...restProps 
}) => {
  const hamburgerClasses = [
    'hamburger',
    isOpen ? 'hamburger-open' : '',
    `hamburger-${size}`,
    `hamburger-${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={hamburgerClasses}
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      type="button"
      {...restProps}
    >
      <span className="hamburger-box">
        <span className="hamburger-inner"></span>
      </span>
    </button>
  );
};

Hamburger.propTypes = {
  isOpen: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['inherit', 'primary', 'secondary'])
};

export default Hamburger;
