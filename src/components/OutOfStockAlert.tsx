import React from 'react';

interface OutOfStockAlertProps {
  variantName?: string;
  className?: string;
}

export const OutOfStockAlert: React.FC<OutOfStockAlertProps> = ({ 
  variantName = "This variant",
  className = "" 
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border-2 border-dashed border-red-300 ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 opacity-60"></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Stock Available</h3>
              <p className="text-sm text-gray-500">Inventory depleted</p>
            </div>
          </div>
          
          {/* Stock count badge */}
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Units</div>
          </div>
        </div>
        
        {/* Action area */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            {variantName} will be restocked soon
          </span>
          
          <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutOfStockAlert;
