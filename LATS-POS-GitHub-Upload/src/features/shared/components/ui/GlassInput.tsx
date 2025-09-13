import React, { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  maxLength?: number;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    size = 'md',
    multiline = false,
    rows = 3,
    required = false,
    maxLength,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      'border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm',
      'placeholder-gray-500 text-gray-900',
      {
        'pl-10': leftIcon,
        'pr-10': rightIcon,
        'pl-3 pr-3': !leftIcon && !rightIcon,
        'py-2 text-sm': size === 'sm',
        'py-3 text-base': size === 'md',
        'py-4 text-lg': size === 'lg',
        'border-red-300 focus:border-red-500 focus:ring-red-500/50': error,
        'border-gray-300 focus:border-blue-500': !error,
        'bg-gray-50/80': variant === 'filled',
        'bg-transparent border-2': variant === 'outlined',
      },
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={baseClasses}
              rows={rows}
              maxLength={maxLength}
              {...props}
            />
          ) : (
            <input
              ref={ref}
              className={baseClasses}
              maxLength={maxLength}
              {...props}
            />
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export default GlassInput;
