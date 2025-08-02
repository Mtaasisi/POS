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
    primary: 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-700/95 hover:to-indigo-700/95 text-white border-white/30 shadow-lg',
    secondary: 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-700/95 hover:to-pink-700/95 text-white border-white/30 shadow-lg',
    success: 'bg-gradient-to-r from-emerald-600/90 to-green-600/90 hover:from-emerald-700/95 hover:to-green-700/95 text-white border-white/30 shadow-lg',
    danger: 'bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-700/95 hover:to-red-700/95 text-white border-white/30 shadow-lg',
    warning: 'bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-700/95 hover:to-orange-700/95 text-white border-white/30 shadow-lg',
    outline: 'bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-md',
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