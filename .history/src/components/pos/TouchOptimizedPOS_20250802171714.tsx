import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../context/CustomersContext';
import { 
  CartItem, 
  Customer, 
  CustomerType, 
  PaymentMethod, 
  DeliveryMethod,
  Product,
  ProductVariant
} from '../types';
import { 
  createSaleOrder, 
  searchProductsForPOS, 
  getProductPrice,
  getPOSStats
} from '../lib/posApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Modal from '../components/ui/Modal';
import AddCustomerModal from '../components/forms/AddCustomerModal';
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import {
  ShoppingCart,
  Users,
  Search,
  Plus,
  Trash2,
  Receipt,
  CreditCard,
  Truck,
  DollarSign,
  Package,
  User,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Zap,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Save,
  X,
  Minus,
  ShoppingBag,
  Tag,
  Percent,
  Calculator,
  Printer,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Crown,
  Shield,
  Gift,
  Award,
  Target,
  Activity,
  TrendingDown,
  DollarSign as DollarSignIcon,
  Package as PackageIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  QrCode,
  Barcode
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TouchOptimizedPOS: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, refreshCustomers } = useCustomers();
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType>('retail');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // UI State
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showExternalProduct, setShowExternalProduct] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [posStats, setPosStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    todaySales: 0,
    todayOrders: 0
  });

  // Touch-specific state
  const [activeTab, setActiveTab] = useState<'search' | 'cart' | 'customer' | 'payment'>('search');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [scanningMode, setScanningMode] = useState(false);

  // Load initial data
  useEffect(() => {
    loadPOSStats();
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    try {
      if (customers.length === 0) {
        await refreshCustomers();
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const initialProducts = await searchProductsForPOS('');
      setSearchResults(initialProducts.slice(0, 20)); // Show more products for touch
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadPOSStats = async () => {
    try {
      const stats = await getPOSStats();
      setPosStats(stats);
    } catch (error) {
      console.error('Error loading POS stats:', error);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);
  const finalAmount = subtotal - discountAmount + taxAmount + shippingCost;
  const balanceDue = finalAmount - amountPaid;

  // Search products
  const handleSearch = useCallback(async (query: string) => {
    try {
      const products = await searchProductsForPOS(query);
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
    }
  }, []);

  // Search customers
  const handleCustomerSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
      return;
    }

    if (customers.length === 0) {
      try {
        await refreshCustomers();
      } catch (error) {
        console.error('Failed to refresh customers:', error);
        toast.error('Failed to load customers');
        return;
      }
    }

    try {
      const filteredCustomers = customers.filter(customer => {
        const name = customer.name || '';
        const phone = customer.phone || '';
        const email = customer.email || '';
        
        const nameMatch = name.toLowerCase().includes(query.toLowerCase());
        const phoneMatch = phone.includes(query);
        const emailMatch = email.toLowerCase().includes(query.toLowerCase());
        
        return nameMatch || phoneMatch || emailMatch;
      });
      setCustomerSearchResults(filteredCustomers);
      setShowCustomerSearch(true);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
    }
  }, [customers, refreshCustomers]);

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerSearch(false);
    setCustomerSearchResults([]);
    setActiveTab('cart'); // Auto-switch to cart after customer selection
  };

  // Add item to cart
  const addToCart = async (product: Product, variant: ProductVariant) => {
    try {
      const price = await getProductPrice(product.id, variant.id, customerType);
      
      const cartItem: CartItem = {
        id: `${product.id}-${variant.id}-${Date.now()}`,
        product_id: product.id,
        variant_id: variant.id,
        name: `${product.name} - ${variant.variant_name}`,
        description: product.description,
        quantity: 1,
        unit_price: price,
        unit_cost: variant.cost_price,
        item_total: price,
        is_external_product: false,
        product,
        variant
      };

      setCart(prev => [...prev, cartItem]);
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('cart'); // Auto-switch to cart
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, item_total: item.unit_price * newQuantity }
        : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid(0);
    setDiscountAmount(0);
    setTaxAmount(0);
    setShippingCost(0);
    setDeliveryAddress('');
    setDeliveryCity('');
    setDeliveryNotes('');
  };

  // Process sale
  const processSale = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer_id: selectedCustomer.id,
        customer_type: customerType,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_method: deliveryMethod,
        delivery_notes: deliveryNotes,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        shipping_cost: shippingCost,
        items: cart,
        created_by: currentUser.id
      };

      const order = await createSaleOrder(orderData);
      setCurrentOrder(order);
      setShowReceipt(true);
      clearCart();
      await loadPOSStats();
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Scan Barcode', icon: Barcode, action: () => setScanningMode(true) },
    { label: 'Add Customer', icon: User, action: () => setShowAddCustomer(true) },
    { label: 'External Product', icon: Gift, action: () => setShowExternalProduct(true) },
    { label: 'Clear Cart', icon: Trash2, action: clearCart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Touch-Optimized Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">POS System</h1>
              <p className="text-gray-600 text-lg">Touch-Optimized Interface</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center p-3 bg-green-100 rounded-2xl">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(posStats.todaySales)}</div>
                <div className="text-sm text-green-700">Today</div>
              </div>
              
              <div className="text-center p-3 bg-blue-100 rounded-2xl">
                <div className="text-2xl font-bold text-blue-600">{posStats.todayOrders}</div>
                <div className="text-sm text-blue-700">Orders</div>
              </div>
              
              <div className="text-center p-3 bg-purple-100 rounded-2xl">
                <div className="text-2xl font-bold text-purple-600">{cart.length}</div>
                <div className="text-sm text-purple-700">Cart</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Touch Optimized */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'search', label: 'Search', icon: Search, color: 'blue' },
              { key: 'cart', label: 'Cart', icon: ShoppingCart, color: 'orange' },
              { key: 'customer', label: 'Customer', icon: Users, color: 'purple' },
              { key: 'payment', label: 'Payment', icon: CreditCard, color: 'green' }
            ].map((tab) => (
              <GlassButton
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                variant={activeTab === tab.key ? 'default' : 'outline'}
                className={`p-6 text-lg font-bold rounded-2xl transition-all duration-200 ${
                  activeTab === tab.key 
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white` 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                <tab.icon className="w-8 h-8 mb-2" />
                {tab.label}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search & Quick Actions */}
          <div className="lg:col-span-2">
            {activeTab === 'search' && (
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Search</h2>
                  
                  {/* Large Touch Search Input */}
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          handleSearch(e.target.value);
                        }
                      }}
                      placeholder="Search products, scan barcode, or enter SKU..."
                      className="w-full px-6 py-6 text-xl border-2 border-gray-200 rounded-3xl bg-white/90 backdrop-blur-sm focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <Search className="w-8 h-8 text-gray-400 absolute right-6 top-1/2 transform -translate-y-1/2" />
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {quickActions.map((action, index) => (
                      <GlassButton
                        key={index}
                        onClick={action.action}
                        className="p-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl"
                      >
                        <action.icon className="w-8 h-8 mr-3" />
                        {action.label}
                      </GlassButton>
                    ))}
                  </div>

                  {/* Search Results - Touch Optimized */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div key={product.id} className="p-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                              <p className="text-gray-600 mb-3">{product.description}</p>
                              
                              {product.variants && product.variants.length > 0 && (
                                <div className="space-y-2">
                                  {product.variants.slice(0, 3).map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                      <div>
                                        <span className="font-semibold text-gray-900">{variant.variant_name}</span>
                                        <div className="text-sm text-gray-600">
                                          Stock: {variant.available_quantity} | Price: {formatCurrency(variant.selling_price)}
                                        </div>
                                      </div>
                                      <GlassButton
                                        onClick={() => addToCart(product, variant)}
                                        disabled={variant.available_quantity === 0}
                                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold"
                                      >
                                        <Plus className="w-6 h-6 mr-2" />
                                        Add
                                      </GlassButton>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeTab === 'cart' && (
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h2>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-gray-600 mb-2">Cart is Empty</p>
                      <p className="text-gray-500">Search and add products to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="p-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                              <div className="text-lg text-gray-600 mb-3">
                                {formatCurrency(item.unit_price)} per unit
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Large Touch Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <GlassButton
                                  onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-12 h-12 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                >
                                  -
                                </GlassButton>
                                
                                <span className="text-3xl font-bold text-gray-900 min-w-[4rem] text-center">
                                  {item.quantity}
                                </span>
                                
                                <GlassButton
                                  onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                  disabled={!item.is_external_product && item.variant && item.quantity >= item.variant.available_quantity}
                                  className="w-12 h-12 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl"
                                >
                                  +
                                </GlassButton>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(item.item_total)}
                                </div>
                              </div>
                              
                              <GlassButton
                                onClick={() => removeFromCart(item.id)}
                                className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                              >
                                <Trash2 className="w-6 h-6" />
                              </GlassButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeTab === 'customer' && (
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Selection</h2>
                  
                  {/* Large Touch Customer Search */}
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        handleCustomerSearch(e.target.value);
                      }}
                      placeholder="Search customers by name, phone, or email..."
                      className="w-full px-6 py-6 text-xl border-2 border-gray-200 rounded-3xl bg-white/90 backdrop-blur-sm focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <Users className="w-8 h-8 text-gray-400 absolute right-6 top-1/2 transform -translate-y-1/2" />
                  </div>

                  {/* Customer Type Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <GlassButton
                      variant={customerType === 'retail' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('retail')}
                      className="p-6 text-xl font-bold rounded-2xl"
                    >
                      Retail Customer
                    </GlassButton>
                    <GlassButton
                      variant={customerType === 'wholesale' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('wholesale')}
                      className="p-6 text-xl font-bold rounded-2xl"
                    >
                      Wholesale Customer
                    </GlassButton>
                  </div>

                  {/* Customer Search Results */}
                  {showCustomerSearch && customerSearchResults.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="p-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-lg transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                              <p className="text-lg text-gray-600">{customer.phone}</p>
                              {customer.email && (
                                <p className="text-gray-500">{customer.email}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="px-3 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                {customer.city || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Customer Display */}
                  {selectedCustomer && (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <User className="w-8 h-8 text-green-600" />
                        <span className="text-2xl font-bold text-green-800">Selected Customer</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</p>
                        <p className="text-lg text-gray-600">{selectedCustomer.phone}</p>
                        <p className="text-lg text-gray-600">{selectedCustomer.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeTab === 'payment' && (
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment & Delivery</h2>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'cash', label: 'Cash', icon: DollarSign },
                        { key: 'card', label: 'Card', icon: CreditCard },
                        { key: 'mobile_money', label: 'Mobile Money', icon: Phone },
                        { key: 'bank_transfer', label: 'Bank Transfer', icon: TrendingUp }
                      ].map((method) => (
                        <GlassButton
                          key={method.key}
                          variant={paymentMethod === method.key ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod(method.key as PaymentMethod)}
                          className="p-6 text-lg font-bold rounded-2xl"
                        >
                          <method.icon className="w-8 h-8 mr-3" />
                          {method.label}
                        </GlassButton>
                      ))}
                    </div>
                  </div>

                  {/* Amount Paid Input */}
                  <div className="mb-6">
                    <label className="block text-xl font-bold text-gray-900 mb-4">Amount Paid</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-6 py-6 text-2xl border-2 border-gray-200 rounded-3xl bg-white/90 backdrop-blur-sm focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter amount paid..."
                    />
                  </div>

                  {/* Delivery Method */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'pickup', label: 'Pickup', icon: Package },
                        { key: 'delivery', label: 'Delivery', icon: Truck }
                      ].map((method) => (
                        <GlassButton
                          key={method.key}
                          variant={deliveryMethod === method.key ? 'default' : 'outline'}
                          onClick={() => setDeliveryMethod(method.key as DeliveryMethod)}
                          className="p-6 text-lg font-bold rounded-2xl"
                        >
                          <method.icon className="w-8 h-8 mr-3" />
                          {method.label}
                        </GlassButton>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {deliveryMethod === 'delivery' && (
                    <div className="mb-6">
                      <label className="block text-xl font-bold text-gray-900 mb-4">Delivery Address</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-6 py-6 text-xl border-2 border-gray-200 rounded-3xl bg-white/90 backdrop-blur-sm focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter delivery address..."
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column - Order Summary & Actions */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-4 text-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-bold text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-bold">{formatCurrency(taxAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-bold">{formatCurrency(shippingCost)}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold">{formatCurrency(amountPaid)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className={`font-bold text-xl ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <GlassButton
                  onClick={processSale}
                  disabled={loading || cart.length === 0 || !selectedCustomer}
                  className="w-full p-6 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-8 h-8 mr-3" />
                      Process Sale
                    </>
                  )}
                </GlassButton>
                
                <div className="grid grid-cols-2 gap-4">
                  <GlassButton
                    variant="outline"
                    onClick={() => {/* TODO: Implement hold order */}}
                    disabled={cart.length === 0}
                    className="p-6 text-lg font-bold border-2 border-yellow-200 hover:border-yellow-300 text-yellow-700 rounded-2xl"
                  >
                    <Clock className="w-6 h-6 mr-2" />
                    Hold
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="p-6 text-lg font-bold border-2 border-red-200 hover:border-red-300 text-red-700 rounded-2xl"
                  >
                    <X className="w-6 h-6 mr-2" />
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={(customer) => {
          setSelectedCustomer(customer);
          setShowAddCustomer(false);
        }}
      />

      <AddExternalProductModal
        isOpen={showExternalProduct}
        onClose={() => setShowExternalProduct(false)}
        onAddProduct={(product) => {
          setCart(prev => [...prev, product]);
          setShowExternalProduct(false);
          setActiveTab('cart');
          toast.success('External product added to cart');
        }}
      />

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Sale Receipt"
        size="lg"
      >
        {currentOrder && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-gray-900">Sale Receipt</h3>
              <p className="text-xl text-gray-600">Order #{currentOrder.id.slice(0, 8)}</p>
            </div>
            
            <div className="space-y-4 text-lg">
              <div className="flex justify-between">
                <span className="font-semibold">Customer:</span>
                <span>{currentOrder.customer?.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{new Date(currentOrder.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-2xl">{formatCurrency(currentOrder.final_amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="capitalize">{currentOrder.payment_method}</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <GlassButton
                onClick={() => {
                  toast.info('Print functionality coming soon');
                }}
                className="flex-1 p-4 text-lg font-bold"
              >
                <Printer className="w-6 h-6 mr-2" />
                Print Receipt
              </GlassButton>
              
              <GlassButton
                variant="outline"
                onClick={() => setShowReceipt(false)}
                className="flex-1 p-4 text-lg font-bold"
              >
                Close
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TouchOptimizedPOS; 