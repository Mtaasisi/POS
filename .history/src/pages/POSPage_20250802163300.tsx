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
import { fetchAllCustomers } from '../lib/customerApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import AddCustomerModal from '../components/forms/AddCustomerModal';
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import ProductSearchInput from '../components/pos/ProductSearchInput';
import CartItemComponent from '../components/pos/CartItem';
import PaymentSection from '../components/pos/PaymentSection';
import DeliverySection from '../components/pos/DeliverySection';
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
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const POSPage: React.FC = () => {
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

  // Load initial data
  useEffect(() => {
    console.log('🚀 POS Page mounted, loading initial data...');
    loadPOSStats();
    loadCustomers();
    loadProducts();
    loadRecentOrders();
  }, []);

  // Additional effect to ensure customers are loaded when context updates
  useEffect(() => {
    console.log('👥 Customers context updated, count:', customers.length);
    if (customers.length === 0) {
      console.log('🔄 No customers in context, triggering refresh...');
      loadCustomers();
    }
  }, [customers.length]);

  // Force load customers on mount if they're not loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customers.length === 0) {
        console.log('⏰ Timer triggered - no customers loaded, forcing refresh...');
        loadCustomers();
      }
    }, 2000); // Wait 2 seconds then check

    return () => clearTimeout(timer);
  }, []);

  const loadCustomers = async () => {
    try {
      console.log('🔄 Loading customers... Current count:', customers.length);
      if (customers.length === 0) {
        console.log('📥 No customers in context, refreshing...');
        await refreshCustomers();
        console.log('✅ Customers refreshed, new count:', customers.length);
      } else {
        console.log('✅ Customers already loaded:', customers.length);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading initial products...');
      // Load initial products for quick access
      const initialProducts = await searchProductsForPOS('');
      console.log('Loaded initial products:', initialProducts.length);
      setSearchResults(initialProducts.slice(0, 10)); // Show first 10 products
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const orders = await getSalesOrders({ 
        status: 'completed',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      });
      setRecentOrders(orders.slice(0, 5)); // Show last 5 orders
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPOSStats(),
        loadCustomers(),
        loadProducts(),
        loadRecentOrders()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
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
    console.log('Searching for:', query);
    
    try {
      const products = await searchProductsForPOS(query);
      console.log('Search results:', products.length);
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
    }
  }, []);

  // Search customers
  const handleCustomerSearch = useCallback(async (query: string) => {
    console.log('🔍 Customer search query:', query);
    console.log('📊 Available customers:', customers.length);
    
    if (query.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
      return;
    }

    // If no customers are loaded, try to refresh them
    if (customers.length === 0) {
      console.log('⚠️ No customers loaded, attempting to refresh...');
      try {
        await refreshCustomers();
        console.log('✅ Customers refreshed, new count:', customers.length);
      } catch (error) {
        console.error('❌ Failed to refresh customers:', error);
        toast.error('Failed to load customers');
        return;
      }
    }

    try {
      const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        customer.email.toLowerCase().includes(query.toLowerCase())
      );
      console.log('✅ Filtered customers:', filteredCustomers.length);
      setCustomerSearchResults(filteredCustomers);
      setShowCustomerSearch(true);
    } catch (error) {
      console.error('❌ Error searching customers:', error);
      toast.error('Failed to search customers');
    }
  }, [customers, refreshCustomers]);

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerSearch(false);
    setCustomerSearchResults([]);
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

    if (amountPaid < 0) {
      toast.error('Amount paid cannot be negative');
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

  // Hold order
  const holdOrder = () => {
    // TODO: Implement hold order functionality
    toast.info('Hold order functionality coming soon');
  };

  // Cancel order
  const cancelOrder = () => {
    clearCart();
    toast.info('Order cancelled');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-gray-600">Process sales and manage transactions</p>
            </div>
            
            {/* POS Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100/80 backdrop-blur-sm rounded-xl border border-green-200/30">
                <PackageIcon className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  Inventory POS
                </span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">
                  {formatCurrency(posStats.todaySales)}
                </span>
                <span className="text-sm text-gray-500">Today</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30">
                <PackageIcon className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  {posStats.todayOrders}
                </span>
                <span className="text-sm text-gray-500">Orders</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30">
                <UsersIcon className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">
                  {customers.length}
                </span>
                <span className="text-sm text-gray-500">Customers</span>
              </div>

              <GlassButton
                onClick={refreshAllData}
                disabled={loading}
                variant="outline"
                className="px-4 py-2 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                )}
              </GlassButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Product Search & Cart (8 columns on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Product Search Card */}
            <GlassCard className="p-6 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inventory Search</h2>
                  <p className="text-gray-600">Search spare parts by name, brand, or part number</p>
                </div>
              </div>

              <ProductSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                results={searchResults}
                onAddToCart={addToCart}
                customerType={customerType}
              />

              <div className="flex items-center gap-4 mt-4">
                <GlassButton
                  onClick={() => setShowExternalProduct(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add External Product
                </GlassButton>
                
                <GlassButton
                  variant="outline"
                  onClick={() => setShowAddCustomer(true)}
                  className="border-2 border-gray-200 hover:border-blue-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Add Customer
                </GlassButton>
              </div>
            </GlassCard>

            {/* Cart Card */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Cart</h2>
                    <p className="text-gray-600">{cart.length} items</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="outline"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </GlassButton>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold text-lg">Cart is empty</p>
                  <p className="text-sm text-gray-500 mt-2">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateCartItemQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Recent Orders Card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                  <p className="text-gray-600">Last 7 days</p>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold">No recent orders</p>
                  <p className="text-sm text-gray-500 mt-1">Complete your first sale to see orders here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {order.customer?.name || 'Unknown Customer'}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            {order.status}
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          {formatCurrency(order.final_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="capitalize">{order.payment_method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Column - Customer, Payment & Delivery (4 columns on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Customer Selection Card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Customer</h2>
                  <p className="text-gray-600">Select customer & type</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Customer Search */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Select Customer
                    </label>
                    <GlassButton
                      onClick={async () => {
                        console.log('🔄 Manual customer refresh triggered');
                        try {
                          await refreshCustomers();
                          toast.success(`Loaded ${customers.length} customers`);
                        } catch (error) {
                          console.error('❌ Manual refresh failed:', error);
                          toast.error('Failed to refresh customers');
                        }
                      }}
                      variant="outline"
                      className="px-2 py-1 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </GlassButton>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      placeholder="Search customers by name, phone, or email..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        handleCustomerSearch(e.target.value);
                      }}
                    />
                    <Users className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>

                  {/* Customer Search Results */}
                  {showCustomerSearch && customerSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      <div className="p-2">
                        {customerSearchResults.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                                {customer.email && (
                                  <p className="text-xs text-gray-500">{customer.email}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {customer.city || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {showCustomerSearch && customerSearchQuery.length >= 2 && customerSearchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl z-50 p-4">
                      <div className="text-center">
                        <p className="text-gray-600">No customers found</p>
                        <p className="text-sm text-gray-500">Try a different search term</p>
                        <p className="text-xs text-gray-400 mt-2">Debug: {customers.length} customers loaded</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Type
                  </label>
                  <div className="flex gap-2">
                    <GlassButton
                      variant={customerType === 'retail' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('retail')}
                      className="flex-1"
                    >
                      Retail
                    </GlassButton>
                    <GlassButton
                      variant={customerType === 'wholesale' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('wholesale')}
                      className="flex-1"
                    >
                      Wholesale
                    </GlassButton>
                  </div>
                </div>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-blue-800">Selected Customer</span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.city}</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Payment Section */}
            <PaymentSection
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              finalAmount={finalAmount}
              balanceDue={balanceDue}
            />

            {/* Delivery Section */}
            <DeliverySection
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
              deliveryCity={deliveryCity}
              setDeliveryCity={setDeliveryCity}
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              deliveryNotes={deliveryNotes}
              setDeliveryNotes={setDeliveryNotes}
            />

            {/* Order Summary Card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                  <p className="text-gray-600">Final calculations</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(amountPaid)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="space-y-3">
              <GlassButton
                onClick={processSale}
                disabled={loading || cart.length === 0 || !selectedCustomer}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-bold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Process Sale
                  </>
                )}
              </GlassButton>
              
              <div className="grid grid-cols-2 gap-3">
                <GlassButton
                  variant="outline"
                  onClick={holdOrder}
                  disabled={cart.length === 0}
                  className="border-2 border-yellow-200 hover:border-yellow-300 text-yellow-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Hold Order
                </GlassButton>
                
                <GlassButton
                  variant="outline"
                  onClick={cancelOrder}
                  disabled={cart.length === 0}
                  className="border-2 border-red-200 hover:border-red-300 text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </GlassButton>
              </div>
            </div>
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
              <h3 className="text-2xl font-bold text-gray-900">Sale Receipt</h3>
              <p className="text-gray-600">Order #{currentOrder.id.slice(0, 8)}</p>
            </div>
            
            <div className="space-y-4">
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
                <span className="font-bold">{formatCurrency(currentOrder.final_amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="capitalize">{currentOrder.payment_method}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <GlassButton
                onClick={() => {
                  // TODO: Implement print functionality
                  toast.info('Print functionality coming soon');
                }}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </GlassButton>
              
              <GlassButton
                variant="outline"
                onClick={() => setShowReceipt(false)}
                className="flex-1"
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

export default POSPage; 