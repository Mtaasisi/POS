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
  Clock as ClockIcon,
  Sparkles,
  Zap as ZapIcon,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

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

  // Validate cart items when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      validateCartItems();
    }
  }, [cart]);

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
      console.log('🔍 Processing customer search for query:', query);
      console.log('📊 Sample customer data:', customers.slice(0, 2).map(c => ({ 
        name: c.name, 
        phone: c.phone, 
        email: c.email,
        id: c.id,
        hasName: !!c.name,
        hasPhone: !!c.phone,
        hasEmail: !!c.email
      })));
      
              const filteredCustomers = customers.filter(customer => {
          try {
            const name = customer.name || '';
            const phone = customer.phone || '';
            const email = customer.email || '';
            
            const nameMatch = name.toLowerCase().includes(query.toLowerCase());
            const phoneMatch = phone.includes(query);
            const emailMatch = email.toLowerCase().includes(query.toLowerCase());
            
            return nameMatch || phoneMatch || emailMatch;
          } catch (filterError) {
            console.error('❌ Error filtering customer:', customer.id, filterError);
            return false;
          }
        });
      console.log('✅ Filtered customers:', filteredCustomers.length);
      setCustomerSearchResults(filteredCustomers);
      setShowCustomerSearch(true);
    } catch (error) {
      console.error('❌ Error searching customers:', error);
      console.error('❌ Error details:', error.message);
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
      // Validate that the product/variant exists before adding to cart
      if (product.id === variant.id) {
        // This is likely a spare part, verify it exists
        const { data: sparePart, error } = await supabase
          .from('spare_parts')
          .select('id')
          .eq('id', product.id)
          .eq('is_active', true)
          .single();
        
        if (error || !sparePart) {
          console.warn(`Spare part ${product.id} not found or inactive`);
          toast.error('This item is no longer available');
          return;
        }
      }
      
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

  // Validate cart items
  const validateCartItems = async () => {
    const validItems: CartItem[] = [];
    
    for (const item of cart) {
      try {
        if (item.product_id === item.variant_id) {
          // This is likely a spare part, verify it exists
          const { data: sparePart, error } = await supabase
            .from('spare_parts')
            .select('id')
            .eq('id', item.product_id)
            .eq('is_active', true)
            .single();
          
          if (error || !sparePart) {
            console.warn(`Removing invalid cart item: ${item.product_id}`);
            continue;
          }
        }
        validItems.push(item);
      } catch (error) {
        console.warn(`Error validating cart item ${item.product_id}:`, error);
        continue;
      }
    }
    
    if (validItems.length !== cart.length) {
      setCart(validItems);
      toast.warning('Some items were removed from cart (no longer available)');
    }
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
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Progress Indicator */}
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Point of Sale</h2>
            <div className="text-sm text-gray-600">
              {selectedCustomer ? 'Customer Selected' : 'Customer Required'}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${selectedCustomer ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCustomer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {selectedCustomer ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="text-sm font-medium">Customer</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 rounded">
              <div className={`h-1 rounded transition-all duration-300 ${selectedCustomer ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: selectedCustomer ? '100%' : '0%' }}></div>
            </div>
            
            <div className={`flex items-center space-x-2 ${cart.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cart.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {cart.length > 0 ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <ShoppingCart size={16} />
                )}
              </div>
              <span className="text-sm font-medium">Cart</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 rounded">
              <div className={`h-1 rounded transition-all duration-300 ${cart.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: cart.length > 0 ? '100%' : '0%' }}></div>
            </div>
            
            <div className={`flex items-center space-x-2 ${selectedCustomer && cart.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCustomer && cart.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {selectedCustomer && cart.length > 0 ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <DollarSign size={16} />
                )}
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
          
          {/* Completion Status */}
          <div className="mt-3 text-xs text-gray-500">
            {selectedCustomer && cart.length > 0 ? (
              <span className="text-green-600 font-medium">✓ Ready to process sale</span>
            ) : (
              <span>Select customer and add items to cart</span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(posStats.todaySales)}</p>
                <p className="text-xs text-gray-500">Today's Sales</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{posStats.todayOrders}</p>
                <p className="text-xs text-gray-500">Today's Orders</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{cart.length}</p>
                <p className="text-xs text-gray-500">Cart Items</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Product Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Selection</h3>
                  <p className="text-sm text-gray-600">Search and select customer</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Customer Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    placeholder="Search customers by name, phone, or email..."
                    className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      handleCustomerSearch(e.target.value);
                    }}
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  
                  {/* Customer Search Results */}
                  {showCustomerSearch && customerSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-300 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
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
                  )}
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomerType('retail')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        customerType === 'retail' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('wholesale')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        customerType === 'wholesale' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Wholesale
                    </button>
                  </div>
                </div>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-green-800">Selected Customer</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-gray-600">{selectedCustomer.phone}</p>
                      {selectedCustomer.city && (
                        <p className="text-gray-600">{selectedCustomer.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Product Search */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Product Search</h3>
                  <p className="text-sm text-gray-600">Find spare parts and products</p>
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

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowExternalProduct(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add External Product
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Add Customer
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Cart & Payment */}
          <div className="space-y-6">
            {/* Cart */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
                    <p className="text-sm text-gray-600">{cart.length} items • {formatCurrency(subtotal)}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Cart is empty</h4>
                  <p className="text-sm text-gray-500">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
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

            {/* Order Summary */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  <p className="text-sm text-gray-600">Final calculations</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(amountPaid)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={processSale}
                disabled={loading || cart.length === 0 || !selectedCustomer}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  selectedCustomer && cart.length > 0
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    Process Sale
                  </div>
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={holdOrder}
                  disabled={cart.length === 0}
                  className="py-3 px-4 border-2 border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hold Order
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cart.length === 0}
                  className="py-3 px-4 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </div>
                </button>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sale Receipt</h3>
              <p className="text-gray-600">Order #{currentOrder.id.slice(0, 8)}</p>
            </div>
            
            <div className="space-y-3 text-lg">
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
                <span className="font-bold text-xl">{formatCurrency(currentOrder.final_amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Payment Method:</span>
                <span className="capitalize">{currentOrder.payment_method}</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement print functionality
                  toast.info('Print functionality coming soon');
                }}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default POSPage; 