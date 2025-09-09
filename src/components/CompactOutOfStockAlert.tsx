import React from 'react';

interface CompactOutOfStockAlertProps {
  className?: string;
}

export const CompactOutOfStockAlert: React.FC<CompactOutOfStockAlertProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer ${className}`}>
      {/* Animated pulse effect */}
      <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
      
      {/* Content */}
      <div className="relative flex items-center gap-2">
        {/* Stock indicator */}
        <div className="w-2 h-2 bg-white rounded-full"></div>
        
        <span className="text-sm font-medium">Out of Stock</span>
        
        <span className="text-red-100">•</span>
        
        <span className="text-xs opacity-90">0</span>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
    </div>
  );
};

export default CompactOutOfStockAlert;
