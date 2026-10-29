import React from 'react';
import PropTypes from 'prop-types';

/**
 * Spacer Component
 * 
 * A utility component for adding consistent spacing between elements.
 * 
 * Props:
 * - size: The size of the spacer (xs, sm, md, lg, xl)
 * - axis: The axis to apply spacing (horizontal, vertical)
 * - className: Additional CSS classes
 */
const Spacer = ({ 
  size = 'md', 
  axis = 'vertical',
  className = '',
  ...restProps 
}) => {
  const spacerClasses = [
    'spacer',
    `spacer-${axis}`,
    `spacer-${size}`,
    className
  ].filter(Boolean).join(' ');

  return <div className={spacerClasses} {...restProps} />;
};

Spacer.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  axis: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
};

export default Spacer;
