import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Button Component
 * 
 * A consistent button component that can be rendered as either a button, 
 * a Link from react-router-dom, or an anchor tag.
 * 
 * Properties:
 * - variant: primary, secondary, outline, text
 * - size: small, medium, large
 * - fullWidth: true/false
 * - href: renders as an <a> tag with this href
 * - to: renders as a Link component from react-router-dom
 * - disabled: disables the button
 * - className: additional CSS classes
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false, 
  type = 'button', 
  href, 
  to, 
  disabled = false, 
  className = '', 
  onClick,
  ...restProps 
}) => {
  // Generate class names based on props
  const btnClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Common props for all button types
  const commonProps = {
    className: btnClasses,
    disabled: disabled,
    ...restProps
  };

  // If href is provided, render as anchor tag
  if (href) {
    return (
      <a 
        href={href} 
        {...commonProps}
        onClick={!disabled ? onClick : undefined}
      >
        {children}
      </a>
    );
  }
  
  // If to is provided, render as Link component
  if (to) {
    return (
      <Link 
        to={to} 
        {...commonProps}
        onClick={!disabled ? onClick : undefined}
      >
        {children}
      </Link>
    );
  }
  
  // Otherwise, render as a button element
  return (
    <button 
      type={type} 
      {...commonProps} 
      onClick={!disabled ? onClick : undefined}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  href: PropTypes.string,
  to: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Button;
