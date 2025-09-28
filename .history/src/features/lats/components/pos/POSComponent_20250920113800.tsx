// POS Component for LATS module using inventory store with enhanced variant support
import React, { useState, useEffect, useMemo } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePOSStore } from '../../stores/usePOSStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import VariantProductSearch from './VariantProductSearch';
import VariantCartItem from './VariantCartItem';
import { format } from '../../lib/format';
import { ProductSearchResult, ProductSearchVariant, CartItem } from '../../types/pos';

const POSComponent: React.FC = () => {
  // Store hooks
  const { 
    products, 
    loadProducts, 
    searchProducts, 
    isLoading, 
    error 
  } = useInventoryStore();
  
  const { 
    searchResults, 
    searchTerm, 
    isSearchingProducts,
    searchProducts: posSearchProducts,
    setSearchTerm,
    clearSearchResults
  } = usePOSStore();

  // Local state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts({ page: 1, limit: 50 });
  }, [loadProducts]);

  // Handle product search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchTerm(query);
      await posSearchProducts(query);
      setShowSearchResults(true);
    } else {
      clearSearchResults();
      setShowSearchResults(false);
    }
  };

  // Add product to cart with enhanced variant support
  const handleAddToCart = (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number = 1) => {
    const existingItem = cartItems.find(
      item => item.productId === product.id && item.variantId === variant.id
    );

    if (existingItem) {
      // Update quantity if already in cart
      const newQuantity = existingItem.quantity + quantity;
      setCartItems(prev => prev.map(item => 
        item.id === existingItem.id 
          ? { 
              ...item, 
              quantity: newQuantity, 
              totalPrice: newQuantity * item.unitPrice,
              availableQuantity: variant.quantity
            }
          : item
      ));
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        id: `${product.id}-${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: quantity,
        unitPrice: variant.sellingPrice,
        totalPrice: variant.sellingPrice * quantity,
        availableQuantity: variant.quantity,
        image: product.images?.[0]
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  // Update cart item quantity
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate totals
  const cartTotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.totalPrice, 0), 
    [cartItems]
  );

  const cartItemCount = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Format money
  const formatMoney = (amount: number) => {
    return format.money(amount);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Sell products and manage transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search and Results */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-4">Product Search</h2>
                <GlassInput
                  type="text"
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Search Results */}
              {showSearchResults && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">Search Results</h3>
                  {isSearchingProducts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Searching products...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.description}</p>
                                                              <p className="text-xs text-gray-500">
                                  {product.categoryName}
                                </p>
                            </div>
                            <div className="ml-4">
                              {product.variants.map((variant) => (
                                <div key={variant.id} className="text-right mb-2">
                                  <div className="text-sm font-medium">{variant.name}</div>
                                  <div className="text-lg font-bold text-blue-600">
                                    {formatMoney(variant.sellingPrice)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Stock: {variant.quantity} • SKU: {variant.sku}
                                  </div>
                                  <GlassButton
                                    size="sm"
                                    onClick={() => handleAddToCart(product, variant)}
                                    disabled={variant.quantity <= 0}
                                    className="mt-1"
                                  >
                                    {variant.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                  </GlassButton>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}

              {/* All Products Grid */}
              {!showSearchResults && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">All Products</h3>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading products...</p>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="mb-2 p-2 bg-gray-50 rounded">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">{variant.name}</div>
                                  <div className="text-xs text-gray-500">
                                    SKU: {variant.sku} • Stock: {variant.quantity}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {formatMoney(variant.sellingPrice)}
                                  </div>
                                  <GlassButton
                                    size="sm"
                                    onClick={() => handleAddToCart(product, variant)}
                                    disabled={variant.quantity <= 0}
                                  >
                                    {variant.quantity > 0 ? 'Add' : 'Out'}
                                  </GlassButton>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No products available
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Shopping Cart */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Shopping Cart</h2>
                <div className="text-sm text-gray-600">
                  {cartItemCount} items
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.productName}</h4>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          <p className="text-sm font-bold text-blue-600">
                            {formatMoney(item.unitPrice)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <GlassButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </GlassButton>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <GlassButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </GlassButton>
                          <GlassButton
                            size="sm"
                            variant="error"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            ×
                          </GlassButton>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-sm font-bold">
                          Total: {formatMoney(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Cart is empty
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              {cartItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatMoney(cartTotal)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <GlassButton
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        // TODO: Implement checkout process
                        console.log('Checkout:', cartItems);
                      }}
                    >
                      Checkout
                    </GlassButton>
                    <GlassButton
                      variant="outline"
                      className="w-full"
                      onClick={handleClearCart}
                    >
                      Clear Cart
                    </GlassButton>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6">
            <GlassCard className="p-4 bg-red-50 border-red-200">
              <p className="text-red-600">Error: {error}</p>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSComponent;
