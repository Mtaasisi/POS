import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, Command, Barcode, Filter, X } from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import VariantProductCard from './VariantProductCard';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { rbacManager, type UserRole } from '../../lib/rbac';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parent_id?: string;
    isActive: boolean;
    sortOrder: number;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    children?: any[];
  };
  image: string;
  barcode: string;
  variants?: any[];
}

interface ProductSearchSectionProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  setStockFilter: (filter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') => void;
  sortBy: 'name' | 'price' | 'stock' | 'recent' | 'sales';
  setSortBy: (sort: 'name' | 'price' | 'stock' | 'recent' | 'sales') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  categories: string[];
  brands: string[];
  onAddToCart: (product: Product, variant?: any) => void;
  onAddExternalProduct: () => void;
  onSearch: (query: string) => void;
  onScanBarcode?: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  productsPerPage: number;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({
  products,
  searchQuery,
  setSearchQuery,
  isSearching,
  showAdvancedFilters,
  setShowAdvancedFilters,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  priceRange,
  setPriceRange,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  categories,
  brands,
  onAddToCart,
  onAddExternalProduct,
  onSearch,
  onScanBarcode,
  currentPage,
  setCurrentPage,
  totalPages,
  productsPerPage
}) => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role as UserRole;
  const canAddProducts = rbacManager.can(userRole, 'products', 'create');
  
  // Search suggestions disabled - keeping state for potential future use
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Disable search suggestions - just update the search query
    setShowSuggestions(false);
  };

  // Handle search input key press
  const handleSearchInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim());
        setShowSuggestions(false);
      }
    }
  };

  // Handle unified search
  const handleUnifiedSearch = (query: string) => {
    // Check if it's a barcode
    if (/^\d{8,}$/.test(query)) {
      // It's likely a barcode
      if (onScanBarcode) {
        onScanBarcode();
      } else {
        toast('Barcode scanning not available');
      }
    } else {
      // Regular search
      onSearch(query);
    }
    setShowSuggestions(false);
  };

  // Filter products based on current filters
  const filteredProducts = products.filter(product => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        (product.category?.name && product.category.name.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory && product.category?.name !== selectedCategory) return false;
    
    // Brand filter
    if (selectedBrand && product.brand !== selectedBrand) return false;
    
    // Get product price and stock from variants or fallback to product level
    const primaryVariant = product.variants?.[0];
    const productPrice = primaryVariant?.sellingPrice || product.price || 0;
    const productStock = primaryVariant?.quantity || product.stockQuantity || 0;
    
    // Price range filter
    if (priceRange.min && productPrice < parseFloat(priceRange.min)) return false;
    if (priceRange.max && productPrice > parseFloat(priceRange.max)) return false;
    
    // Stock filter
    switch (stockFilter) {
      case 'in-stock':
        if (productStock <= 0) return false;
        break;
      case 'low-stock':
        if (productStock > 10 || productStock <= 0) return false;
        break;
      case 'out-of-stock':
        if (productStock > 0) return false;
        break;
    }
    
    return true;
  });

  // Debug logging to help identify missing products
  console.log('🔍 ProductSearchSection Debug:', {
    totalProducts: products.length,
    filteredProducts: filteredProducts.length,
    searchQuery: searchQuery.trim(),
    selectedCategory,
    selectedBrand,
    priceRange,
    stockFilter,
    currentPage,
    productsPerPage,
    totalPages,
    sampleProduct: products[0] ? {
      id: products[0].id,
      name: products[0].name,
      sku: products[0].sku,
      price: products[0].price,
      stockQuantity: products[0].stockQuantity,
      category: products[0].category?.name,
      brand: products[0].brand,
      hasVariants: !!products[0].variants,
      variantsCount: products[0].variants?.length || 0,
      primaryVariant: products[0].variants?.[0] ? {
        id: products[0].variants[0].id,
        sku: products[0].variants[0].sku,
        sellingPrice: products[0].variants[0].sellingPrice,
        quantity: products[0].variants[0].quantity
      } : null
    } : null
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    // Get product price and stock from variants or fallback to product level
    const aPrimaryVariant = a.variants?.[0];
    const bPrimaryVariant = b.variants?.[0];
    const aPrice = aPrimaryVariant?.sellingPrice || a.price || 0;
    const bPrice = bPrimaryVariant?.sellingPrice || b.price || 0;
    const aStock = aPrimaryVariant?.quantity || a.stockQuantity || 0;
    const bStock = bPrimaryVariant?.quantity || b.stockQuantity || 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = aPrice - bPrice;
        break;
      case 'stock':
        comparison = aStock - bStock;
        break;
      case 'recent':
        // Assuming products have a createdAt field, using id as fallback
        comparison = a.id.localeCompare(b.id);
        break;
      case 'sales':
        // Using stock as fallback for sales sorting
        comparison = bStock - aStock;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginate products
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <GlassCard className="p-6 h-full flex flex-col">
        {/* Fixed Search Section */}
        <div className="flex-shrink-0 mb-6 space-y-4">
          {/* Smart Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500" />
            <input
              type="text"
              placeholder="Search products by name, SKU, category, or scan barcode..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchInputKeyPress}
              className="w-full pl-14 pr-24 py-5 text-lg border-2 border-blue-200 rounded-xl bg-white text-gray-900 placeholder-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ minHeight: '60px' }}
            />
            
            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute left-14 top-1/2 transform -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {canAddProducts && (
                <button
                  onClick={onAddExternalProduct}
                  className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95"
                  title="Add External Product"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Package className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                title="Advanced filters"
              >
                <Command className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleUnifiedSearch(searchQuery.trim());
                  }
                }}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95"
                title="Search or scan"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Barcode className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </h3>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Stock Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sales">Best Selling</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                  <option value="recent">Recent</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => (
                <VariantProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No products found</p>
              <p className="text-sm text-center">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ProductSearchSection;
