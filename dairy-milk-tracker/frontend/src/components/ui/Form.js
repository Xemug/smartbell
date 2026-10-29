import React from 'react';
import PropTypes from 'prop-types';

/**
 * Form Input Component
 * 
 * A standardized input component with consistent styling.
 */
export const Input = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  ...restProps
}) => {
  const inputId = id || name;
  const inputClasses = [
    'form-input',
    error ? 'form-input-error' : '',
    disabled ? 'form-input-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...restProps}
      />
      {error && <div className="form-error-message">{error}</div>}
    </div>
  );
};

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * Form Select Component
 * 
 * A standardized select component with consistent styling.
 */
export const Select = ({
  id,
  name,
  value,
  onChange,
  options,
  label,
  error,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  className = '',
  ...restProps
}) => {
  const selectId = id || name;
  const selectClasses = [
    'form-select',
    error ? 'form-select-error' : '',
    disabled ? 'form-select-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...restProps}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="form-error-message">{error}</div>}
    </div>
  );
};

Select.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

/**
 * Form Group Component
 * 
 * A container for form fields with consistent spacing.
 */
export const FormGroup = ({ 
  children, 
  className = '', 
  ...restProps 
}) => {
  return (
    <div className={`form-group ${className}`} {...restProps}>
      {children}
    </div>
  );
};

FormGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

/**
 * Form Component
 * 
 * A form container with consistent styling.
 */
export const Form = ({ 
  children, 
  onSubmit, 
  className = '', 
  ...restProps 
}) => {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`form ${className}`}
      {...restProps}
    >
      {children}
    </form>
  );
};

Form.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
};
