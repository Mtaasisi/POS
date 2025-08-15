// GlassCard component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'none' | 'default' | 'accent' | 'error' | 'warning' | 'success';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  minHeight?: string;
  maxHeight?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  shadow = 'md',
  border = 'default',
  hover = false,
  clickable = false,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  fullHeight = false,
  minHeight,
  maxHeight,
  overflow = 'visible'
}) => {
  // Base classes
  const baseClasses = [
    'transition-all duration-200 ease-in-out',
    'backdrop-blur-sm',
    'relative'
  ];

  // Variant classes
  const variantClasses = {
    default: 'bg-lats-surface border-lats-glass-border',
    elevated: 'bg-lats-surface/80 border-lats-glass-border/50 shadow-lats-glass-shadow',
    subtle: 'bg-lats-surface/60 border-lats-glass-border/30',
    transparent: 'bg-transparent border-lats-glass-border/20'
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Border radius classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-lats-radius-sm',
    md: 'rounded-lats-radius-md',
    lg: 'rounded-lats-radius-lg',
    xl: 'rounded-lats-radius-xl',
    full: 'rounded-full'
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lats-glass-shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  // Border classes
  const borderClasses = {
    none: 'border-0',
    default: 'border border-lats-glass-border',
    accent: 'border border-lats-primary/50',
    error: 'border border-lats-error/50',
    warning: 'border border-lats-warning/50',
    success: 'border border-lats-success/50'
  };

  // Hover classes
  const hoverClasses = hover ? 'hover:bg-lats-surface-hover hover:border-lats-glass-border/30 hover:shadow-lg' : '';

  // Clickable classes
  const clickableClasses = clickable ? 'cursor-pointer active:scale-95' : '';

  // Disabled classes
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  // Loading classes
  const loadingClasses = loading ? 'animate-pulse' : '';

  // Width and height classes
  const widthClasses = fullWidth ? 'w-full' : '';
  const heightClasses = fullHeight ? 'h-full' : '';

  // Overflow classes
  const overflowClasses = {
    visible: 'overflow-visible',
    hidden: 'overflow-hidden',
    scroll: 'overflow-scroll',
    auto: 'overflow-auto'
  };

  // Combine all classes
  const combinedClasses = [
    ...baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    roundedClasses[rounded],
    shadowClasses[shadow],
    borderClasses[border],
    hoverClasses,
    clickableClasses,
    disabledClasses,
    loadingClasses,
    widthClasses,
    heightClasses,
    overflowClasses[overflow],
    className
  ].filter(Boolean).join(' ');

  // Inline styles for custom dimensions
  const inlineStyles: React.CSSProperties = {
    minHeight,
    maxHeight
  };

  // Handle click
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={combinedClasses}
      style={inlineStyles}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-lats-surface/50 backdrop-blur-sm rounded-lats-radius-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lats-primary"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>

      {/* Focus ring for accessibility */}
      {clickable && (
        <div className="absolute inset-0 rounded-lats-radius-lg ring-2 ring-lats-primary/0 focus-within:ring-lats-primary/50 transition-all duration-200 pointer-events-none" />
      )}
    </div>
  );
};

// Export with display name for debugging
GlassCard.displayName = 'GlassCard';

export default GlassCard;
