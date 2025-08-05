import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle,
  Circle,
  HelpCircle
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
  loyalty?: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalSpent: number;
    joinDate: string | null;
    lastVisit: string | null;
    rewardsRedeemed: number;
    isLoyaltyMember: boolean;
  };
}

const POSPageModern: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentStep, setCurrentStep] = useState<'products' | 'customer' | 'payment' | 'complete'>('products');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock data for demo
  const products = [
    { id: '1', name: 'iPhone 13', price: 1500000, stock: 5 },
    { id: '2', name: 'Samsung Galaxy', price: 1200000, stock: 3 },
    { id: '3', name: 'MacBook Pro', price: 2500000, stock: 2 },
  ];

  const customers = [
    { id: '1', name: 'John Doe', phone: '+255123456789', loyalty: { points: 150, tier: 'gold' as const, isLoyaltyMember: true } },
    { id: '2', name: 'Jane Smith', phone: '+255987654321', loyalty: { points: 75, tier: 'silver' as const, isLoyaltyMember: true } },
  ];

  const paymentAccounts = [
    { id: '1', name: 'Cash', balance: 500000, type: 'cash' as const },
    { id: '2', name: 'Card', balance: 1000000, type: 'credit_card' as const },
  ];

  // Functions
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
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
    addNotification('success', 'Product Added', `${product.name} added to cart`);
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

  const clearCart = () => {
    setCart([]);
    addNotification('info', 'Cart Cleared', 'Shopping cart has been cleared');
  };

  const processSale = () => {
    if (cart.length === 0) {
      addNotification('warning', 'Empty Cart', 'Please add items to cart before proceeding');
      return;
    }
    if (!selectedCustomer) {
      addNotification('warning', 'No Customer Selected', 'Please select a customer before proceeding');
      return;
    }
    addNotification('success', 'Sale Completed', 'Transaction processed successfully!');
    setCart([]);
    setSelectedCustomer(null);
    setCurrentStep('products');
  };

  const holdOrder = () => {
    addNotification('warning', 'Order Held', 'Order has been placed on hold');
  };

  const printReceipt = () => {
    addNotification('success', 'Receipt Printed', 'Receipt has been sent to printer');
  };

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setShowCustomerSearch(false);
    addNotification('success', 'Customer Selected', `${customer.name} selected`);
  };

  const removeSelectedCustomer = () => {
    setSelectedCustomer(null);
    addNotification('info', 'Customer Removed', 'Customer selection cleared');
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    if (query.length >= 2) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(query.toLowerCase()))
      );
      setCustomerSearchResults(filtered);
      setShowCustomerSearch(true);
    } else {
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
    }
  };

  const addNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    const shipping = 0;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const totals = calculateTotals();
  const customerSearchResults = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.toLowerCase().includes(customerSearchQuery.toLowerCase()))
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        switch(e.key) {
          case 'Enter':
            if (cart.length > 0) processSale();
            break;
          case 'h':
            if (cart.length > 0) holdOrder();
            break;
          case 'c':
            if (cart.length > 0) clearCart();
            break;
          case 'p':
            if (cart.length > 0) printReceipt();
            break;
          case '1':
            setCurrentStep('products');
            break;
          case '2':
            setCurrentStep('customer');
            break;
          case '3':
            if (selectedCustomer && cart.length > 0) setCurrentStep('payment');
            break;
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cart.length, selectedCustomer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header with Stepper */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package size={16} className="text-blue-600" />
                <span>Modern POS System</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlassButton variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <X size={16} />
                <span className="hidden sm:inline">Exit</span>
              </GlassButton>
            </div>
          </div>

          {/* Modern Stepper */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {[
                { key: 'products', label: 'Products', icon: Package },
                { key: 'customer', label: 'Customer', icon: User },
                { key: 'payment', label: 'Payment', icon: CreditCard },
                { key: 'complete', label: 'Complete', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.key;
                const isCompleted = 
                  (step.key === 'products' && cart.length > 0) ||
                  (step.key === 'customer' && selectedCustomer) ||
                  (step.key === 'payment' && false) ||
                  (step.key === 'complete' && false);

                return (
                  <div key={step.key} className="flex items-center">
                    <button
                      onClick={() => {
                        if (step.key === 'products' || 
                            (step.key === 'customer' && cart.length > 0) ||
                            (step.key === 'payment' && selectedCustomer && cart.length > 0)) {
                          setCurrentStep(step.key as any);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                      <span className="font-medium">{step.label}</span>
                    </button>
                    {index < 3 && (
                      <div className={`w-8 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-300' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Products */}
          <div className="col-span-5 space-y-4">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                <div className="flex items-center gap-2">
                  <GlassButton variant="outline" size="sm">
                    <RotateCcw size={14} />
                  </GlassButton>
                  <GlassButton variant="outline" size="sm">
                    <Search size={14} />
                  </GlassButton>
                </div>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="🔍 Search products, scan barcode, or say 'add iPhone 13'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Products Grid */}
              <div className="h-[calc(100vh-400px)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <GlassCard
                      key={product.id}
                      className="hover:shadow-lg transition-all cursor-pointer group p-4"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 3 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} in stock
                        </span>
                      </div>
                      
                      <p className="text-lg font-bold text-blue-600 mb-2">Tsh{product.price.toLocaleString()}</p>

                      <GlassButton 
                        variant="primary" 
                        size="sm" 
                        className="w-full group-hover:scale-105 transition-transform"
                      >
                        <Plus size={14} />
                        Add to Cart
                      </GlassButton>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Center Panel - Cart */}
          <div className="col-span-4 space-y-4">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                <div className="space-y-3 h-[calc(100vh-400px)] overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`bg-gray-50 rounded-lg p-3 ${editingCartIndex === idx ? 'ring-2 ring-blue-400' : ''}`}
                      tabIndex={0}
                      onClick={() => setEditingCartIndex(idx)}
                    >
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
                          {editingCartIndex === idx ? (
                            <input
                              type="number"
                              className="w-12 text-center font-medium border border-blue-400 rounded"
                              value={item.quantity}
                              autoFocus
                              min={1}
                              onChange={e => updateQuantity(item.id, Number(e.target.value))}
                              onBlur={() => setEditingCartIndex(null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === 'Escape') setEditingCartIndex(null);
                              }}
                            />
                          ) : (
                            <span
                              className="w-8 text-center font-medium cursor-pointer hover:bg-blue-100 rounded"
                              tabIndex={0}
                              onClick={() => setEditingCartIndex(idx)}
                            >
                              {item.quantity}
                            </span>
                          )}
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </GlassButton>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tsh{item.unitPrice.toLocaleString()}</p>
                          <p className="font-semibold text-gray-900">Tsh{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Panel - Customer & Payment */}
          <div className="col-span-3 space-y-4">
            {/* Customer Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
                <GlassButton variant="outline" size="sm">
                  <User size={14} />
                </GlassButton>
              </div>

              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                    <GlassButton 
                      variant="danger" 
                      size="sm"
                      onClick={removeSelectedCustomer}
                    >
                      <X size={14} />
                    </GlassButton>
                  </div>
                  
                  {selectedCustomer.loyalty?.isLoyaltyMember && (
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                      <CheckCircle size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        {selectedCustomer.loyalty.tier.toUpperCase()} - {selectedCustomer.loyalty.points} points
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showCustomerSearch && customerSearchResults.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </div>
                          {customer.loyalty?.isLoyaltyMember && (
                            <CheckCircle size={14} className="text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Payment Section */}
            {selectedCustomer && cart.length > 0 && (
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
                  <span className="text-sm text-gray-500">Step 3 of 4</span>
                </div>

                <div className="space-y-4">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentAccounts.map((account) => (
                        <button
                          key={account.id}
                          className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
                        >
                          <div className="text-center">
                            <span className="font-medium text-gray-900 text-sm block">{account.name}</span>
                            <p className="text-xs text-gray-500">${account.balance.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Tsh{totals.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (16%):</span>
                        <span>Tsh{totals.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>Tsh{totals.shipping.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>Tsh{totals.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GlassButton
                variant="warning"
                size="lg"
                onClick={holdOrder}
                disabled={cart.length === 0}
              >
                <Save size={20} />
                Hold Order
              </GlassButton>
              
              <GlassButton
                variant="outline"
                size="lg"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                <RotateCcw size={20} />
                Clear Cart
              </GlassButton>
            </div>

            <div className="flex items-center gap-3">
              <GlassButton
                variant="outline"
                size="lg"
                onClick={printReceipt}
                disabled={cart.length === 0}
              >
                <Receipt size={20} />
                Print
              </GlassButton>
              
              <GlassButton
                variant="success"
                size="lg"
                onClick={processSale}
                disabled={cart.length === 0 || !selectedCustomer}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Receipt size={24} />
                Process Sale
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Shortcuts Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <GlassButton
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => setShowShortcuts(true)}
          aria-label="Show Keyboard Shortcuts"
        >
          <HelpCircle size={28} />
        </GlassButton>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowShortcuts(false)}
              aria-label="Close Shortcuts"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle size={24} /> Keyboard Shortcuts & Quick Actions
            </h2>
            <ul className="space-y-2 text-lg">
              <li><b>Ctrl+1</b>: Products tab</li>
              <li><b>Ctrl+2</b>: Customers tab</li>
              <li><b>Ctrl+3</b>: Payment tab</li>
              <li><b>Ctrl+Enter</b>: Process Sale</li>
              <li><b>Ctrl+H</b>: Hold Order</li>
              <li><b>Ctrl+C</b>: Clear Cart</li>
              <li><b>Ctrl+P</b>: Print Receipt</li>
              <li><b>F1</b>: Show this help</li>
              <li><b>Esc</b>: Exit POS</li>
            </ul>
            <div className="mt-6 text-sm text-gray-500">Tip: You can use these shortcuts anywhere in the POS for super-fast sales!</div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm opacity-90">{notification.message}</div>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="ml-4 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default POSPageModern; 