import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, Command, QrCode, Filter, X, MoreHorizontal } from 'lucide-react';
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
  onScanQrCode?: () => void;
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
  onScanQrCode,
  currentPage,
  setCurrentPage,
  totalPages,
  productsPerPage
}) => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role as UserRole;
  const canAddProducts = rbacManager.can(userRole, 'products', 'create');
  
  // Session-based debug logging to prevent excessive console output
  const [hasLoggedDebug, setHasLoggedDebug] = useState(false);
  
  // Search suggestions disabled - keeping state for potential future use
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Categories popup state
  const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);

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
      }
    }
  };

  // Handle unified search
  const handleUnifiedSearch = (query: string) => {
    // Check if it's a barcode
    if (/^\d{8,}$/.test(query)) {
      // It's likely a barcode
      if (onScanQrCode) {
        onScanQrCode();
      } else {
        toast('QrCode scanning not available');
      }
    } else {
      // Regular search
      onSearch(query);
    }
  };

  // Filter products based on current filters
  const filteredProducts = products.filter(product => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        (product.category?.name && product.category.name.toLowerCase().includes(query)) ||
        // Enhanced variant search - search through variant names and SKUs
        (product.variants && product.variants.some(variant => 
          variant.name?.toLowerCase().includes(query) ||
          variant.sku?.toLowerCase().includes(query) ||
          variant.barcode?.toLowerCase().includes(query)
        ));
      
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

  // Show all products for scrolling instead of pagination
  const displayProducts = sortedProducts;

  // Session-based debug logging to prevent excessive console output
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && !hasLoggedDebug) {
      console.log('🔍 ProductSearchSection Debug:', {
    totalProducts: products.length,
    filteredProducts: filteredProducts.length,
    displayProducts: displayProducts.length,
    searchQuery: searchQuery.trim(),
    selectedCategory,
    selectedBrand,
    priceRange,
    stockFilter,
    categoriesReceived: categories,
    categoriesCount: categories?.length || 0,
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
      setHasLoggedDebug(true);
    }
  }, [products.length, filteredProducts.length, displayProducts.length, searchQuery, selectedCategory, selectedBrand, priceRange, stockFilter, hasLoggedDebug]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <GlassCard className="p-6 h-full flex flex-col">
        {/* Fixed Search Section */}
        <div className="flex-shrink-0 mb-4">
          {/* Main Search and Quick Filters */}
          <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchInputKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {/* Category Filter Buttons */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      selectedCategory === '' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  {categories.slice(0, 3).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 text-sm transition-colors ${
                        selectedCategory === category 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  {categories.length > 3 && (
                    <button
                      onClick={() => setShowCategoriesPopup(true)}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border-l border-gray-300"
                      title="Show all categories"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Stock Filter Buttons */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setStockFilter('all')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      stockFilter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStockFilter('in-stock')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      stockFilter === 'in-stock' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    onClick={() => setStockFilter('low-stock')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      stockFilter === 'low-stock' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Low Stock
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  {canAddProducts && (
                    <button
                      onClick={onAddExternalProduct}
                      className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
                      title="Add Product"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        handleUnifiedSearch(searchQuery.trim());
                      }
                    }}
                    className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="Scan"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 text-sm"
              >
                <option value="sales">Best Selling</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 text-sm w-24"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 text-sm w-24"
                />
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setPriceRange({ min: '', max: '' });
                  setStockFilter('all');
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-transparent">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pb-4">
              {displayProducts.map((product) => (
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

        {/* Product Count Display */}
        <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            Showing {displayProducts.length} products
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProductSearchSection;
