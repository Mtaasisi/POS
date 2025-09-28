import React from 'react';
import { BUTTON_VARIANTS, BUTTON_SIZES, ANIMATION_DURATIONS, BORDER_RADIUS } from '../../constants/theme';

interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const StandardButton: React.FC<StandardButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = BUTTON_VARIANTS[variant];
  const sizeClasses = BUTTON_SIZES[size];
  const animationClasses = ANIMATION_DURATIONS.normal;
  const borderRadiusClasses = BORDER_RADIUS.sm;
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const focusRingClasses = {
    primary: 'focus:ring-blue-500',
    secondary: 'focus:ring-gray-500',
    success: 'focus:ring-green-500',
    warning: 'focus:ring-orange-500',
    danger: 'focus:ring-red-500',
    purple: 'focus:ring-purple-500',
    teal: 'focus:ring-teal-500',
  }[variant];

  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    animationClasses,
    borderRadiusClasses,
    widthClasses,
    focusRingClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

export default StandardButton;
