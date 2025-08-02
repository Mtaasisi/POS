import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300';
  
  const variantClasses = {
    primary: 'original-theme:bg-gradient-to-r original-theme:from-blue-500/80 original-theme:to-indigo-500/80 original-theme:hover:from-blue-600/90 original-theme:hover:to-indigo-600/90 original-theme:text-white original-theme:border-white/20 dark-theme:bg-gradient-to-r dark-theme:from-blue-600/90 dark-theme:to-indigo-600/90 dark-theme:hover:from-blue-700/95 dark-theme:hover:to-indigo-700/95 dark-theme:text-white dark-theme:border-white/30 shadow-lg',
    secondary: 'original-theme:bg-gradient-to-r original-theme:from-purple-500/80 original-theme:to-pink-500/80 original-theme:hover:from-purple-600/90 original-theme:hover:to-pink-600/90 original-theme:text-white original-theme:border-white/20 dark-theme:bg-gradient-to-r dark-theme:from-purple-600/90 dark-theme:to-pink-600/90 dark-theme:hover:from-purple-700/95 dark-theme:hover:to-pink-700/95 dark-theme:text-white dark-theme:border-white/30 shadow-lg',
    success: 'original-theme:bg-gradient-to-r original-theme:from-emerald-500/80 original-theme:to-green-500/80 original-theme:hover:from-emerald-600/90 original-theme:hover:to-green-600/90 original-theme:text-white original-theme:border-white/20 dark-theme:bg-gradient-to-r dark-theme:from-emerald-600/90 dark-theme:to-green-600/90 dark-theme:hover:from-emerald-700/95 dark-theme:hover:to-green-700/95 dark-theme:text-white dark-theme:border-white/30 shadow-lg',
    danger: 'original-theme:bg-gradient-to-r original-theme:from-rose-500/80 original-theme:to-red-500/80 original-theme:hover:from-rose-600/90 original-theme:hover:to-red-600/90 original-theme:text-white original-theme:border-white/20 dark-theme:bg-gradient-to-r dark-theme:from-rose-600/90 dark-theme:to-red-600/90 dark-theme:hover:from-rose-700/95 dark-theme:hover:to-red-700/95 dark-theme:text-white dark-theme:border-white/30 shadow-lg',
    warning: 'original-theme:bg-gradient-to-r original-theme:from-amber-500/80 original-theme:to-orange-500/80 original-theme:hover:from-amber-600/90 original-theme:hover:to-orange-600/90 original-theme:text-white original-theme:border-white/20 dark-theme:bg-gradient-to-r dark-theme:from-amber-600/90 dark-theme:to-orange-600/90 dark-theme:hover:from-amber-700/95 dark-theme:hover:to-orange-700/95 dark-theme:text-white dark-theme:border-white/30 shadow-lg',
    outline: 'original-theme:bg-transparent original-theme:border-2 original-theme:border-gray-300 original-theme:text-gray-700 original-theme:hover:bg-gray-50 original-theme:hover:border-gray-400 dark-theme:bg-white/10 dark-theme:border-2 dark-theme:border-white/30 dark-theme:text-white dark-theme:hover:bg-white/20 dark-theme:hover:border-white/40 backdrop-blur-md',
  };
  
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg font-medium'
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </button>
  );
};

export default GlassButton;