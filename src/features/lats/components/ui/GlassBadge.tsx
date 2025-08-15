// GlassBadge component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'md',
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
  className = '',
  title,
  'aria-label': ariaLabel
}) => {
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'whitespace-nowrap'
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-surface border border-lats-glass-border',
      'text-lats-text',
      'focus:ring-lats-primary/50'
    ],
    primary: [
      'bg-lats-primary/20 border border-lats-primary/30',
      'text-lats-primary',
      'focus:ring-lats-primary/50'
    ],
    success: [
      'bg-lats-success/20 border border-lats-success/30',
      'text-lats-success',
      'focus:ring-lats-success/50'
    ],
    warning: [
      'bg-lats-warning/20 border border-lats-warning/30',
      'text-lats-warning',
      'focus:ring-lats-warning/50'
    ],
    error: [
      'bg-lats-error/20 border border-lats-error/30',
      'text-lats-error',
      'focus:ring-lats-error/50'
    ],
    info: [
      'bg-lats-info/20 border border-lats-info/30',
      'text-lats-info',
      'focus:ring-lats-info/50'
    ],
    ghost: [
      'bg-transparent border border-transparent',
      'text-lats-text-secondary',
      'focus:ring-lats-primary/50'
    ]
  };

  // Size classes
  const sizeClasses = {
    xs: ['px-1.5 py-0.5 text-xs', 'min-h-5'],
    sm: ['px-2 py-1 text-xs', 'min-h-6'],
    md: ['px-2.5 py-1 text-sm', 'min-h-7'],
    lg: ['px-3 py-1.5 text-sm', 'min-h-8']
  };

  // Border radius classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-lats-radius-sm',
    md: 'rounded-lats-radius-md',
    lg: 'rounded-lats-radius-lg',
    full: 'rounded-full'
  };

  // Icon spacing classes
  const iconSpacingClasses = icon ? 'gap-1' : '';

  // Remove button spacing
  const removeSpacingClasses = removable ? 'pr-1' : '';

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    roundedClasses[rounded],
    iconSpacingClasses,
    removeSpacingClasses,
    className
  ].filter(Boolean).join(' ');

  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;
    
    const iconClasses = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    
    return (
      <span className={`flex-shrink-0 ${iconClasses}`}>
        {icon}
      </span>
    );
  };

  // Render remove button
  const renderRemoveButton = () => {
    if (!removable) return null;
    
    const buttonClasses = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    
    return (
      <button
        type="button"
        onClick={handleRemove}
        className={`${buttonClasses} flex-shrink-0 rounded-full hover:bg-current/20 transition-colors focus:outline-none focus:ring-2 focus:ring-current/50`}
        aria-label="Remove badge"
      >
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    );
  };

  return (
    <span
      className={combinedClasses}
      title={title}
      aria-label={ariaLabel}
    >
      {/* Left icon */}
      {icon && iconPosition === 'left' && renderIcon()}
      
      {/* Content */}
      <span className="flex-shrink-0">
        {children}
      </span>
      
      {/* Right icon */}
      {icon && iconPosition === 'right' && renderIcon()}
      
      {/* Remove button */}
      {renderRemoveButton()}
    </span>
  );
};

// Export with display name for debugging
GlassBadge.displayName = 'GlassBadge';

export default GlassBadge;
