import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Search, Filter, X, Star, Package, Smartphone, Monitor, Headphones } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  isFavorite?: boolean;
}

interface SmartProductSearchProps {
  isOpen: boolean;
  onProductSelect: (product: Product) => void;
  onClose: () => void;
}

const SmartProductSearch: React.FC<SmartProductSearchProps> = ({ isOpen, onProductSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Mock data - replace with real API calls
  const categories = [
    { id: 'all', name: 'All Products', icon: Package },
    { id: 'phones', name: 'Phones', icon: Smartphone },
    { id: 'laptops', name: 'Laptops', icon: Monitor },
    { id: 'accessories', name: 'Accessories', icon: Headphones },
  ];

  const products: Product[] = [
    { id: '1', name: 'iPhone 13 Pro', category: 'phones', price: 450000, stock: 5 },
    { id: '2', name: 'Samsung Galaxy S21', category: 'phones', price: 380000, stock: 3 },
    { id: '3', name: 'MacBook Air M1', category: 'laptops', price: 850000, stock: 2 },
    { id: '4', name: 'AirPods Pro', category: 'accessories', price: 120000, stock: 8 },
    { id: '5', name: 'iPad Air', category: 'laptops', price: 320000, stock: 4 },
    { id: '6', name: 'Apple Watch Series 7', category: 'accessories', price: 180000, stock: 6 },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    onClose();
  };

  // Debug logging
  console.log('SmartProductSearch render:', { isOpen, searchQuery });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
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
              placeholder="Search products by name, category, or price..."
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
              <h3 className="font-medium text-gray-900 mb-3">Filters</h3>
              
              {/* Categories */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <category.icon size={14} className="inline mr-1" />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-24 p-2 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-24 p-2 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <GlassCard
                key={product.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.isFavorite && (
                    <Star size={16} className="text-yellow-500 fill-current" />
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.stock > 10 
                      ? 'bg-green-100 text-green-800' 
                      : product.stock > 3 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock} in stock
                  </span>
                </div>
                
                <p className="text-xl font-bold text-blue-600 mb-3">₦{product.price.toLocaleString()}</p>
                
                <GlassButton 
                  variant="primary" 
                  size="sm" 
                  className="w-full group-hover:scale-105 transition-transform"
                >
                  Add to Cart
                </GlassButton>
              </GlassCard>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default SmartProductSearch; 