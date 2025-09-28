import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  label,
  animated = true,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-6';
      default: return 'h-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-green-200',
          fill: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500',
          text: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-200',
          fill: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500',
          text: 'text-yellow-800'
        };
      case 'danger':
        return {
          bg: 'bg-red-200',
          fill: 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500',
          text: 'text-red-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-200',
          fill: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
          text: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-200',
          fill: 'bg-gradient-to-r from-gray-500 via-slate-500 to-zinc-500',
          text: 'text-gray-800'
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  const variantClasses = getVariantClasses();
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${variantClasses.text}`}>
            {label}
          </span>
          {showPercentage && (
            <span className={`text-sm font-semibold ${variantClasses.text}`}>
              {clampedProgress}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full ${variantClasses.bg} rounded-full ${getSizeClasses()} relative overflow-hidden`}>
        <div 
          className={`${variantClasses.fill} ${getSizeClasses()} rounded-full transition-all duration-700 ease-out relative`}
          style={{ width: `${clampedProgress}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          )}
        </div>
        
        {showPercentage && !label && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`${getTextSize()} font-bold ${variantClasses.text} drop-shadow-sm`}>
              {clampedProgress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
