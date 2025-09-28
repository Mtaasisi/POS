import React, { useState, useMemo, useCallback } from 'react';
import { Package, Search, Filter, Grid, List, Loader2 } from 'lucide-react';
import { ProductSearchResult } from '../../types/pos';
import DynamicMobileProductCard from './DynamicMobileProductCard';
import DynamicProductText from './DynamicProductText';

interface DynamicMobileProductGridProps {
  products: ProductSearchResult[];
  onAddToCart: (product: ProductSearchResult, variant?: any, quantity?: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  showFilters?: boolean;
  batchSize?: number;
  enableVirtualization?: boolean;
}

const DynamicMobileProductGrid: React.FC<DynamicMobileProductGridProps> = ({
  products,
  onAddToCart,
  searchQuery,
  onSearchChange,
  isLoading,
  showFilters = true,
  batchSize = 10,
  enableVirtualization = true
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(batchSize);

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
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 lg:p-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-4 lg:py-5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Category Filter */}
          {showFilters && (
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors"
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
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
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
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6' 
                : 'space-y-4'
            }>
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
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load More Products ({filteredProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <DynamicProductText priority={true}>
          <p className="text-sm text-gray-600 text-center">
            {visibleProducts.length} of {filteredProducts.length} products
            {enableVirtualization && hasMore && ` (${filteredProducts.length - visibleCount} more available)`}
          </p>
        </DynamicProductText>
      </div>
    </div>
  );
};

export default DynamicMobileProductGrid;
