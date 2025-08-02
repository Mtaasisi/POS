import React, { useState, useMemo } from 'react';
import { AlertTriangle, Package, Clock, TrendingDown, Plus, Eye, X, AlertCircle, Zap, Info } from 'lucide-react';
import { SparePart } from '../lib/database.types';

interface EnhancedLowStockAlertCardProps {
  lowStockParts: SparePart[];
  onRestockNow?: () => void;
  onViewAll?: () => void;
  onDismiss?: () => void;
  onPartClick?: (part: SparePart) => void;
  className?: string;
}

const EnhancedLowStockAlertCard: React.FC<EnhancedLowStockAlertCardProps> = ({
  lowStockParts,
  onRestockNow,
  onViewAll,
  onDismiss,
  onPartClick,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);

  // Sort parts by urgency level
  const sortedParts = useMemo(() => {
    return [...lowStockParts].sort((a, b) => {
      const urgencyA = getUrgencyLevel(a.stock_quantity, a.min_stock_level);
      const urgencyB = getUrgencyLevel(b.stock_quantity, b.min_stock_level);
      
      const urgencyOrder = { critical: 0, urgent: 1, warning: 2, low: 3 };
      return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
    });
  }, [lowStockParts]);

  const criticalParts = sortedParts.filter(part => 
    getUrgencyLevel(part.stock_quantity, part.min_stock_level) === 'critical'
  );
  const urgentParts = sortedParts.filter(part => 
    getUrgencyLevel(part.stock_quantity, part.min_stock_level) === 'urgent'
  );

  if (!isVisible || lowStockParts.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getCategoryIcon = (category: string) => {
    const iconClasses = "w-4 h-4";
    switch (category.toLowerCase()) {
      case 'motherboard':
        return <Package className={`${iconClasses} text-blue-600`} />;
      case 'display':
        return <Package className={`${iconClasses} text-purple-600`} />;
      case 'battery':
        return <Package className={`${iconClasses} text-green-600`} />;
      case 'camera':
        return <Package className={`${iconClasses} text-orange-600`} />;
      case 'screen':
        return <Package className={`${iconClasses} text-indigo-600`} />;
      case 'charger':
        return <Package className={`${iconClasses} text-yellow-600`} />;
      default:
        return <Package className={`${iconClasses} text-gray-600`} />;
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / minimum) * 100, 100);
  };

  const getUrgencyLevel = (current: number, minimum: number) => {
    const percentage = getStockPercentage(current, minimum);
    if (percentage === 0) return 'critical';
    if (percentage <= 25) return 'urgent';
    if (percentage <= 50) return 'warning';
    return 'low';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'urgent': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-blue-700 bg-blue-100 border-blue-300';
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600';
      case 'urgent': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const displayParts = showAllItems ? sortedParts : sortedParts.slice(0, 4);

  return (
    <div className={`
      relative overflow-hidden
      bg-gradient-to-br from-red-50 via-red-100 to-red-200
      border border-red-200/50 
      rounded-2xl 
      shadow-2xl
      p-6 sm:p-8
      transition-all duration-500 
      hover:shadow-3xl hover:border-red-300/60
      animate-slideIn
      ${className}
    `}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-200/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      {/* Header Section */}
      <div className="relative z-10 flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="
            w-12 h-12 
            bg-gradient-to-br from-red-500 to-red-600 
            rounded-xl 
            flex items-center justify-center
            shadow-lg
            animate-pulse
          ">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-red-900">Low Stock Alert</h3>
            <span className="
              px-3 py-1 
              bg-red-100 text-red-800 
              text-xs font-semibold 
              rounded-full
              border border-red-200
              animate-pulse
            ">
              URGENT
            </span>
          </div>
          <p className="text-red-700 font-medium">
            {lowStockParts.length} part{lowStockParts.length !== 1 ? 's' : ''} require{lowStockParts.length === 1 ? 's' : ''} immediate attention
          </p>
          <p className="text-sm text-red-600 mt-1">Stock levels below minimum threshold</p>
          
          {/* Priority Summary */}
          {(criticalParts.length > 0 || urgentParts.length > 0) && (
            <div className="flex items-center gap-4 mt-3 text-xs">
              {criticalParts.length > 0 && (
                <span className="flex items-center gap-1 text-red-700 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {criticalParts.length} critical
                </span>
              )}
              {urgentParts.length > 0 && (
                <span className="flex items-center gap-1 text-orange-700 font-medium">
                  <Zap className="w-3 h-3" />
                  {urgentParts.length} urgent
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <button 
          onClick={onRestockNow}
          className="
            flex-shrink-0
            px-4 py-2 
            bg-gradient-to-r from-red-500 to-red-600 
            text-white font-semibold 
            rounded-lg
            shadow-lg
            transition-all duration-300
            hover:from-red-600 hover:to-red-700
            hover:shadow-xl
            hover:scale-105
            active:scale-95
            flex items-center gap-2
          "
        >
          <Plus className="w-4 h-4" />
          Restock Now
        </button>
      </div>
      
      {/* Items Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayParts.map((part, index) => {
          const urgencyLevel = getUrgencyLevel(part.stock_quantity, part.min_stock_level);
          const stockPercentage = getStockPercentage(part.stock_quantity, part.min_stock_level);
          
          return (
            <div 
              key={part.id} 
              className="
                bg-white/90 backdrop-blur-sm 
                p-4 rounded-xl 
                border border-red-200/50 
                shadow-lg
                transition-all duration-300
                hover:transform hover:-translate-y-1
                hover:shadow-xl
                cursor-pointer
                animate-fadeIn
              "
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onPartClick?.(part)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(part.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                    {part.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{part.brand}</p>
                </div>
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full border
                  ${getUrgencyColor(urgencyLevel)}
                `}>
                  {urgencyLevel.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-red-600 font-medium">
                  Stock: {part.stock_quantity}
                </div>
                <div className="text-xs text-gray-500">
                  Min: {part.min_stock_level}
                </div>
              </div>
              
              <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(urgencyLevel)}`}
                  style={{ width: `${stockPercentage}%` }}
                />
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {Math.round(stockPercentage)}% of minimum
                </span>
                {part.cost && (
                  <span className="text-gray-600 font-medium">
                    ${part.cost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Show More/Less Button */}
      {lowStockParts.length > 4 && (
        <div className="relative z-10 flex justify-center mt-4">
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="
              px-4 py-2 
              text-red-700 font-medium 
              rounded-lg
              border border-red-300
              transition-all duration-300
              hover:bg-red-50 hover:border-red-400
              flex items-center gap-2
            "
          >
            <Eye className="w-4 h-4" />
            {showAllItems ? 'Show Less' : `Show ${lowStockParts.length - 4} More`}
          </button>
        </div>
      )}
      
      {/* Footer Actions */}
      <div className="relative z-10 flex items-center justify-between mt-6 pt-6 border-t border-red-200/50">
        <div className="flex items-center gap-4 text-sm text-red-700">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Last updated: Just now
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            {lowStockParts.length} items affected
          </span>
          <span className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            Sorted by priority
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDismiss}
            className="
              px-4 py-2 
              text-red-700 font-medium 
              rounded-lg
              border border-red-300
              transition-all duration-300
              hover:bg-red-50 hover:border-red-400
              flex items-center gap-2
            "
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
          <button 
            onClick={onViewAll}
            className="
              px-4 py-2 
              bg-red-600 text-white font-medium 
              rounded-lg
              transition-all duration-300
              hover:bg-red-700
              flex items-center gap-2
            "
          >
            <Eye className="w-4 h-4" />
            View All
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLowStockAlertCard; 