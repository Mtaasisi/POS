import React from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicPageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DynamicPageLoader: React.FC<DynamicPageLoaderProps> = ({ 
  message = 'Loading page...', 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we load the page</p>
      </div>
    </div>
  );
};

export default DynamicPageLoader;
