// GlassInput component for LATS module
import React, { forwardRef } from 'react';
import { LATS_CLASSES } from '../../tokens';

interface GlassInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  name?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onEnter?: (value: string) => void;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  label,
  helperText,
  error,
  disabled = false,
  loading = false,
  required = false,
  readOnly = false,
  autoFocus = false,
  autoComplete,
  name,
  id,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  min,
  max,
  step,
  pattern,
  maxLength,
  minLength,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onEnter
}, ref) => {
  // Base classes
  const baseClasses = [
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'readonly:bg-lats-surface/30'
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-surface border border-lats-glass-border',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:border-lats-glass-border/50'
    ],
    filled: [
      'bg-lats-surface/80 border border-lats-glass-border/50',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:bg-lats-surface'
    ],
    outline: [
      'bg-transparent border border-lats-glass-border',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:border-lats-glass-border/70'
    ]
  };

  // Size classes
  const sizeClasses = {
    sm: ['px-3 py-1.5 text-sm', 'min-h-8'],
    md: ['px-4 py-3 text-sm', 'min-h-10'],
    lg: ['px-4 py-3 text-base', 'min-h-12']
  };

  // Border radius classes
  const roundedClasses = 'rounded-lats-radius-md';

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Error classes
  const errorClasses = error ? [
    'border-lats-error focus:border-lats-error focus:ring-lats-error/50'
  ] : [];

  // Icon spacing classes
  const hasLeftIcon = leftIcon ? 'pl-10' : '';
  const hasRightIcon = rightIcon ? 'pr-10' : '';

  // Combine input classes
  const inputClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    roundedClasses,
    widthClasses,
    ...errorClasses,
    hasLeftIcon,
    hasRightIcon,
    'text-lats-text placeholder-lats-text-secondary',
    className
  ].filter(Boolean).join(' ');

  // Handle change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value, event);
    }
  };

  // Handle key down
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(event);
    }
    
    if (onEnter && event.key === 'Enter') {
      onEnter(event.currentTarget.value);
    }
  };

  // Generate unique ID if not provided
  const inputId = id || name || `lats-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-lats-text ${
            error ? 'text-lats-error' : ''
          }`}
        >
          {label}
          {required && <span className="text-lats-error ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lats-text-secondary pointer-events-none">
            <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>
              {leftIcon}
            </div>
          </div>
        )}

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lats-text-secondary pointer-events-none">
            <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>
              {rightIcon}
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className={`animate-spin rounded-full border-b-2 border-lats-primary ${
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
          </div>
        )}

        {/* Input element */}
        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          readOnly={readOnly}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          maxLength={maxLength}
          minLength={minLength}
          className={inputClasses}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={onKeyUp}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        />
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-xs text-lats-text-secondary">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-lats-error">
          {error}
        </p>
      )}
    </div>
  );
});

// Export with display name for debugging
GlassInput.displayName = 'GlassInput';

export default GlassInput;
