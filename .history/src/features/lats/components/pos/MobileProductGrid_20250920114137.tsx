import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, Grid, List, Plus, Minus } from 'lucide-react';
import { ProductSearchResult } from '../../types/pos';
import { ProductImage } from '../../../../lib/robustImageService';

interface MobileProductGridProps {
  products: ProductSearchResult[];
  onAddToCart: (product: ProductSearchResult, variant?: any, quantity?: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  showFilters?: boolean;
}

const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  products,
  onAddToCart,
  searchQuery,
  onSearchChange,
  isLoading,
  showFilters = true
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

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

  // Mobile-optimized product card
  const ProductCard = ({ product }: { product: ProductSearchResult }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);

    const handleAddToCart = () => {
      onAddToCart(product, selectedVariant, quantity);
      toast.success(`${quantity}x ${product.name} added to cart`);
    };

    const formatPrice = (price: number) => {
      return price.toLocaleString() + ' TSH';
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mobile-product-card h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-20 sm:h-24 bg-gray-50 flex-shrink-0">
          <ProductImage
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package size={20} className="text-gray-400 sm:hidden" />
                <Package size={24} className="text-gray-400 hidden sm:block" />
              </div>
            }
          />
          
          {/* Stock Badge */}
          {product.stock_quantity !== undefined && (
            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
              product.stock_quantity > 10 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : product.stock_quantity > 0 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className="hidden sm:inline">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </span>
              <span className="sm:hidden">
                {product.stock_quantity > 0 ? `${product.stock_quantity}` : '0'}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 sm:p-3 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            
            {product.sku && (
              <p className="text-xs text-gray-500 mb-1 font-mono">SKU: {product.sku}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-1">
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variant = product.variants?.find(v => v.id === e.target.value);
                    setSelectedVariant(variant);
                  }}
                  className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 touch-input bg-white"
                >
                  {product.variants.map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} - {formatPrice(variant.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-green-600 text-sm sm:text-base whitespace-nowrap overflow-hidden" title={formatPrice(selectedVariant?.price || product.price)}>
                {formatPrice(selectedVariant?.price || product.price)}
              </span>
              
              {/* Quantity Selector */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-md p-0.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 rounded-sm active:bg-gray-200 touch-target"
                >
                  <Minus size={12} />
                </button>
                <span className="px-1.5 py-0.5 bg-white rounded text-xs font-medium min-w-[1.5rem] text-center border">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 rounded-sm active:bg-gray-200 touch-target"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full py-2 bg-blue-500 text-white font-medium rounded-md active:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm touch-button shadow-sm"
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-input"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          {showFilters && (
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded-lg text-xs font-medium active:bg-gray-200 transition-colors touch-target"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </span>
              <span className="sm:hidden">
                {selectedCategory === 'all' ? 'All' : selectedCategory.substring(0, 8)}
              </span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors touch-target ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'active:bg-gray-200'
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors touch-target ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'active:bg-gray-200'
              }`}
            >
              <List size={14} />
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
      <div className="flex-1 overflow-y-auto p-3 mobile-scroll">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3' 
              : 'space-y-2 sm:space-y-3'
          }>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          {filteredProducts.length} of {products.length} products
        </p>
      </div>
    </div>
  );
};

export default MobileProductGrid;
