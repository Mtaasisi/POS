import React from 'react';
import { Package } from 'lucide-react';
import { 
  getSpecificationColor, 
  formatSpecificationValue, 
  parseSpecification,
  getSpecificationCount,
  getSpecificationsByCategory,
  ProductSpecification
} from '../../lib/specificationUtils';

interface SpecificationDisplayProps {
  specification: string | ProductSpecification | null;
  variant?: 'compact' | 'detailed' | 'card' | 'list';
  maxDisplay?: number;
  showCount?: boolean;
  showCategories?: boolean;
  className?: string;
  title?: string;
  emptyMessage?: string;
}

const SpecificationDisplay: React.FC<SpecificationDisplayProps> = ({
  specification,
  variant = 'compact',
  maxDisplay = 4,
  showCount = true,
  showCategories = false,
  className = '',
  title = 'Specifications',
  emptyMessage = 'No specifications available'
}) => {
  const spec = typeof specification === 'string' ? parseSpecification(specification) : specification;
  
  if (!spec || Object.keys(spec).length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Filter out null/undefined/empty values
  const specEntries = Object.entries(spec).filter(([key, value]) => 
    value !== null && value !== undefined && value !== '' && value !== 'null' && value !== 'undefined'
  );
  const displayEntries = specEntries.slice(0, maxDisplay);
  const hasMore = specEntries.length > maxDisplay;

  // Compact variant (for cards, lists)
  if (variant === 'compact') {
    return (
      <div className={className}>
        {title && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {title}
              {showCount && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {specCount}
                </span>
              )}
            </h4>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-1 max-h-16 overflow-y-auto">
          {displayEntries.map(([key, value]) => (
            <div key={key} className={`px-2 py-1 rounded-md border text-xs ${getSpecificationColor(key)}`}>
              <div className="font-medium truncate">{key.replace(/_/g, ' ')}</div>
              <div className="truncate">{formatSpecificationValue(key, value)}</div>
            </div>
          ))}
        </div>
        
        {hasMore && (
          <div className="text-xs text-gray-500 mt-1">
            +{specCount - maxDisplay} more
          </div>
        )}
      </div>
    );
  }

  // Detailed variant (for product details, modals)
  if (variant === 'detailed') {
    const categorized = showCategories ? getSpecificationsByCategory(spec) : { 'All': spec };
    
    return (
      <div className={className}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {title}
              {showCount && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {specCount} specifications
                </span>
              )}
            </h3>
          </div>
        )}
        
        <div className="space-y-4">
          {Object.entries(categorized).map(([category, categorySpecs]) => (
            <div key={category}>
              {showCategories && category !== 'All' && (
                <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(categorySpecs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatSpecificationValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card variant (for product cards)
  if (variant === 'card') {
    return (
      <div className={className}>
        <div className="flex flex-wrap gap-1">
          {displayEntries.map(([key, value]) => (
            <span key={key} className={`px-2 py-1 rounded-md border text-xs font-medium ${getSpecificationColor(key)}`}>
              {key.replace(/_/g, ' ')}: {formatSpecificationValue(key, value)}
            </span>
          ))}
          {hasMore && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
              +{specCount - maxDisplay} more
            </span>
          )}
        </div>
      </div>
    );
  }

  // List variant (for simple lists)
  if (variant === 'list') {
    return (
      <div className={className}>
        {title && (
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        )}
        <ul className="space-y-1">
          {displayEntries.map(([key, value]) => (
            <li key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-900 font-medium">
                {formatSpecificationValue(key, value)}
              </span>
            </li>
          ))}
          {hasMore && (
            <li className="text-xs text-gray-500 text-center">
              +{specCount - maxDisplay} more specifications
            </li>
          )}
        </ul>
      </div>
    );
  }

  return null;
};

export default SpecificationDisplay;
