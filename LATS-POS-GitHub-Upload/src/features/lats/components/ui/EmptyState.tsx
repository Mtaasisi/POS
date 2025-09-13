// EmptyState component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassButton from './GlassButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
    icon?: React.ReactNode;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
    icon?: React.ReactNode;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'illustrated';
  className?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  className = '',
  children
}) => {
  // Base classes
  const baseClasses = [
    'flex flex-col items-center justify-center',
    'text-center',
    'transition-all duration-200'
  ];

  // Size classes
  const sizeClasses = {
    sm: ['py-8 px-4', 'max-w-sm'],
    md: ['py-12 px-6', 'max-w-md'],
    lg: ['py-16 px-8', 'max-w-lg']
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-surface border border-lats-glass-border',
      'rounded-lats-radius-lg backdrop-blur-sm shadow-lats-glass-shadow'
    ],
    minimal: [
      'bg-transparent'
    ],
    illustrated: [
      'bg-lats-surface/50 border border-lats-glass-border/50',
      'rounded-lats-radius-xl backdrop-blur-sm shadow-lats-glass-shadow'
    ]
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  // Text size classes
  const textSizeClasses = {
    sm: {
      title: 'text-lg font-semibold',
      description: 'text-sm'
    },
    md: {
      title: 'text-xl font-semibold',
      description: 'text-base'
    },
    lg: {
      title: 'text-2xl font-semibold',
      description: 'text-lg'
    }
  };

  // Spacing classes
  const spacingClasses = {
    sm: {
      icon: 'mb-4',
      title: 'mb-2',
      description: 'mb-6',
      actions: 'mt-6'
    },
    md: {
      icon: 'mb-6',
      title: 'mb-3',
      description: 'mb-8',
      actions: 'mt-8'
    },
    lg: {
      icon: 'mb-8',
      title: 'mb-4',
      description: 'mb-10',
      actions: 'mt-10'
    }
  };

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  // Default icon if none provided
  const defaultIcon = (
    <svg
      className={`${iconSizeClasses[size]} text-lats-text-secondary`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className={combinedClasses}>
      {/* Icon */}
      {(icon || variant === 'illustrated') && (
        <div className={`${spacingClasses[size].icon} flex-shrink-0`}>
          {icon || defaultIcon}
        </div>
      )}

      {/* Title */}
      <h3 className={`${textSizeClasses[size].title} ${spacingClasses[size].title} text-lats-text font-medium`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`${textSizeClasses[size].description} ${spacingClasses[size].description} text-lats-text-secondary max-w-sm`}>
          {description}
        </p>
      )}

      {/* Custom content */}
      {children && (
        <div className={`${spacingClasses[size].description} w-full`}>
          {children}
        </div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={`${spacingClasses[size].actions} flex flex-col sm:flex-row gap-3 w-full sm:w-auto`}>
          {action && (
            <GlassButton
              variant={action.variant || 'primary'}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={action.onClick}
              icon={action.icon}
              loading={action.loading}
              fullWidth={size === 'sm'}
            >
              {action.label}
            </GlassButton>
          )}

          {secondaryAction && (
            <GlassButton
              variant={secondaryAction.variant || 'secondary'}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={secondaryAction.onClick}
              icon={secondaryAction.icon}
              fullWidth={size === 'sm'}
            >
              {secondaryAction.label}
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
};

// Export with display name for debugging
EmptyState.displayName = 'EmptyState';

export default EmptyState;
