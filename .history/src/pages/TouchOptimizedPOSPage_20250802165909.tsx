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
import TouchOptimizedButton from '../components/ui/TouchOptimizedButton';
import FloatingActionButtons from '../components/pos/FloatingActionButtons';
import QuickProductGrid from '../components/pos/QuickProductGrid';
import TouchOptimizedCart from '../components/pos/TouchOptimizedCart';
import QuickCustomerModal from '../components/pos/QuickCustomerModal';
import QuickPaymentModal from '../components/pos/QuickPaymentModal';
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
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import POSNavigation from '../components/pos/POSNavigation';

const TouchOptimizedPOSPage: React.FC = () => {
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    console.log('🚀 Touch Optimized POS Page mounted, loading initial data...');
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
      const initialProducts = await searchProductsForPOS('');
      console.log('Loaded initial products:', initialProducts.length);
      setSearchResults(initialProducts.slice(0, 12)); // Show first 12 products
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const orders = await getSalesOrders({ 
        status: 'completed',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent orders:', error);
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Floating action button handlers
  const handleAddProduct = () => {
    setShowExternalProduct(true);
  };

  const handleSelectCustomer = () => {
    setShowCustomerModal(true);
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handleSearchFocus = () => {
    // Focus on search input
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleSettings = () => {
    toast.info('Settings functionality coming soon');
  };

  const handleReceipt = () => {
    if (currentOrder) {
      setShowReceipt(true);
    } else {
      toast.info('Complete a sale to view receipt');
    }
  };

  const handleQuickSale = () => {
    if (cart.length > 0 && selectedCustomer) {
      processSale();
    } else {
      toast.info('Add items to cart and select customer first');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <POSNavigation />
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Touch POS</h1>
              <p className="text-lg text-gray-600">Fast & Easy Sales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg text-gray-600">Today's Sales</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(posStats.todaySales)}</div>
            </div>
            
            <TouchOptimizedButton
              onClick={clearCart}
              variant="danger"
              size="md"
              icon={Trash2}
              disabled={cart.length === 0}
            >
              Clear
            </TouchOptimizedButton>
            
            <TouchOptimizedButton
              onClick={processSale}
              variant="primary"
              size="lg"
              icon={CheckCircle}
              disabled={loading || cart.length === 0 || !selectedCustomer}
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </TouchOptimizedButton>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Product Section - 1/3 width */}
          <div className="lg:col-span-1 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Products</h2>
                  <p className="text-sm text-gray-600">Quick selection</p>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto">
              <QuickProductGrid
                products={searchResults}
                onAddToCart={addToCart}
                customerType={customerType}
                maxProducts={20}
              />
            </div>
          </div>
          
          {/* Cart Section - 2/3 width */}
          <div className="lg:col-span-2 bg-gray-50">
            <TouchOptimizedCart
              cart={cart}
              onUpdateQuantity={updateCartItemQuantity}
              onRemove={removeFromCart}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onAddProduct={handleAddProduct}
        onSelectCustomer={handleSelectCustomer}
        onPayment={handlePayment}
        onSearch={handleSearchFocus}
        onSettings={handleSettings}
        onReceipt={handleReceipt}
        onQuickSale={handleQuickSale}
      />

      {/* Modals */}
      <QuickCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={customers}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerModal(false);
        }}
        onAddCustomer={() => {
          setShowCustomerModal(false);
          setShowAddCustomer(true);
        }}
      />

      <QuickPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        finalAmount={finalAmount}
        balanceDue={balanceDue}
        onComplete={() => {
          setShowPaymentModal(false);
          if (cart.length > 0 && selectedCustomer) {
            processSale();
          }
        }}
      />

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
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Sale Receipt</h3>
              <p className="text-gray-600">Order #{currentOrder.id.slice(0, 8)}</p>
            </div>
            
            <div className="space-y-4 mb-6">
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
            
            <div className="flex gap-3">
              <TouchOptimizedButton
                onClick={() => {
                  toast.info('Print functionality coming soon');
                }}
                variant="primary"
                size="md"
                icon={Printer}
                className="flex-1"
              >
                Print
              </TouchOptimizedButton>
              
              <TouchOptimizedButton
                onClick={() => setShowReceipt(false)}
                variant="secondary"
                size="md"
                icon={X}
                className="flex-1"
              >
                Close
              </TouchOptimizedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouchOptimizedPOSPage; 