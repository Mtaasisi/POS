import React, { memo } from 'react';
import { Search, RefreshCw, Package, Command, Barcode, Filter } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface POSMainLayoutProps {
  // Search and filtering
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  
  // Actions
  onRefresh: () => void;
  onToggleBarcodeScanner: () => void;
  onToggleSettings: () => void;
  
  // Children
  children: React.ReactNode;
  
  // Optional props
  className?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

const POSMainLayout: React.FC<POSMainLayoutProps> = memo(({
  searchQuery,
  onSearchChange,
  isSearching,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onRefresh,
  onToggleBarcodeScanner,
  onToggleSettings,
  children,
  className = '',
  showFilters = false,
  onToggleFilters
}) => {
  return (
    <div className={`flex-1 overflow-hidden flex flex-col ${className}`}>
      <GlassCard className="p-6 h-full flex flex-col">
        {/* Search and Controls Section */}
        <div className="flex-shrink-0 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, categories, brands..."
              className="w-full pl-12 pr-32 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Loading Indicator */}
            {isSearching && (
              <div className="absolute left-14 top-1/2 transform -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <GlassButton
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </GlassButton>
              
              {onToggleFilters && (
                <GlassButton
                  onClick={onToggleFilters}
                  variant="ghost"
                  size="sm"
                  className={`p-1.5 hover:text-blue-600 hover:bg-blue-50 ${
                    showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                  }`}
                  title="Filters"
                >
                  <Filter className="w-5 h-5" />
                </GlassButton>
              )}
              
              <GlassButton
                onClick={onToggleAdvancedFilters}
                variant="ghost"
                size="sm"
                className={`p-1.5 hover:text-blue-600 hover:bg-blue-50 ${
                  showAdvancedFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                }`}
                title="Advanced Search"
              >
                <Command className="w-5 h-5" />
              </GlassButton>
              
              <GlassButton
                onClick={onToggleBarcodeScanner}
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Barcode Scanner"
              >
                <Barcode className="w-5 h-5" />
              </GlassButton>
              
              <GlassButton
                onClick={onToggleSettings}
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                title="Settings"
              >
                <Package className="w-5 h-5" />
              </GlassButton>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </GlassCard>
    </div>
  );
});

POSMainLayout.displayName = 'POSMainLayout';

export default POSMainLayout;
