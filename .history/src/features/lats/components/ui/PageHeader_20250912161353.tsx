// PageHeader component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassButton from './GlassButton';

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  actions?: PageAction[];
  backButton?: {
    label?: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'elevated';
  className?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
  backButton,
  size = 'md',
  variant = 'default',
  className = '',
  children
}) => {
  // Base classes
  const baseClasses = [
    'flex flex-col sm:flex-row sm:items-center sm:justify-between',
    'gap-4 sm:gap-6',
    'transition-all duration-200'
  ];

  // Size classes
  const sizeClasses = {
    sm: ['py-4', 'max-w-6xl'],
    md: ['py-6', 'max-w-7xl'],
    lg: ['py-8', 'max-w-[90rem]']
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-surface/50 border-b border-lats-glass-border',
      'backdrop-blur-sm'
    ],
    minimal: [
      'bg-transparent'
    ],
    elevated: [
      'bg-lats-surface border border-lats-glass-border',
      'rounded-lats-radius-lg backdrop-blur-sm shadow-lats-glass-shadow'
    ]
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  // Text size classes
  const textSizeClasses = {
    sm: {
      title: 'text-lg font-semibold',
      subtitle: 'text-sm'
    },
    md: {
      title: 'text-xl font-semibold',
      subtitle: 'text-base'
    },
    lg: {
      title: 'text-2xl font-semibold',
      subtitle: 'text-lg'
    }
  };

  // Spacing classes
  const spacingClasses = {
    sm: {
      container: 'px-4',
      title: 'mb-1',
      subtitle: 'mb-4'
    },
    md: {
      container: 'px-6',
      title: 'mb-2',
      subtitle: 'mb-6'
    },
    lg: {
      container: 'px-8',
      title: 'mb-3',
      subtitle: 'mb-8'
    }
  };

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    spacingClasses[size].container,
    className
  ].filter(Boolean).join(' ');

  // Default back button icon
  const defaultBackIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  return (
    <header className={combinedClasses}>
      {/* Left section */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 mb-3" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <svg className="w-4 h-4 text-lats-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {crumb.href || crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="text-sm text-lats-text-secondary hover:text-lats-text transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-sm text-lats-text-secondary">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Back button */}
        {backButton && (
          <div className="mb-3">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={backButton.onClick}
              icon={backButton.icon || defaultBackIcon}
            >
              {backButton.label || 'Back'}
            </GlassButton>
          </div>
        )}

        {/* Title section */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`flex-shrink-0 ${iconSizeClasses[size]} text-lats-primary`}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className={`${textSizeClasses[size].title} ${spacingClasses[size].title} text-lats-text truncate`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`${textSizeClasses[size].subtitle} ${spacingClasses[size].subtitle} text-lats-text-secondary`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Custom content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>

      {/* Right section - Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          {actions.map((action, index) => (
            <GlassButton
              key={index}
              variant={action.variant || 'primary'}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={action.onClick}
              icon={action.icon}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </GlassButton>
          ))}
        </div>
      )}
    </header>
  );
};

// Export with display name for debugging
PageHeader.displayName = 'PageHeader';

export default PageHeader;
