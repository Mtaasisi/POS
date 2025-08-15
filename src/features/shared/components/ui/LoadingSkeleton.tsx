import React from 'react';
import { cn } from '../../../../lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = cn(
    'bg-gray-200 rounded',
    {
      'rounded-full': variant === 'circular',
      'rounded-lg': variant === 'rounded',
      'rounded-md': variant === 'rectangular',
      'rounded': variant === 'text',
      'animate-pulse': animation === 'pulse' || animation === 'wave', // You can customize this for wave animation
    },
    className
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div className={baseClasses} style={style} />
  );
};

// Convenience components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <LoadingSkeleton
        key={index}
        variant="text"
        height="1rem"
        className={cn(
          'w-full',
          index === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-4', className)}>
    <LoadingSkeleton variant="rectangular" height="1.5rem" width="60%" />
    <TextSkeleton lines={3} />
    <div className="flex gap-2">
      <LoadingSkeleton variant="rounded" height="2rem" width="4rem" />
      <LoadingSkeleton variant="rounded" height="2rem" width="6rem" />
    </div>
  </div>
);

export const AvatarSkeleton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <LoadingSkeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export default LoadingSkeleton;
