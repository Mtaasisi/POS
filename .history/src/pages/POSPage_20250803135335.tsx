import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Search, 
  ShoppingCart, 
  User, 
  CreditCard, 
  Truck, 
  Plus,
  X,
  Receipt,
  Save,
  RotateCcw,
  Scan,
  Package,
  Calculator,
  Clock,
  MapPin,
  Zap,
  Keyboard,
  QrCode,
  DollarSign,
  Percent
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isExternal?: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: 'retail' | 'wholesale';
}

const POSPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'payment'>('products');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);

  // Sample products for demonstration
  const sampleProducts = [
    { id: '1', name: 'iPhone 13 Pro', price: 450000, stock: 5, sku: 'IP13P', category: 'phones' },
    { id: '2', name: 'Samsung Galaxy S21', price: 380000, stock: 3, sku: 'SGS21', category: 'phones' },
    { id: '3', name: 'MacBook Air M1', price: 850000, stock: 2, sku: 'MBA1', category: 'laptops' },
    { id: '4', name: 'AirPods Pro', price: 120000, stock: 8, sku: 'APP', category: 'accessories' },
    { id: '5', name: 'iPad Air', price: 320000, stock: 4, sku: 'IPA', category: 'tablets' },
    { id: '6', name: 'Apple Watch Series 7', price: 180000, stock: 6, sku: 'AWS7', category: 'watches' },
    { id: '7', name: 'Samsung Galaxy Tab S7', price: 280000, stock: 3, sku: 'SGTS7', category: 'tablets' },
    { id: '8', name: 'MacBook Pro M1', price: 1200000, stock: 1, sku: 'MBP1', category: 'laptops' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus search on Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Quick payment shortcuts
      if (e.key === '1' && e.ctrlKey) {
        setPaymentMethod('cash');
      }
      if (e.key === '2' && e.ctrlKey) {
        setPaymentMethod('card');
      }
      if (e.key === '3' && e.ctrlKey) {
        setPaymentMethod('transfer');
      }
      
      // Process sale on Enter
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        processSale();
      }
      
      // Clear cart on Ctrl+X
      if (e.key === 'x' && e.ctrlKey) {
        e.preventDefault();
        clearCart();
      }
      
      // Focus amount paid on Ctrl+A
      if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
        amountPaidRef.current?.focus();
      }
      
      // Toggle customer type on Ctrl+T
      if (e.key === 't' && e.ctrlKey) {
        e.preventDefault();
        setCustomerType(customerType === 'retail' ? 'wholesale' : 'retail');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [customerType]);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = subtotal * (discountPercentage / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * 0.16;
    const shipping = deliveryMethod === 'pickup' ? 0 : 500;
    const total = afterDiscount + tax + shipping;
    const balance = total - amountPaid;

    return {
      subtotal,
      discount,
      afterDiscount,
      tax,
      shipping,
      total,
      balance
    };
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        variant: product.variant,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
    
    // Add to recent products
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 5);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const quickAddQuantity = (itemId: string, quantity: number) => {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + quantity);
    }
  };

  const processSale = () => {
    console.log('Processing sale:', {
      cart,
      customer: selectedCustomer,
      paymentMethod,
      amountPaid,
      deliveryMethod,
      totals: calculateTotals()
    });
    
    // Clear cart after successful sale
    clearCart();
  };

  const holdOrder = () => {
    console.log('Holding order');
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
    setDiscountPercentage(0);
  };

  const simulateBarcodeScan = () => {
    setIsScanning(true);
    const barcodes = ['IP13P', 'SGS21', 'MBA1', 'APP', 'IPA', 'AWS7'];
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
    
    setTimeout(() => {
      const product = sampleProducts.find(p => p.sku === randomBarcode);
      if (product) {
        addToCart(product);
        setSearchQuery(randomBarcode);
      }
      setIsScanning(false);
    }, 1000);
  };

  const quickCustomerAdd = () => {
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: 'Walk-in Customer',
      type: customerType
    };
    setSelectedCustomer(newCustomer);
  };

  const quickPayment = (amount: number) => {
    setAmountPaid(amount);
  };

  const filteredProducts = sampleProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600">Process sales and manage transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Time</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Cart Items</p>
                <p className="font-semibold text-gray-900">{cart.length}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                <Zap size={16} />
                Quick Actions
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by name, SKU, or scan barcode... (Ctrl+F to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <GlassButton 
                  variant="outline" 
                  size="sm"
                  onClick={simulateBarcodeScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Scan size={16} />
                  )}
                </GlassButton>
                <GlassButton variant="secondary" size="sm">
                  <Plus size={16} />
                </GlassButton>
              </div>
            </div>

            {/* Quick Actions Panel */}
            {showQuickActions && (
              <GlassCard className="bg-white/90">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={quickCustomerAdd}
                  >
                    <User size={16} />
                    Quick Customer
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <DollarSign size={16} />
                    Cash Payment
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setDeliveryMethod('pickup')}
                  >
                    <MapPin size={16} />
                    Pickup
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                  >
                    <RotateCcw size={16} />
                    Clear Cart
                  </GlassButton>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Keyboard Shortcuts:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Ctrl+F: Focus Search</span>
                    <span>Ctrl+1: Cash Payment</span>
                    <span>Ctrl+2: Card Payment</span>
                    <span>Ctrl+3: Transfer</span>
                    <span>Ctrl+Enter: Process Sale</span>
                    <span>Ctrl+X: Clear Cart</span>
                    <span>Ctrl+A: Focus Amount</span>
                    <span>Ctrl+T: Toggle Customer Type</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'products'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={16} />
                  Products
                </div>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'customers'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User size={16} />
                  Customers
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'payment'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={16} />
                  Payment
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Recent Products */}
                  {recentProducts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Products</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {recentProducts.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => addToCart(product)}
                          >
                            <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                            <p className="text-lg font-bold text-blue-600">₦{product.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {searchQuery ? `Search Results (${filteredProducts.length})` : 'All Products'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {product.stock} in stock
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">₦{product.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500 mb-3">{product.sku}</p>
                          <div className="flex items-center gap-2">
                            <GlassButton variant="primary" size="sm" className="flex-1">
                              <Plus size={14} />
                              Add to Cart
                            </GlassButton>
                            <GlassButton
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                quickAddQuantity(product.id, 1);
                              }}
                            >
                              +1
                            </GlassButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomerType('retail')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            customerType === 'retail'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                          }`}
                        >
                          Retail
                        </button>
                        <button
                          onClick={() => setCustomerType('wholesale')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            customerType === 'wholesale'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                          }`}
                        >
                          Wholesale
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Customer
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search by name, phone, or email..."
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <GlassButton variant="outline">
                          <Plus size={16} />
                        </GlassButton>
                      </div>
                    </div>

                    {selectedCustomer && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                          </div>
                          <GlassButton variant="danger" size="sm">
                            <X size={14} />
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                      <div className="space-y-3">
                        {['cash', 'card', 'transfer', 'installment', 'payment_on_delivery'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              paymentMethod === method
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                              {paymentMethod === method && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Method
                          </label>
                          <select
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pickup">Pickup</option>
                            <option value="local_transport">Local Transport</option>
                            <option value="air_cargo">Air Cargo</option>
                            <option value="bus_cargo">Bus Cargo</option>
                          </select>
                        </div>

                        {deliveryMethod !== 'pickup' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Address
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter delivery address"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={deliveryCity}
                                onChange={(e) => setDeliveryCity(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter city"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Notes
                          </label>
                          <textarea
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Any special delivery instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart & Summary */}
          <div className="col-span-4 space-y-6">
            {/* Cart */}
            <GlassCard className="bg-white/90">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </h2>
                <GlassButton 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <X size={16} />
                  Clear
                </GlassButton>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-sm">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600">{item.variant}</p>
                          )}
                        </div>
                        <GlassButton
                          variant="danger"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X size={12} />
                        </GlassButton>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </GlassButton>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </GlassButton>
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => quickAddQuantity(item.id, 5)}
                          >
                            +5
                          </GlassButton>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">₦{item.unitPrice.toLocaleString()}</p>
                          <p className="font-semibold text-gray-900">₦{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Order Summary */}
            <GlassCard className="bg-white/90">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₦{totals.subtotal.toLocaleString()}</span>
                </div>
                
                {/* Discount */}
                <div className="flex items-center gap-2">
                  <span className="text-sm">Discount:</span>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-16 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <span className="text-sm">%</span>
                  <span className="text-sm text-gray-600">(-₦{totals.discount.toLocaleString()})</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>After Discount:</span>
                  <span>₦{totals.afterDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>₦{totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>₦{totals.shipping.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₦{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quick Payment Buttons */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => quickPayment(totals.total)}
                >
                  Full
                </GlassButton>
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => quickPayment(totals.total * 0.5)}
                >
                  Half
                </GlassButton>
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => quickPayment(0)}
                >
                  Zero
                </GlassButton>
              </div>

              {/* Amount Paid */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <input
                  ref={amountPaidRef}
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  placeholder="0.00"
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className={totals.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    ₦{totals.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <GlassButton
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={processSale}
                  disabled={cart.length === 0}
                >
                  <Receipt size={18} />
                  Process Sale (Ctrl+Enter)
                </GlassButton>
                
                <div className="grid grid-cols-2 gap-3">
                  <GlassButton
                    variant="warning"
                    size="md"
                    onClick={holdOrder}
                    disabled={cart.length === 0}
                  >
                    <Save size={16} />
                    Hold Order
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    size="md"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    <RotateCcw size={16} />
                    Cancel (Ctrl+X)
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Always Visible */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-3">
          {/* Main Action Button */}
          <GlassButton
            variant="success"
            size="lg"
            onClick={processSale}
            disabled={cart.length === 0}
            className="shadow-2xl"
          >
            <Receipt size={20} />
            <span className="hidden sm:inline">Process Sale</span>
            <span className="sm:hidden">Sale</span>
          </GlassButton>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => searchInputRef.current?.focus()}
              className="shadow-xl"
            >
              <Search size={16} />
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              size="md"
              onClick={simulateBarcodeScan}
              disabled={isScanning}
              className="shadow-xl"
            >
              {isScanning ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Scan size={16} />
              )}
            </GlassButton>

            <GlassButton
              variant="warning"
              size="md"
              onClick={holdOrder}
              disabled={cart.length === 0}
              className="shadow-xl"
            >
              <Save size={16} />
            </GlassButton>

            <GlassButton
              variant="danger"
              size="md"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="shadow-xl"
            >
              <X size={16} />
            </GlassButton>
          </div>

          {/* Payment Quick Actions */}
          <div className="flex gap-2">
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setPaymentMethod('cash')}
              className="shadow-lg bg-white/90"
            >
              Cash
            </GlassButton>
            
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setPaymentMethod('card')}
              className="shadow-lg bg-white/90"
            >
              Card
            </GlassButton>
            
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => setPaymentMethod('transfer')}
              className="shadow-lg bg-white/90"
            >
              Transfer
            </GlassButton>
          </div>

          {/* Customer Type Toggle */}
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setCustomerType(customerType === 'retail' ? 'wholesale' : 'retail')}
            className="shadow-lg bg-white/90"
          >
            {customerType === 'retail' ? 'Retail' : 'Wholesale'}
          </GlassButton>
        </div>
      </div>

      {/* Fixed Cart Summary - Always Visible */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="bg-white/95 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-gray-200/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              ₦{totals.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {cart.length} items
            </div>
            {totals.balance !== 0 && (
              <div className={`text-sm font-semibold mt-1 ${
                totals.balance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {totals.balance > 0 ? 'Balance: ' : 'Change: '}
                ₦{Math.abs(totals.balance).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Search Bar - Always Visible */}
      <div className="fixed top-20 right-6 z-40">
        <div className="bg-white/95 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-gray-200/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <GlassButton
              variant="outline"
              size="sm"
              onClick={simulateBarcodeScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              ) : (
                <Scan size={14} />
              )}
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Fixed Customer Info - Always Visible */}
      {selectedCustomer && (
        <div className="fixed top-20 left-6 z-40">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-gray-200/50">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {selectedCustomer.name}
              </div>
              <div className="text-xs text-gray-600">
                {selectedCustomer.type}
              </div>
              {selectedCustomer.phone && (
                <div className="text-xs text-gray-500">
                  {selectedCustomer.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage; 