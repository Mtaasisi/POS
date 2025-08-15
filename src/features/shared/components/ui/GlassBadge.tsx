import React from 'react';
import { cn } from '../../../../lib/utils';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  icon
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-full',
    'transition-all duration-200 backdrop-blur-sm',
    {
      // Variants
      'bg-gray-100 text-gray-800 border border-gray-200': variant === 'default',
      'bg-blue-100 text-blue-800 border border-blue-200': variant === 'primary',
      'bg-purple-100 text-purple-800 border border-purple-200': variant === 'secondary',
      'bg-green-100 text-green-800 border border-green-200': variant === 'success',
      'bg-yellow-100 text-yellow-800 border border-yellow-200': variant === 'warning',
      'bg-red-100 text-red-800 border border-red-200': variant === 'error',
      'bg-cyan-100 text-cyan-800 border border-cyan-200': variant === 'info',
      
      // Sizes
      'px-2 py-0.5 text-xs': size === 'sm',
      'px-3 py-1 text-sm': size === 'md',
      'px-4 py-2 text-base': size === 'lg',
      
      // Interactive
      'cursor-pointer hover:scale-105 active:scale-95': onClick,
    },
    className
  );

  return (
    <span className={baseClasses} onClick={onClick}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default GlassBadge;
