import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Package, Search, Filter, Grid, List, Loader2, Monitor } from 'lucide-react';
import { ProductSearchResult } from '../../types/pos';
import DynamicMobileProductCard from './DynamicMobileProductCard';
import DynamicProductText from './DynamicProductText';
import { RESPONSIVE_OPTIMIZATIONS } from '../../../shared/constants/theme';
import { useDynamicGrid } from '../../hooks/useDynamicGrid';

interface DynamicMobileProductGridProps {
  products: ProductSearchResult[];
  onAddToCart: (product: ProductSearchResult, variant?: any, quantity?: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  showFilters?: boolean;
  batchSize?: number;
  enableVirtualization?: boolean;
  enableDynamicGrid?: boolean;
  minCardWidth?: number;
  maxColumns?: number;
}

const DynamicMobileProductGrid: React.FC<DynamicMobileProductGridProps> = ({
  products,
  onAddToCart,
  searchQuery,
  onSearchChange,
  isLoading,
  showFilters = true,
  batchSize = 10,
  enableVirtualization = true,
  enableDynamicGrid = true,
  minCardWidth = 180,
  maxColumns = 8,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(batchSize);
  
  // Dynamic grid container ref
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic grid calculation
  const { 
    columns, 
    containerWidth, 
    getGridClasses, 
    getOptimalCardWidth 
  } = useDynamicGrid({
    containerRef: gridContainerRef,
    minCardWidth,
    maxColumns,
    gap: 16,
    containerPadding: 32
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = products.reduce((acc, product) => {
      if (product.category && !acc.includes(product.category)) {
        acc.push(product.category);
      }
      return acc;
    }, [] as string[]);
    return ['all', ...cats];
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Get visible products for virtualization
  const visibleProducts = useMemo(() => {
    if (!enableVirtualization) return filteredProducts;
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount, enableVirtualization]);

  // Load more products
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + batchSize, filteredProducts.length));
  }, [batchSize, filteredProducts.length]);

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleCount(batchSize);
  }, [searchQuery, selectedCategory, batchSize]);

  // Check if there are more products to load
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className={`sticky top-0 z-10 bg-white border-b border-gray-200 ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.mobile} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.tablet} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.desktop} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.hd}`}>
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className={`w-full pl-8 pr-3 ${RESPONSIVE_OPTIMIZATIONS.searchBar.mobile} ${RESPONSIVE_OPTIMIZATIONS.searchBar.tablet} ${RESPONSIVE_OPTIMIZATIONS.searchBar.desktop} ${RESPONSIVE_OPTIMIZATIONS.searchBar.hd} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs`}
          />
        </div>

        {/* Filters Row */}
        <div className={`flex items-center ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.mobile} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.tablet} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.desktop} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.hd}`}>
          {/* Category Filter */}
          {showFilters && (
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className={`flex items-center gap-1 ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.mobile} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.tablet} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.desktop} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.hd} bg-gray-100 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors`}
            >
              <Filter size={16} />
              <DynamicProductText
                priority={true}
                fallback={<span>All Categories</span>}
              >
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </DynamicProductText>
            </button>
          )}

                 {/* Grid Info (when dynamic grid is enabled) */}
                 {enableDynamicGrid && viewMode === 'grid' && (
                   <div className="flex items-center gap-1 text-xs text-gray-500">
                     <Monitor size={14} />
                     <span>{columns} cols</span>
                   </div>
                 )}

                 {/* View Mode Toggle */}
                 <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                   <button
                     onClick={() => setViewMode('grid')}
                     className={`p-2 rounded-md transition-colors ${
                       viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                     }`}
                   >
                     <Grid size={16} />
                   </button>
                   <button
                     onClick={() => setViewMode('list')}
                     className={`p-2 rounded-md transition-colors ${
                       viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                     }`}
                   >
                     <List size={16} />
                   </button>
                 </div>
        </div>

        {/* Category Dropdown */}
        {showCategoryFilter && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowCategoryFilter(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      <div className={`flex-1 overflow-y-auto ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.mobile} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.tablet} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.desktop} ${RESPONSIVE_OPTIMIZATIONS.spacing.padding.hd}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <DynamicProductText priority={true}>
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </DynamicProductText>
          </div>
        ) : (
          <>
            <div 
              ref={gridContainerRef}
              className={
                viewMode === 'grid' 
                  ? enableDynamicGrid 
                    ? `${getGridClasses()} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.mobile} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.tablet} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.desktop} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.hd}`
                    : `grid ${RESPONSIVE_OPTIMIZATIONS.gridLayout.mobile} ${RESPONSIVE_OPTIMIZATIONS.gridLayout.tablet} ${RESPONSIVE_OPTIMIZATIONS.gridLayout.desktop} ${RESPONSIVE_OPTIMIZATIONS.gridLayout.hd} ${RESPONSIVE_OPTIMIZATIONS.gridLayout.ultraHd} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.mobile} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.tablet} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.desktop} ${RESPONSIVE_OPTIMIZATIONS.spacing.gap.hd}`
                  : 'space-y-3'
              }
            >
              {visibleProducts.map((product, index) => (
                <DynamicMobileProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  priority={index < 4} // Prioritize first 4 products
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  className={`${RESPONSIVE_OPTIMIZATIONS.buttonSizes.mobile} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.tablet} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.desktop} ${RESPONSIVE_OPTIMIZATIONS.buttonSizes.hd} bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-xs`}
                >
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <DynamicProductText priority={true}>
          <div className="text-sm text-gray-600 text-center">
            <p>
              {visibleProducts.length} of {filteredProducts.length} products
              {enableVirtualization && hasMore && ` (${filteredProducts.length - visibleCount} more available)`}
            </p>
            {enableDynamicGrid && viewMode === 'grid' && (
              <p className="text-xs text-gray-500 mt-1">
                Grid: {columns} columns • Width: {containerWidth}px • Card: {Math.round(getOptimalCardWidth())}px
              </p>
            )}
          </div>
        </DynamicProductText>
      </div>
    </div>
  );
};

export default DynamicMobileProductGrid;
