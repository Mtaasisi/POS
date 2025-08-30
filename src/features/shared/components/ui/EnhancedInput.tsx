import React, { forwardRef } from 'react';
import { Search, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface EnhancedInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'outline';
  fullWidth?: boolean;
  label?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  autoComplete?: string;
  name?: string;
  id?: string;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  className = '',
  disabled = false,
  required = false,
  error,
  success = false,
  loading = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  label,
  helperText,
  showPasswordToggle = false,
  autoComplete,
  name,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-3 text-lg'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    glass: 'bg-white/60 backdrop-blur-sm border border-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
    outline: 'bg-transparent border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
  };

  const stateClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
    : success 
    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
    : '';

  const baseClasses = 'rounded-lg transition-all duration-200 placeholder-gray-400 focus:outline-none';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Search Icon for search type */}
        {type === 'search' && !icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoComplete={autoComplete}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${stateClasses}
            ${widthClass}
            ${disabledClass}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${type === 'search' && !icon ? 'pl-10' : ''}
            ${(icon && iconPosition === 'right') || showPasswordToggle || error || success ? 'pr-10' : ''}
          `}
          {...props}
        />

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          
          {!loading && success && (
            <CheckCircle size={16} className="text-green-500" />
          )}
          
          {!loading && error && (
            <AlertCircle size={16} className="text-red-500" />
          )}
          
          {!loading && showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          
          {!loading && icon && iconPosition === 'right' && (
            <span className="text-gray-400">{icon}</span>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput; 