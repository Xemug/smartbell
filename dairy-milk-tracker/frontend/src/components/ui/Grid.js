import React from 'react';
import PropTypes from 'prop-types';

/**
 * Grid Container Component
 * 
 * A responsive grid container that manages the layout of child elements.
 * It can be configured with different column layouts for different screen sizes.
 */
export const GridContainer = ({ 
  children, 
  fluid = false, 
  className = '', 
  ...restProps 
}) => {
  const containerClass = fluid ? 'grid-container-fluid' : 'grid-container';
  
  return (
    <div className={`${containerClass} ${className}`} {...restProps}>
      {children}
    </div>
  );
};

GridContainer.propTypes = {
  children: PropTypes.node,
  fluid: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Grid Row Component
 * 
 * A row component to contain grid columns.
 */
export const GridRow = ({ 
  children, 
  noGutters = false, 
  className = '', 
  alignItems = '', 
  justifyContent = '', 
  ...restProps 
}) => {
  const rowClasses = [
    'grid-row',
    noGutters ? 'no-gutters' : '',
    alignItems ? `align-items-${alignItems}` : '',
    justifyContent ? `justify-content-${justifyContent}` : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={rowClasses} {...restProps}>
      {children}
    </div>
  );
};

GridRow.propTypes = {
  children: PropTypes.node,
  noGutters: PropTypes.bool,
  className: PropTypes.string,
  alignItems: PropTypes.oneOf(['', 'start', 'center', 'end', 'stretch', 'baseline']),
  justifyContent: PropTypes.oneOf(['', 'start', 'center', 'end', 'between', 'around', 'evenly']),
};

/**
 * Grid Column Component
 * 
 * A column component with responsive configuration for different screen sizes.
 * xs, sm, md, lg, xl represent the number of columns to span at each screen size.
 * 
 * Example:
 * <GridCol xs={12} md={6} lg={4}> - Full width on mobile, half on medium, third on large screens
 */
export const GridCol = ({ 
  children, 
  xs, 
  sm, 
  md, 
  lg, 
  xl, 
  className = '', 
  ...restProps 
}) => {
  // Build column classes based on props
  const colClasses = ['grid-col'];
  
  // Add responsive classes
  if (xs !== undefined) colClasses.push(`col-xs-${xs}`);
  if (sm !== undefined) colClasses.push(`col-sm-${sm}`);
  if (md !== undefined) colClasses.push(`col-md-${md}`);
  if (lg !== undefined) colClasses.push(`col-lg-${lg}`);
  if (xl !== undefined) colClasses.push(`col-xl-${xl}`);
  
  // Add custom classes
  if (className) colClasses.push(className);
  
  return (
    <div className={colClasses.join(' ')} {...restProps}>
      {children}
    </div>
  );
};

GridCol.propTypes = {
  children: PropTypes.node,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  xl: PropTypes.number,
  className: PropTypes.string,
};
