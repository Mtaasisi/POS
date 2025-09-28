// GlassButton component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import { usePOSClickSounds } from '../../hooks/usePOSClickSounds';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  'aria-label'?: string;
  enableClickSound?: boolean;
  soundType?: 'click' | 'cart-add' | 'payment' | 'delete' | 'success' | 'error';
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'md',
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  title,
  'aria-label': ariaLabel,
  enableClickSound = true,
  soundType = 'click'
}) => {
  const { playSound } = usePOSClickSounds();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (enableClickSound) {
      playSound(soundType);
    }
    
    onClick?.(e);
  };
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95'
  ];

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-lats-primary hover:bg-lats-primary-hover',
      'text-white border border-lats-primary',
      'focus:ring-lats-primary/50'
    ],
    secondary: [
      'bg-lats-surface hover:bg-lats-surface-hover',
      'text-lats-text border border-lats-glass-border',
      'focus:ring-lats-primary/50'
    ],
    success: [
      'bg-lats-success hover:bg-lats-success/80',
      'text-white border border-lats-success',
      'focus:ring-lats-success/50'
    ],
    warning: [
      'bg-lats-warning hover:bg-lats-warning/80',
      'text-white border border-lats-warning',
      'focus:ring-lats-warning/50'
    ],
    error: [
      'bg-lats-error hover:bg-lats-error/80',
      'text-white border border-lats-error',
      'focus:ring-lats-error/50'
    ],
    danger: [
      'bg-lats-error hover:bg-lats-error/80',
      'text-white border border-lats-error',
      'focus:ring-lats-error/50'
    ],
    ghost: [
      'bg-transparent hover:bg-lats-surface/50',
      'text-lats-text border border-transparent',
      'focus:ring-lats-primary/50'
    ],
    outline: [
      'bg-transparent hover:bg-lats-surface/50',
      'text-lats-primary border border-lats-primary',
      'focus:ring-lats-primary/50'
    ]
  };

  // Size classes
  const sizeClasses = {
    xs: ['px-2 py-1 text-xs', 'min-h-6'],
    sm: ['px-3 py-1.5 text-sm', 'min-h-8'],
    md: ['px-4 py-2 text-sm', 'min-h-10'],
    lg: ['px-6 py-3 text-base', 'min-h-12'],
    xl: ['px-8 py-4 text-lg', 'min-h-14']
  };

  // Border radius classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-lats-radius-sm',
    md: 'rounded-lats-radius-md',
    lg: 'rounded-lats-radius-lg',
    full: 'rounded-full'
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Loading classes
  const loadingClasses = loading ? 'cursor-wait' : '';

  // Icon spacing classes
  const iconSpacingClasses = icon ? 'gap-2' : '';

  // Combine all classes
  const combinedClasses = [
    ...baseClasses,
    ...(variantClasses[variant] || variantClasses.primary), // Fallback to primary if variant not found
    ...(sizeClasses[size] || sizeClasses.md), // Fallback to md if size not found
    roundedClasses[rounded] || roundedClasses.md, // Fallback to md if rounded not found
    widthClasses,
    loadingClasses,
    iconSpacingClasses,
    className
  ].filter(Boolean).join(' ');


  // Render icon
  const renderIcon = () => {
    if (!icon) return null;
    
    const iconClasses = size === 'xs' || size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    return (
      <span className={`flex-shrink-0 ${iconClasses}`}>
        {icon}
      </span>
    );
  };

  // Render loading spinner
  const renderLoadingSpinner = () => {
    if (!loading) return null;
    
    const spinnerClasses = size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    
    return (
      <svg
        className={`animate-spin ${spinnerClasses} flex-shrink-0`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  };

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
    >
      {/* Loading spinner */}
      {loading && renderLoadingSpinner()}
      
      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && renderIcon()}
      
      {/* Content */}
      <span className="flex-shrink-0">
        {children}
      </span>
      
      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

// Export with display name for debugging
GlassButton.displayName = 'GlassButton';

export default GlassButton;
