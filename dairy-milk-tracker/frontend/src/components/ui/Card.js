import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card Component
 * 
 * A container component with a card-like appearance that can hold various content.
 * 
 * Props:
 * - title: Optional title displayed at the top of the card
 * - subtitle: Optional subtitle displayed below the title
 * - children: The content of the card
 * - elevation: The shadow depth of the card (0-3)
 * - variant: The style variant of the card (default, outlined)
 * - className: Additional CSS classes to apply
 */
const Card = ({ 
  title, 
  subtitle,
  children, 
  elevation = 1, 
  variant = 'default',
  className = '',
  ...restProps 
}) => {
  const cardClasses = [
    'card',
    variant === 'outlined' ? 'card-outlined' : '',
    variant === 'filled' ? 'card-filled' : '',
    `card-elevation-${elevation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...restProps}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node.isRequired,
  elevation: PropTypes.oneOf([0, 1, 2, 3]),
  variant: PropTypes.oneOf(['default', 'outlined', 'filled']),
  className: PropTypes.string,
};

/**
 * Card Content Component
 * 
 * A component for structuring content within a card.
 */
export const CardContent = ({ 
  children, 
  className = '',
  ...restProps 
}) => {
  return (
    <div className={`card-content ${className}`} {...restProps}>
      {children}
    </div>
  );
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

/**
 * Card Actions Component
 * 
 * A component for placing action buttons at the bottom of a card.
 */
export const CardActions = ({ 
  children, 
  alignment = 'right', 
  className = '',
  ...restProps 
}) => {
  const actionsClasses = [
    'card-actions',
    `card-actions-${alignment}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={actionsClasses} {...restProps}>
      {children}
    </div>
  );
};

CardActions.propTypes = {
  children: PropTypes.node.isRequired,
  alignment: PropTypes.oneOf(['left', 'center', 'right', 'between']),
  className: PropTypes.string,
};

/**
 * Card Media Component
 * 
 * A component for displaying media (like images) within a card.
 */
export const CardMedia = ({ 
  src, 
  alt = '',
  height,
  className = '',
  ...restProps 
}) => {
  const mediaStyle = height ? { height: `${height}px` } : {};

  return (
    <div 
      className={`card-media ${className}`} 
      style={mediaStyle}
      {...restProps}
    >
      <img src={src} alt={alt} className="card-media-image" />
    </div>
  );
};

CardMedia.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default Card;
