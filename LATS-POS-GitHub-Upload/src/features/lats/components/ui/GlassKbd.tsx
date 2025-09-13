// GlassKbd component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';

interface GlassKbdProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'mono' | 'compact';
  className?: string;
}

const GlassKbd: React.FC<GlassKbdProps> = ({
  children,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-mono font-medium',
    'border border-lats-glass-border',
    'rounded-lats-radius-sm',
    'bg-lats-surface/50',
    'text-lats-text',
    'shadow-sm'
  ];

  // Size classes
  const sizeClasses = {
    xs: ['px-1 py-0.5 text-xs', 'min-h-5'],
    sm: ['px-1.5 py-1 text-xs', 'min-h-6'],
    md: ['px-2 py-1 text-sm', 'min-h-7'],
    lg: ['px-3 py-1.5 text-base', 'min-h-8']
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-lats-surface/50',
    mono: 'bg-lats-surface/80 font-mono',
    compact: 'bg-lats-surface/30 px-1.5 py-0.5'
  };

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <kbd className={combinedClasses}>
      {children}
    </kbd>
  );
};

// Export with display name for debugging
GlassKbd.displayName = 'GlassKbd';

export default GlassKbd;
