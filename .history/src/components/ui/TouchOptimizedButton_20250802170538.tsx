import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = ''
}) => {
  const handleClick = () => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onClick();
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 border-2 border-gray-200';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg';
      case 'success':
        return 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg';
      default:
        return 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'min-h-[48px] min-w-[100px] text-sm px-3 py-2';
      case 'md':
        return 'min-h-[56px] min-w-[120px] text-base px-4 py-3';
      case 'lg':
        return 'min-h-[64px] min-w-[140px] text-lg px-5 py-4';
      case 'xl':
        return 'min-h-[72px] min-w-[160px] text-xl px-6 py-5';
      default:
        return 'min-h-[56px] min-w-[120px] text-base px-4 py-3';
    }
  };

  return (
    <button
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-2xl font-semibold
        active:scale-95 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-blue-300
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
    >
      <div className="flex items-center justify-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </div>
    </button>
  );
};

export default TouchOptimizedButton; 