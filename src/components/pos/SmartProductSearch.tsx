import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Search, Filter, X, Star, Package, Smartphone, Monitor, Headphones } from 'lucide-react';
import { getProducts, searchProducts, Product } from '../../lib/inventoryApi';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  variant?: string;
  product?: Product;
}

interface SmartProductSearchProps {
  isOpen: boolean;
  onProductSelect: (product: CartProduct) => void;
  onClose: () => void;
}

const SmartProductSearch: React.FC<SmartProductSearchProps> = ({ isOpen, onProductSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: any }[]>([]);

  // Load products and categories on component mount
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadCategories();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Extract unique categories from products
      const uniqueCategories = new Map();
      products.forEach(product => {
        if (product.category) {
          uniqueCategories.set(product.category.id, {
            id: product.category.id,
            name: product.category.name,
            icon: Package // Default icon, you can customize based on category name
          });
        }
      });
      
      // Add "All Products" option
      const categoryList = [
        { id: 'all', name: 'All Products', icon: Package },
        ...Array.from(uniqueCategories.values())
      ];
      
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([
        { id: 'all', name: 'All Products', icon: Package }
      ]);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }

    if (query.trim()) {
      setLoading(true);
      try {
        const searchResults = await searchProducts(query);
        setProducts(searchResults);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // If search is empty, load all products
      loadProducts();
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || 
      (product.category && product.category.id === selectedCategory);
    
    // Check if any variant matches the price range
    const hasVariantInPriceRange = product.variants?.some(variant => 
      variant.selling_price >= priceRange[0] && variant.selling_price <= priceRange[1]
    );
    
    return matchesCategory && (hasVariantInPriceRange || !product.variants?.length);
  });

  const handleProductSelect = (product: Product) => {
    // If product has variants, use the first one as default
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const cartProduct: CartProduct = {
        id: variant.id, // Use variant ID for cart
        name: `${product.name} - ${variant.variant_name}`,
        price: variant.selling_price,
        stock: variant.available_quantity,
        variant: variant.variant_name,
        product: product
      };
      onProductSelect(cartProduct);
    } else {
      // If no variants, use the product directly with default values
      const cartProduct: CartProduct = {
        id: product.id,
        name: product.name,
        price: 0, // You might want to set a default price
        stock: 0,
        product: product
      };
      onProductSelect(cartProduct);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-4xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Search size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Smart Product Search</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name, brand, model, or product code..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Filter size={16} />
            </GlassButton>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          )}

          {/* Products Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                    {product.is_active ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactive</span>
                    )}
                  </div>
                  
                  {product.brand && (
                    <p className="text-xs text-gray-600 mb-1">Brand: {product.brand}</p>
                  )}
                  
                  {product.category && (
                    <p className="text-xs text-gray-600 mb-2">Category: {product.category.name}</p>
                  )}

                  {/* Show variants if available */}
                  {product.variants && product.variants.length > 0 ? (
                    <div className="space-y-1">
                      {product.variants.slice(0, 2).map((variant) => (
                        <div key={variant.id} className="text-xs">
                          <span className="font-medium">{variant.variant_name}</span>
                          <span className="text-gray-600 ml-2">₦{variant.selling_price.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">({variant.available_quantity} in stock)</span>
                        </div>
                      ))}
                      {product.variants.length > 2 && (
                        <p className="text-xs text-gray-500">+{product.variants.length - 2} more variants</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No variants available</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default SmartProductSearch; 