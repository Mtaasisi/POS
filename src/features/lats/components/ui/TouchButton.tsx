import React from 'react';
import { LucideIcon } from 'lucide-react';
import { usePOSClickSounds } from '../../hooks/usePOSClickSounds';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  title?: string;
  enableClickSound?: boolean;
  soundType?: 'click' | 'cart-add' | 'payment' | 'delete' | 'success' | 'error';
}

const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  title,
  enableClickSound = true,
  soundType = 'click'
}) => {
  const { playSound } = usePOSClickSounds();

  const handleClick = () => {
    if (enableClickSound && !disabled) {
      playSound(soundType);
    }
    onClick?.();
  };
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[44px] min-w-[44px]",
    md: "px-4 py-3 text-base min-h-[48px] min-w-[48px]",
    lg: "px-6 py-4 text-lg min-h-[56px] min-w-[56px]"
  };
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={title}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

export default TouchButton;
