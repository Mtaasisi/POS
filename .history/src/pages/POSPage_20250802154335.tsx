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
  getPOSStats,
  getAllPOSData,
  getAllCustomersForPOS,
  getAllProductsForPOS,
  getRecentSalesOrders,
  getLowStockProducts,
  getTopSellingProducts,
  getCustomerPurchaseHistory
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
import CustomerSummaryCard from '../components/pos/CustomerSummaryCard';
import PaymentSummaryCard from '../components/pos/PaymentSummaryCard';
import DeliverySummaryCard from '../components/pos/DeliverySummaryCard';
import CustomerSelectionModal from '../components/pos/CustomerSelectionModal';
import PaymentModal from '../components/pos/PaymentModal';
import DeliveryModal from '../components/pos/DeliveryModal';
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
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showExternalProduct, setShowExternalProduct] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  
  const [posStats, setPosStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    todaySales: 0,
    todayOrders: 0
  });

  // Additional data state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAllPOSData();
  }, []);

  // Load all POS data
  const loadAllPOSData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch all data in parallel for better performance
      const [
        stats,
        products,
        categories,
        suppliers,
        recentOrdersData,
        lowStockData,
        topSellingData
      ] = await Promise.all([
        getPOSStats(),
        getAllProductsForPOS(),
        getAllCategoriesForPOS(),
        getAllSuppliersForPOS(),
        getRecentSalesOrders(5),
        getLowStockProducts(10),
        getTopSellingProducts(5)
      ]);

      setPosStats(stats);
      setAllProducts(products);
      setAllCategories(categories);
      setAllSuppliers(suppliers);
      setRecentOrders(recentOrdersData);
      setLowStockProducts(lowStockData);
      setTopSellingProducts(topSellingData);

      // Load customers if not already loaded
      if (customers.length === 0) {
        refreshCustomers();
      }
    } catch (error) {
      console.error('Error loading POS data:', error);
      toast.error('Failed to load some data');
    } finally {
      setIsLoadingData(false);
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
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const products = await searchProductsForPOS(query);
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Product Search & Cart (8 columns on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Product Search Card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Product Search</h2>
                  <p className="text-gray-600">Search by name, SKU, or barcode</p>
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
          </div>

          {/* Right Column - Customer, Payment & Delivery (4 columns on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Customer Summary Card */}
            <CustomerSummaryCard
              selectedCustomer={selectedCustomer}
              customerType={customerType}
              onOpenCustomerModal={() => setShowCustomerModal(true)}
              onAddCustomer={() => setShowAddCustomer(true)}
            />

            {/* Payment Summary Card */}
            <PaymentSummaryCard
              paymentMethod={paymentMethod}
              amountPaid={amountPaid}
              finalAmount={finalAmount}
              balanceDue={balanceDue}
              onOpenPaymentModal={() => setShowPaymentModal(true)}
            />

            {/* Delivery Summary Card */}
            <DeliverySummaryCard
              deliveryMethod={deliveryMethod}
              deliveryAddress={deliveryAddress}
              deliveryCity={deliveryCity}
              onOpenDeliveryModal={() => setShowDeliveryModal(true)}
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

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        customerType={customerType}
        setCustomerType={setCustomerType}
        customers={customers}
        onAddCustomer={() => {
          setShowCustomerModal(false);
          setShowAddCustomer(true);
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        finalAmount={finalAmount}
        balanceDue={balanceDue}
      />

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        deliveryMethod={deliveryMethod}
        setDeliveryMethod={setDeliveryMethod}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        deliveryCity={deliveryCity}
        setDeliveryCity={setDeliveryCity}
        deliveryNotes={deliveryNotes}
        setDeliveryNotes={setDeliveryNotes}
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