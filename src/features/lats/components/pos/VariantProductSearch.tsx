import React, { useState, useEffect } from 'react';
import { Search, Package, Tag, Filter, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import VariantProductCard from './VariantProductCard';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { format } from '../../lib/format';

interface VariantProductSearchProps {
  products: ProductSearchResult[];
  onAddToCart: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
  onViewDetails?: (product: ProductSearchResult) => void;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  showFilters?: boolean;
  className?: string;
}

interface FilterState {
  category: string;
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  priceRange: 'all' | 'low' | 'medium' | 'high';
  hasVariants: 'all' | 'yes' | 'no';
}

const VariantProductSearch: React.FC<VariantProductSearchProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  isLoading = false,
  searchTerm = '',
  onSearchChange,
  showFilters = true,
  className = ''
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    stockStatus: 'all',
    priceRange: 'all',
    hasVariants: 'all'
  });

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Handle filter change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      stockStatus: 'all',
      priceRange: 'all',
      hasVariants: 'all'
    });
  };

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.categoryName).filter(Boolean)));



  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    // Search filter
    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.variants.some(variant => 
          variant.sku.toLowerCase().includes(searchLower) ||
          variant.name.toLowerCase().includes(searchLower) ||
          Object.values(variant.attributes).some(value => 
            value.toLowerCase().includes(searchLower)
          )
        ) ||
        false;
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && product.categoryName !== filters.category) {
      return false;
    }



    // Stock status filter
    if (filters.stockStatus !== 'all') {
      const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
      switch (filters.stockStatus) {
        case 'in-stock':
          if (totalStock <= 0) return false;
          break;
        case 'low-stock':
          if (totalStock > 5) return false;
          break;
        case 'out-of-stock':
          if (totalStock > 0) return false;
          break;
      }
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const prices = product.variants.map(v => v.sellingPrice).filter(p => p > 0);
      if (prices.length === 0) return false;
      
      const maxPrice = Math.max(...prices);
      switch (filters.priceRange) {
        case 'low':
          if (maxPrice > 50000) return false; // TZS 50,000
          break;
        case 'medium':
          if (maxPrice <= 50000 || maxPrice > 200000) return false; // TZS 50,000 - 200,000
          break;
        case 'high':
          if (maxPrice <= 200000) return false; // TZS 200,000+
          break;
      }
    }

    // Variants filter
    if (filters.hasVariants !== 'all') {
      const hasMultipleVariants = product.variants.length > 1;
      switch (filters.hasVariants) {
        case 'yes':
          if (!hasMultipleVariants) return false;
          break;
        case 'no':
          if (hasMultipleVariants) return false;
          break;
      }
    }

    return true;
  });

  // Get active filters count
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <GlassInput
              type="text"
              placeholder="Search products, SKUs, or variants..."
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {showFilters && (
            <GlassButton
              variant="secondary"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>



            {/* Stock Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="low">Under TZS 50,000</option>
                <option value="medium">TZS 50,000 - 200,000</option>
                <option value="high">Over TZS 200,000</option>
              </select>
            </div>

            {/* Variants Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
              <select
                value={filters.hasVariants}
                onChange={(e) => handleFilterChange('hasVariants', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="yes">With Variants</option>
                <option value="no">Single Variant</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <GlassButton
                variant="secondary"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <span>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              {localSearchTerm && ` for "${localSearchTerm}"`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <span className="text-blue-600">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <GlassCard key={index} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <VariantProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              showStockInfo={true}
              showCategory={true}
              
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {localSearchTerm 
              ? `No products match your search for "${localSearchTerm}"`
              : 'No products available with the current filters'
            }
          </p>
          <div className="flex justify-center space-x-2">
            <GlassButton
              variant="secondary"
              onClick={() => handleSearchChange('')}
            >
              Clear Search
            </GlassButton>
            {activeFiltersCount > 0 && (
              <GlassButton
                variant="secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </GlassButton>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default VariantProductSearch;
