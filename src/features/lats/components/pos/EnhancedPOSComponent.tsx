import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, DollarSign, CreditCard, Receipt, Trash2, Package, Search, Bug, X, User, UserPlus, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentMethodIcon from '../../../components/PaymentMethodIcon';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePOSStore } from '../../stores/usePOSStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import VariantProductSearch from './VariantProductSearch';
import VariantCartItem from './VariantCartItem';
import ZenoPayPaymentButton from './ZenoPayPaymentButton';
import CustomerSelectionModal from './CustomerSelectionModal';
import { format } from '../../lib/format';
import { ProductSearchResult, ProductSearchVariant, CartItem, Sale } from '../../types/pos';
import { Customer } from '../../../customers/types';
import { useAuth } from '../../../../context/AuthContext';
import { saleProcessingService } from '../../../../lib/saleProcessingService';

const EnhancedPOSComponent: React.FC = () => {
  // Store hooks
  const { 
    products, 
    loadProducts, 
    isLoading: inventoryLoading, 
    error: inventoryError 
  } = useInventoryStore();

  // Smart inventory update function - updates only affected products in memory
  const updateLocalInventory = useCallback((saleItems: any[]) => {
    // Update products state directly without database reload
    const updatedProducts = products.map(product => {
      const productSaleItems = saleItems.filter(item => item.productId === product.id);
      if (productSaleItems.length === 0) return product;

      // Update variants quantities
      const updatedVariants = product.variants?.map(variant => {
        const variantSaleItem = productSaleItems.find(item => item.variantId === variant.id);
        if (!variantSaleItem) return variant;

        return {
          ...variant,
          quantity: Math.max(0, (variant.quantity || 0) - variantSaleItem.quantity)
        };
      });

      return {
        ...product,
        variants: updatedVariants
      };
    });

    // Update the store state directly (this is a temporary workaround)
    useInventoryStore.setState({ products: updatedProducts });
  }, [products]);
  
  const { 
    searchResults, 
    searchTerm, 
    isSearchingProducts,
    searchProducts: posSearchProducts,
    setSearchTerm,
    clearSearchResults
  } = usePOSStore();

  // Auth context
  const { currentUser } = useAuth();

  // Local state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelection, setShowCustomerSelection] = useState(false);
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
    // Clear discount when cart is cleared
    setDiscountValue('');
    setDiscountDescription('');
  };

  // Customer selection handlers
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
  };

  // Discount state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');

  // Calculate cart totals with discount
  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Calculate discount
    let discountAmount = 0;
    if (discountValue && !isNaN(parseFloat(discountValue))) {
      const value = parseFloat(discountValue);
      if (discountType === 'percentage') {
        discountAmount = Math.min((subtotal * value) / 100, subtotal);
      } else {
        discountAmount = Math.min(value, subtotal);
      }
    }
    
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * 0.16; // 16% VAT
    const total = discountedSubtotal + tax;
    
    return {
      subtotal,
      discountAmount,
      discountPercentage: subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
      discountedSubtotal,
      tax,
      total,
      itemCount: cartItems.length
    };
  }, [cartItems, discountType, discountValue]);

  // Process sale
  const handleProcessSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Check for insufficient stock
    const insufficientStockItems = cartItems.filter(item => item.quantity > item.availableQuantity);
    if (insufficientStockItems.length > 0) {
      toast.error(`Insufficient stock for some items. Please check quantities.`);
      return;
    }

    if (!selectedCustomer && !customerName) {
      toast.error('Please select a customer or enter customer name');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      // Import the sale processing service
      const { saleProcessingService } = await import('../../../../lib/saleProcessingService');
      
      // Prepare sale data
      const saleData = {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || customerName || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || customerPhone || undefined,
        customerEmail: selectedCustomer?.email || customerEmail || undefined,
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: 0, // Will be calculated by the service
          profit: 0 // Will be calculated by the service
        })),
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        discount: cartTotals.discountAmount,
        total: cartTotals.total,
        paymentMethod: {
          type: selectedPaymentMethod,
          details: {},
          amount: cartTotals.total
        },
        paymentStatus: 'completed' as const,
        soldBy: currentUser?.name || currentUser?.email || 'POS User',
        soldAt: new Date().toISOString(),
        notes: cartTotals.discountAmount > 0 
          ? `Discount: ${format.money(cartTotals.discountAmount)} (${cartTotals.discountPercentage.toFixed(1)}%)${discountDescription ? ` - ${discountDescription}` : ''}`
          : undefined
      };

      // Process the sale
      const result = await saleProcessingService.processSale(saleData);
      
      if (result.success) {
        // Clear cart after successful sale
        handleClearCart();
        
        // Clear customer information
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        
        // Show success message
        toast.success(`Sale completed! Sale #${result.sale?.saleNumber}`);
        
        // Reload products to update stock
        await loadProducts();
        
      } else {
        toast.error(result.error || 'Failed to process sale');
      }
      
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale. Please try again.');
    }
  };

  // Handle ZenoPay payment completion
  const handlePaymentComplete = async (sale: Sale) => {
    try {
      console.log('ZenoPay payment completed:', sale);
      
      // Process the sale using the service
      const result = await saleProcessingService.processSale({
        customerId: sale.customerId,
        customerName: sale.customerName || 'Walk-in Customer',
        customerPhone: sale.customerPhone || undefined,
        customerEmail: sale.customerEmail || undefined,
        items: sale.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: item.costPrice || 0,
          profit: item.profit || 0
        })),
        subtotal: sale.subtotal,
        tax: sale.tax || 0,
        discount: sale.discount || 0,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        paymentStatus: 'completed' as const,
        soldBy: sale.soldBy || 'POS User',
        soldAt: sale.soldAt,
        notes: sale.notes
      });
      
      if (result.success) {
        // Clear cart after successful payment
        handleClearCart();
        
        // Clear customer information
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        
        // Show success message
        toast.success(`Payment completed! Sale #${result.sale?.saleNumber}`);
        
        // Smart inventory update - update only affected products in memory
        updateLocalInventory(sale.items);
        
      } else {
        toast.error(result.error || 'Failed to process payment');
      }
      
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Error completing payment. Please try again.');
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
              {cartTotals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{format.money(cartTotals.discountAmount)}</span>
                </div>
              )}
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
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Customer Information
                </label>
                <GlassButton
                  onClick={() => setShowCustomerSelection(true)}
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Select Customer
                </GlassButton>
              </div>
              
              {selectedCustomer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{selectedCustomer.name}</h4>
                        <p className="text-xs text-gray-600">
                          {selectedCustomer.phone && `${selectedCustomer.phone} • `}
                          {selectedCustomer.loyaltyLevel} • {format.money(selectedCustomer.totalSpent || 0)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCustomer}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <User className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">No customer selected</p>
                </div>
              )}
              
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

            {/* Discount Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-green-600" />
                Discount
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`p-2 border rounded-lg text-sm transition-colors ${
                    discountType === 'percentage'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Percent className="w-3 h-3 mx-auto mb-1" />
                  Percentage
                </button>
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`p-2 border rounded-lg text-sm transition-colors ${
                    discountType === 'fixed'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <DollarSign className="w-3 h-3 mx-auto mb-1" />
                  Fixed Amount
                </button>
                <button
                  onClick={() => {
                    setDiscountValue('');
                    setDiscountDescription('');
                  }}
                  className="p-2 border border-gray-300 rounded-lg text-sm hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="w-3 h-3 mx-auto mb-1" />
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  step={discountType === 'percentage' ? '0.1' : '1'}
                />
                <input
                  type="text"
                  value={discountDescription}
                  onChange={(e) => setDiscountDescription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Discount reason"
                />
              </div>
              {cartTotals.discountAmount > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Discount Applied:</strong> {format.money(cartTotals.discountAmount)} 
                    ({cartTotals.discountPercentage.toFixed(1)}%)
                  </div>
                  {discountDescription && (
                    <div className="text-xs text-green-600 mt-1">
                      Reason: {discountDescription}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash', type: 'cash' },
                  { id: 'card', label: 'Card', type: 'credit_card' },
                  { id: 'mpesa', label: 'M-Pesa', type: 'mobile_money' },
                  { id: 'bank', label: 'Bank Transfer', type: 'bank_transfer' }
                ].map((method) => {
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-105 ${
                        selectedPaymentMethod === method.id
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                      }`}
                    >
                      <PaymentMethodIcon type={method.type} name={method.label} size="sm" />
                      <span className={`text-sm font-semibold ${selectedPaymentMethod === method.id ? 'text-blue-800' : 'text-gray-700'}`}>{method.label}</span>
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
                disabled={cartItems.length === 0 || !selectedCustomer}
                className="w-full"
                size="lg"
              />

              {/* Regular Process Sale Button */}
              <GlassButton
                onClick={handleProcessSale}
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={cartItems.length === 0 || !selectedCustomer}
                variant="outline"
                title={!selectedCustomer ? "Please select a customer first" : cartItems.length === 0 ? "Add items to cart first" : "Process payment"}
              >
                <Receipt className="w-5 h-5" />
                Other Payment Methods - {format.money(cartTotals.total)}
              </GlassButton>
            </div>
          </GlassCard>
        )}

        {/* Customer Selection Modal */}
        <CustomerSelectionModal
          isOpen={showCustomerSelection}
          onClose={() => setShowCustomerSelection(false)}
          onCustomerSelect={handleCustomerSelect}
          selectedCustomer={selectedCustomer}
        />
      </div>
    </div>
  );
};

export default EnhancedPOSComponent;
