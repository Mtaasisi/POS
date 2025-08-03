import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, CustomerType } from '../../types';
import GlassButton from '../ui/GlassButton';
import {
  Search,
  Package,
  Tag,
  Plus,
  Barcode,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Hash,
  Star,
  Eye,
  Info
} from 'lucide-react';

interface ProductSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  results: Product[];
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  customerType: CustomerType;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  results,
  onAddToCart,
  customerType
}) => {
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (value.length >= 2) {
      onSearch(value);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [value, onSearch]);

  const handleProductSelect = (product: Product, variant: ProductVariant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    setShowResults(false);
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      onAddToCart(selectedProduct, selectedVariant);
      setSelectedProduct(null);
      setSelectedVariant(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (quantity <= 5) return { status: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="relative z-20">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search products by name, SKU, or barcode..."
          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <>
          {/* Backdrop to prevent interaction with elements behind */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowResults(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Search Results</span>
              <span className="text-sm text-gray-500">({results.length} products)</span>
            </div>
            
            <div className="space-y-3">
              {results.map((product) => (
                <div key={product.id} className="space-y-2">
                  {/* Product Header */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        {product.brand && (
                          <div className="flex items-center gap-1 mt-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {product.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {product.category.name}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Product Variants */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="ml-4 space-y-2">
                      {product.variants.map((variant) => {
                        const stockStatus = getStockStatus(variant.available_quantity);
                        const price = customerType === 'wholesale' ? variant.selling_price * 0.9 : variant.selling_price;
                        
                        return (
                          <div
                            key={variant.id}
                            className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => handleProductSelect(product, variant)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{variant.variant_name}</span>
                                    {variant.sku && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {variant.sku}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(price)}
                                    </span>
                                    {customerType === 'wholesale' && (
                                      <span className="text-xs text-gray-500">(wholesale)</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Hash className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">{variant.available_quantity}</span>
                                    <span className="text-gray-500">in stock</span>
                                  </div>
                                  
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                                    {variant.available_quantity === 0 ? (
                                      <AlertCircle className="w-3 h-3" />
                                    ) : variant.available_quantity <= 5 ? (
                                      <Clock className="w-3 h-3" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                    {stockStatus.status}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <GlassButton
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart(product, variant);
                                  }}
                                  disabled={variant.available_quantity === 0}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                >
                                  <Plus className="w-4 h-4" />
                                </GlassButton>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* No Results */}
      {showResults && value.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl z-[9999] p-6">
          <div className="text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try searching with different keywords or check the spelling</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>Search by product name, SKU, or barcode</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Product Quick Add */}
      {selectedProduct && selectedVariant && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-600">{selectedVariant.variant_name}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-semibold text-green-600">
                  {formatCurrency(customerType === 'wholesale' ? selectedVariant.selling_price * 0.9 : selectedVariant.selling_price)}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedVariant.available_quantity} in stock
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <GlassButton
                variant="outline"
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                }}
                className="border-gray-300 text-gray-600"
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearchInput; 