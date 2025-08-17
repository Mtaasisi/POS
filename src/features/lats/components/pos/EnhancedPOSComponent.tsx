import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, DollarSign, CreditCard, Receipt, Trash2, Package, Search, Bug, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePOSStore } from '../../stores/usePOSStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import VariantProductSearch from './VariantProductSearch';
import VariantCartItem from './VariantCartItem';
import ZenoPayPaymentButton from './ZenoPayPaymentButton';
import { format } from '../../lib/format';
import { ProductSearchResult, ProductSearchVariant, CartItem, Sale } from '../../types/pos';

const EnhancedPOSComponent: React.FC = () => {
  // Store hooks
  const { 
    products, 
    loadProducts, 
    isLoading: inventoryLoading, 
    error: inventoryError 
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts({ page: 1, limit: 50 });
  }, [loadProducts]);

  // Debug data fetching and validation
  useEffect(() => {
    const debugData = {
      timestamp: new Date().toISOString(),
      inventoryStore: {
        productsCount: products?.length || 0,
        isLoading: inventoryLoading,
        error: inventoryError?.message || null,
        hasProducts: !!products && products.length > 0
      },
      posStore: {
        searchResultsCount: searchResults?.length || 0,
        searchTerm,
        isSearchingProducts,
        hasSearchResults: !!searchResults && searchResults.length > 0
      },
      localState: {
        cartItemsCount: cartItems.length,
        searchQuery,
        showSearchResults,
        selectedPaymentMethod,
        customerName,
        customerPhone,
        customerEmail,
        hasCartItems: cartItems.length > 0
      },
      dataIntegrity: {
        productsHaveVariants: products?.every(p => p.variants && p.variants.length > 0),
        productsHavePrices: products?.every(p => p.variants?.some(v => v.sellingPrice > 0)),
        productsHaveStock: products?.every(p => p.variants?.some(v => v.quantity >= 0))
      }
    };

    setDebugInfo(debugData);
    
    // Log debugging information
    console.log('🔍 EnhancedPOSComponent Debug Info:', debugData);
    
    // Check for data issues
    if (inventoryLoading) {
      console.log('⏳ EnhancedPOSComponent: Loading products...');
    }
    
    if (inventoryError) {
      console.error('❌ EnhancedPOSComponent: Error loading products:', inventoryError);
    }
    
    if (products && products.length === 0) {
      console.warn('⚠️ EnhancedPOSComponent: No products loaded');
    }
    
    if (products?.some(p => !p.variants || p.variants.length === 0)) {
      console.warn('⚠️ EnhancedPOSComponent: Some products have no variants', products.filter(p => !p.variants || p.variants.length === 0));
    }
    
  }, [products, inventoryLoading, inventoryError, searchResults, searchTerm, isSearchingProducts, cartItems, searchQuery, showSearchResults, selectedPaymentMethod, customerName, customerPhone, customerEmail]);

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
  const handleUpdateCartItem = (itemId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle variant change in cart
  const handleVariantChange = (itemId: string, newVariantId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    // Find the product and new variant
    const product = products.find(p => p.id === item.productId);
    const newVariant = product?.variants.find(v => v.id === newVariantId);
    
    if (product && newVariant) {
      setCartItems(prev => prev.map(cartItem => 
        cartItem.id === itemId 
          ? {
              ...cartItem,
              variantId: newVariant.id,
              variantName: newVariant.name,
              sku: newVariant.sku,
              unitPrice: newVariant.sellingPrice,
              totalPrice: cartItem.quantity * newVariant.sellingPrice,
              availableQuantity: newVariant.quantity
            }
          : cartItem
      ));
    }
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + tax;
    
    return {
      subtotal,
      tax,
      total,
      itemCount: cartItems.length
    };
  }, [cartItems]);

  // Process sale
  const handleProcessSale = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    // Check for insufficient stock
    const insufficientStockItems = cartItems.filter(item => item.quantity > item.availableQuantity);
    if (insufficientStockItems.length > 0) {
      alert(`Insufficient stock for some items. Please check quantities.`);
      return;
    }

    // TODO: Implement actual sale processing
    console.log('Processing sale:', {
      items: cartItems,
      totals: cartTotals,
      paymentMethod: selectedPaymentMethod,
      customer: { name: customerName, phone: customerPhone }
    });

    // Clear cart after successful sale
    handleClearCart();
    alert('Sale completed successfully!');
  };

  // Handle ZenoPay payment completion
  const handlePaymentComplete = async (sale: Sale) => {
    try {
      console.log('ZenoPay payment completed:', sale);
      
      // TODO: Save sale to database
      // TODO: Update inventory
      // TODO: Send receipt
      
      // Clear cart after successful payment
      handleClearCart();
      
      // Clear customer information
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      
      alert('Payment completed successfully! Sale ID: ' + sale.saleNumber);
    } catch (error) {
      console.error('Error completing payment:', error);
      alert('Error completing payment. Please try again.');
    }
  };

  // Get available variants for a cart item
  const getAvailableVariants = (item: CartItem) => {
    const product = products.find(p => p.id === item.productId);
    return product?.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.sellingPrice,
      quantity: variant.quantity,
      attributes: variant.attributes
    })) || [];
  };

  // Convert inventory products to search results format
  const productsAsSearchResults: ProductSearchResult[] = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.categoryId, // TODO: Get actual category name
      brandId: product.brandId,
      brandName: product.brandId, // TODO: Get actual brand name
      variants: product.variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes,
        sellingPrice: variant.sellingPrice,
        quantity: variant.quantity,
        barcode: variant.barcode
      })),
      images: product.images,
      tags: product.tags
    }));
  }, [products]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Panel - Product Search */}
      <div className="flex-1 lg:w-2/3">
        <GlassCard className="h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Product Catalog
            </h2>
            <div className="text-sm text-gray-600">
              {products.length} products available
            </div>
          </div>

          <VariantProductSearch
            products={productsAsSearchResults}
            onAddToCart={handleAddToCart}
            isLoading={inventoryLoading}
            searchTerm={searchQuery}
            onSearchChange={handleSearch}
            showFilters={true}
          />
        </GlassCard>
      </div>

      {/* Right Panel - Cart and Checkout */}
      <div className="lg:w-1/3 space-y-4">
        {/* Shopping Cart */}
        <GlassCard className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              Shopping Cart
            </h2>
            {cartItems.length > 0 && (
              <GlassButton
                size="sm"
                variant="danger"
                onClick={handleClearCart}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </GlassButton>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cartItems.map((item) => (
                <VariantCartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={(quantity) => handleUpdateCartItem(item.id, quantity)}
                  onRemove={() => handleRemoveFromCart(item.id)}
                  onVariantChange={(variantId) => handleVariantChange(item.id, variantId)}
                  availableVariants={getAvailableVariants(item)}
                  showStockInfo={true}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Cart Totals */}
        {cartItems.length > 0 && (
          <GlassCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cartTotals.itemCount} items):</span>
                <span>{format.money(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (16%):</span>
                <span>{format.money(cartTotals.tax)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{format.money(cartTotals.total)}</span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: DollarSign },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'mpesa', label: 'M-Pesa', icon: Receipt },
                  { id: 'bank', label: 'Bank Transfer', icon: Receipt }
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              {/* ZenoPay Payment Button */}
              <ZenoPayPaymentButton
                cartItems={cartItems}
                total={cartTotals.total}
                customer={
                  customerName && customerEmail && customerPhone
                    ? {
                        id: `customer_${Date.now()}`,
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone
                      }
                    : undefined
                }
                onPaymentComplete={handlePaymentComplete}
                disabled={cartItems.length === 0}
                className="w-full"
                size="lg"
              />

              {/* Regular Process Sale Button */}
              <GlassButton
                onClick={handleProcessSale}
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={cartItems.length === 0}
                variant="outline"
              >
                <Receipt className="w-5 h-5" />
                Other Payment Methods - {format.money(cartTotals.total)}
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default EnhancedPOSComponent;
