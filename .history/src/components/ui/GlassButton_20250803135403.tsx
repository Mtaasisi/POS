import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
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
    primary: 'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20',
    secondary: 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90 text-white border-white/20',
    success: 'bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-600/90 hover:to-green-600/90 text-white border-white/20',
    danger: 'bg-gradient-to-r from-rose-500/80 to-red-500/80 hover:from-rose-600/90 hover:to-red-600/90 text-white border-white/20',
    warning: 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-600/90 hover:to-orange-600/90 text-white border-white/20',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
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