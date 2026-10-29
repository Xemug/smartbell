import React from 'react';
import PropTypes from 'prop-types';

/**
 * Typography Component
 * 
 * A component for consistent text styling across the application.
 * 
 * Props:
 * - variant: The typography style to use (h1-h6, subtitle1, subtitle2, body1, body2, caption, overline)
 * - component: The HTML element to render as (h1-h6, p, span, div)
 * - align: Text alignment (left, center, right, justify)
 * - color: Text color (primary, secondary, success, error, info, warning)
 * - gutterBottom: Whether to add bottom margin
 * - noWrap: Whether to prevent text wrapping
 * - className: Additional CSS classes
 */
const Typography = ({ 
  variant = 'body1',
  component,
  align = 'inherit',
  color = 'default',
  gutterBottom = false,
  noWrap = false,
  className = '',
  children,
  ...restProps 
}) => {
  // Determine HTML element to render
  const Component = component || getDefaultComponent(variant);
  
  // Build class names based on props
  const typographyClasses = [
    'typography',
    `typography-${variant}`,
    align !== 'inherit' ? `typography-align-${align}` : '',
    color !== 'default' ? `typography-color-${color}` : '',
    gutterBottom ? 'typography-gutter-bottom' : '',
    noWrap ? 'typography-no-wrap' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={typographyClasses} {...restProps}>
      {children}
    </Component>
  );
};

// Determine default component based on variant
const getDefaultComponent = (variant) => {
  switch (variant) {
    case 'h1': return 'h1';
    case 'h2': return 'h2';
    case 'h3': return 'h3';
    case 'h4': return 'h4';
    case 'h5': return 'h5';
    case 'h6': return 'h6';
    case 'subtitle1': return 'h6';
    case 'subtitle2': return 'h6';
    case 'body1': return 'p';
    case 'body2': return 'p';
    case 'caption': return 'span';
    case 'overline': return 'span';
    default: return 'p';
  }
};

Typography.propTypes = {
  variant: PropTypes.oneOf([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'subtitle1', 'subtitle2', 
    'body1', 'body2', 
    'caption', 'overline'
  ]),
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.elementType
  ]),
  align: PropTypes.oneOf(['inherit', 'left', 'center', 'right', 'justify']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'error', 'info', 'warning']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Typography;
