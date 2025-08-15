import React, { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface GlassSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  color?: string;
}

interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: GlassSelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: string) => void;
  clearable?: boolean;
}

const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    options,
    placeholder,
    variant = 'default',
    size = 'md',
    onChange,
    clearable = false,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      'border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm',
      'text-gray-900 appearance-none',
      {
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

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={baseClasses}
            onChange={handleChange}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
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

GlassSelect.displayName = 'GlassSelect';

export default GlassSelect;
