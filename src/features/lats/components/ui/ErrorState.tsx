// ErrorState component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassButton from './GlassButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
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
  variant?: 'default' | 'minimal' | 'inline';
  showDetails?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  error,
  icon,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  showDetails = false,
  className = '',
  children
}) => {
  // Get error details
  const errorMessage = message || (error instanceof Error ? error.message : error) || 'An unexpected error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Base classes
  const baseClasses = [
    'flex flex-col items-center justify-center',
    'text-center',
    'transition-all duration-200'
  ];

  // Size classes
  const sizeClasses = {
    sm: ['py-6 px-4', 'max-w-sm'],
    md: ['py-8 px-6', 'max-w-md'],
    lg: ['py-12 px-8', 'max-w-lg']
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-error/10 border border-lats-error/20',
      'rounded-lats-radius-lg backdrop-blur-sm'
    ],
    minimal: [
      'bg-transparent'
    ],
    inline: [
      'bg-lats-error/5 border border-lats-error/10',
      'rounded-lats-radius-md'
    ]
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Text size classes
  const textSizeClasses = {
    sm: {
      title: 'text-base font-semibold',
      message: 'text-sm'
    },
    md: {
      title: 'text-lg font-semibold',
      message: 'text-base'
    },
    lg: {
      title: 'text-xl font-semibold',
      message: 'text-lg'
    }
  };

  // Spacing classes
  const spacingClasses = {
    sm: {
      icon: 'mb-3',
      title: 'mb-2',
      message: 'mb-4',
      actions: 'mt-4'
    },
    md: {
      icon: 'mb-4',
      title: 'mb-3',
      message: 'mb-6',
      actions: 'mt-6'
    },
    lg: {
      icon: 'mb-6',
      title: 'mb-4',
      message: 'mb-8',
      actions: 'mt-8'
    }
  };

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  // Default error icon
  const defaultIcon = (
    <svg
      className={`${iconSizeClasses[size]} text-lats-error`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );

  return (
    <div className={combinedClasses}>
      {/* Icon */}
      <div className={`${spacingClasses[size].icon} flex-shrink-0`}>
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className={`${textSizeClasses[size].title} ${spacingClasses[size].title} text-lats-error font-medium`}>
        {title}
      </h3>

      {/* Message */}
      <p className={`${textSizeClasses[size].message} ${spacingClasses[size].message} text-lats-text-secondary max-w-sm`}>
        {errorMessage}
      </p>

      {/* Error details */}
      {showDetails && errorStack && (
        <details className={`${spacingClasses[size].message} w-full text-left`}>
          <summary className="cursor-pointer text-sm text-lats-text-secondary hover:text-lats-text mb-2">
            Show error details
          </summary>
          <pre className="text-xs text-lats-text-secondary bg-lats-surface/50 p-3 rounded-lats-radius-md overflow-auto max-h-32">
            {errorStack}
          </pre>
        </details>
      )}

      {/* Custom content */}
      {children && (
        <div className={`${spacingClasses[size].message} w-full`}>
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
ErrorState.displayName = 'ErrorState';

export default ErrorState;
