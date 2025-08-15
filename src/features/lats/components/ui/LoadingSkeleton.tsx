// LoadingSkeleton component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  height?: string | number;
  spacing?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

interface SkeletonCardProps {
  title?: boolean;
  description?: boolean;
  image?: boolean;
  actions?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

// Base Skeleton component
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse'
}) => {
  // Base classes
  const baseClasses = [
    'bg-lats-surface/30',
    'animate-pulse',
    'rounded-lats-radius-md'
  ];

  // Variant classes
  const variantClasses = {
    text: 'rounded-lats-radius-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lats-radius-lg'
  };

  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  };

  // Combine classes
  const combinedClasses = [
    ...baseClasses,
    variantClasses[variant],
    animationClasses[animation],
    className
  ].filter(Boolean).join(' ');

  // Inline styles
  const inlineStyles: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div
      className={combinedClasses}
      style={inlineStyles}
      aria-label="Loading..."
      role="status"
    />
  );
};

// Skeleton Text component
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  width = '100%',
  height = '1rem',
  spacing = '0.5rem',
  className = '',
  animation = 'pulse'
}) => {
  return (
    <div className={`space-y-${spacing} ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '75%' : width}
          height={height}
          animation={animation}
        />
      ))}
    </div>
  );
};

// Skeleton Card component
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  title = true,
  description = true,
  image = false,
  actions = 2,
  className = '',
  animation = 'pulse'
}) => {
  return (
    <div className={`bg-lats-surface border border-lats-glass-border rounded-lats-radius-lg p-4 space-y-4 ${className}`}>
      {/* Image */}
      {image && (
        <LoadingSkeleton
          variant="rectangular"
          width="100%"
          height="200px"
          animation={animation}
        />
      )}

      {/* Title */}
      {title && (
        <LoadingSkeleton
          variant="text"
          width="60%"
          height="1.5rem"
          animation={animation}
        />
      )}

      {/* Description */}
      {description && (
        <SkeletonText
          lines={2}
          width="100%"
          height="1rem"
          spacing="0.5rem"
          animation={animation}
        />
      )}

      {/* Actions */}
      {actions > 0 && (
        <div className="flex gap-2 pt-2">
          {Array.from({ length: actions }).map((_, index) => (
            <LoadingSkeleton
              key={index}
              variant="rounded"
              width="80px"
              height="2rem"
              animation={animation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton Table component
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}> = ({
  rows = 5,
  columns = 4,
  className = '',
  animation = 'pulse'
}) => {
  return (
    <div className={`bg-lats-surface border border-lats-glass-border rounded-lats-radius-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-lats-surface/50 border-b border-lats-glass-border p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <LoadingSkeleton
              key={index}
              variant="text"
              width={`${100 / columns}%`}
              height="1rem"
              animation={animation}
            />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-lats-glass-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <LoadingSkeleton
                  key={colIndex}
                  variant="text"
                  width={`${100 / columns}%`}
                  height="1rem"
                  animation={animation}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton List component
export const SkeletonList: React.FC<{
  items?: number;
  avatar?: boolean;
  title?: boolean;
  description?: boolean;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}> = ({
  items = 5,
  avatar = true,
  title = true,
  description = true,
  className = '',
  animation = 'pulse'
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-lats-surface border border-lats-glass-border rounded-lats-radius-md">
          {/* Avatar */}
          {avatar && (
            <LoadingSkeleton
              variant="circular"
              width="40px"
              height="40px"
              animation={animation}
            />
          )}

          {/* Content */}
          <div className="flex-1 space-y-2">
            {title && (
              <LoadingSkeleton
                variant="text"
                width="60%"
                height="1rem"
                animation={animation}
              />
            )}
            {description && (
              <LoadingSkeleton
                variant="text"
                width="100%"
                height="0.875rem"
                animation={animation}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton Grid component
export const SkeletonGrid: React.FC<{
  rows?: number;
  columns?: number;
  gap?: string;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}> = ({
  rows = 3,
  columns = 3,
  gap = '1rem',
  className = '',
  animation = 'pulse'
}) => {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {Array.from({ length: rows * columns }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          variant="rounded"
          width="100%"
          height="200px"
          animation={animation}
        />
      ))}
    </div>
  );
};

// Export with display name for debugging
LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;
