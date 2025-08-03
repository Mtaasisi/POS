import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useTheme } from '../context/ThemeContext';
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
  Sparkles,
  TrendingUp,
  Zap,
  Star
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
  const { theme, isDark } = useTheme();
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16;
    const shipping = deliveryMethod === 'pickup' ? 0 : 500;
    const total = subtotal + tax + shipping;
    const balance = total - amountPaid;

    return {
      subtotal,
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

  const processSale = async () => {
    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Processing sale:', {
      cart,
      customer: selectedCustomer,
      paymentMethod,
      amountPaid,
      deliveryMethod,
      totals: calculateTotals()
    });
    setIsProcessing(false);
    // Clear cart after successful sale
    setCart([]);
    setAmountPaid(0);
  };

  const holdOrder = () => {
    console.log('Holding order');
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 transition-all duration-500">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-gray-200/50 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <ShoppingCart className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Process sales and manage transactions</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Time</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    {currentTime.toLocaleTimeString()}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cart Items</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{cart.length}</p>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ₦{totals.total.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Enhanced Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-24 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                  <GlassButton variant="outline" size="sm" className="hover:scale-105 transition-transform">
                    <Scan size={16} />
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm" className="hover:scale-105 transition-transform">
                    <Plus size={16} />
                  </GlassButton>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-1 backdrop-blur-sm">
              {[
                { id: 'products', label: 'Products', icon: Package },
                { id: 'customers', label: 'Customers', icon: User },
                { id: 'payment', label: 'Payment', icon: CreditCard }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-blue-600 dark:text-blue-400 scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-102'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <tab.icon size={16} />
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Enhanced Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Enhanced Sample Products */}
                  {[
                    { id: '1', name: 'iPhone 13 Pro', price: 450000, stock: 5, category: 'Phones', rating: 4.8 },
                    { id: '2', name: 'Samsung Galaxy S21', price: 380000, stock: 3, category: 'Phones', rating: 4.6 },
                    { id: '3', name: 'MacBook Air M1', price: 850000, stock: 2, category: 'Laptops', rating: 4.9 },
                    { id: '4', name: 'AirPods Pro', price: 120000, stock: 8, category: 'Accessories', rating: 4.7 },
                    { id: '5', name: 'iPad Air', price: 320000, stock: 4, category: 'Tablets', rating: 4.8 },
                    { id: '6', name: 'Apple Watch Series 7', price: 180000, stock: 6, category: 'Wearables', rating: 4.5 },
                  ].map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
                      onClick={() => addToCart(product)}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{product.rating}</span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ₦{product.price.toLocaleString()}
                          </p>
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                            {product.stock} in stock
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <GlassButton variant="primary" size="sm" className="flex-1 group-hover:scale-105 transition-transform">
                            <Plus size={14} />
                            Add to Cart
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Customer Type
                      </label>
                      <div className="flex gap-3">
                        {[
                          { id: 'retail', label: 'Retail', icon: User },
                          { id: 'wholesale', label: 'Wholesale', icon: TrendingUp }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setCustomerType(type.id as 'retail' | 'wholesale')}
                            className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 border-2 ${
                              customerType === type.id
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 scale-105'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <type.icon size={16} />
                              {type.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Search Customer
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Search by name, phone, or email..."
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 dark:text-white"
                        />
                        <GlassButton variant="outline" className="hover:scale-105 transition-transform">
                          <Plus size={16} />
                        </GlassButton>
                      </div>
                    </div>

                    {selectedCustomer && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.phone}</p>
                          </div>
                          <GlassButton variant="danger" size="sm" className="hover:scale-105 transition-transform">
                            <X size={14} />
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard size={20} />
                        Payment Method
                      </h3>
                      <div className="space-y-3">
                        {[
                          { id: 'cash', label: 'Cash', icon: Receipt },
                          { id: 'card', label: 'Card', icon: CreditCard },
                          { id: 'transfer', label: 'Transfer', icon: TrendingUp },
                          { id: 'installment', label: 'Installment', icon: Clock },
                          { id: 'payment_on_delivery', label: 'Payment on Delivery', icon: Truck }
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-102 ${
                              paymentMethod === method.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <method.icon size={18} className="text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {method.label}
                                </span>
                              </div>
                              {paymentMethod === method.id && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Truck size={20} />
                        Delivery Options
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Delivery Method
                          </label>
                          <select
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 dark:text-white"
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Delivery Address
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 dark:text-white"
                                placeholder="Enter delivery address"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={deliveryCity}
                                onChange={(e) => setDeliveryCity(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 dark:text-white"
                                placeholder="Enter city"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Delivery Notes
                          </label>
                          <textarea
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 dark:text-white"
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

          {/* Right Side - Enhanced Cart & Summary */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Enhanced Cart */}
            <GlassCard className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </h2>
                <GlassButton 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="hover:scale-105 transition-transform"
                >
                  <X size={16} />
                  Clear
                </GlassButton>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="relative">
                    <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  </div>
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-sm">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50 animate-in slide-in-from-right-2"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.variant}</p>
                          )}
                        </div>
                        <GlassButton
                          variant="danger"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="hover:scale-105 transition-transform"
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
                            className="hover:scale-105 transition-transform"
                          >
                            -
                          </GlassButton>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                          <GlassButton
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="hover:scale-105 transition-transform"
                          >
                            +
                          </GlassButton>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">₦{item.unitPrice.toLocaleString()}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">₦{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Enhanced Order Summary */}
            <GlassCard className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Order Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">₦{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
                  <span className="text-gray-900 dark:text-white">₦{totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                  <span className="text-gray-900 dark:text-white">₦{totals.shipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">₦{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Amount Paid */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold bg-white/80 dark:bg-gray-700/80 dark:text-white"
                  placeholder="0.00"
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                  <span className={`font-semibold ${totals.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ₦{totals.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="mt-6 space-y-3">
                <GlassButton
                  variant="success"
                  size="lg"
                  className="w-full hover:scale-105 transition-transform"
                  onClick={processSale}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Receipt size={18} />
                      Process Sale
                    </>
                  )}
                </GlassButton>
                
                <div className="grid grid-cols-2 gap-3">
                  <GlassButton
                    variant="warning"
                    size="md"
                    onClick={holdOrder}
                    disabled={cart.length === 0}
                    className="hover:scale-105 transition-transform"
                  >
                    <Save size={16} />
                    Hold Order
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    size="md"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="hover:scale-105 transition-transform"
                  >
                    <RotateCcw size={16} />
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPage; 