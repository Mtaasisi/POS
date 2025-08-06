import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import POSSettingsModal from '../components/pos/POSSettingsModal';
import AddCustomerModal from '../components/forms/AddCustomerModal';
import MiniSalesDashboard from '../components/pos/MiniSalesDashboard';
import SmartNotifications from '../components/pos/SmartNotifications';
import DarkModeToggle from '../components/pos/DarkModeToggle';
import SmartProductSearch from '../components/pos/SmartProductSearch';
import LocationSelector from '../components/pos/LocationSelector';
import AdvancedInventory from '../components/pos/AdvancedInventory';
import LoyaltyProgram from '../components/pos/LoyaltyProgram';
import GiftCardManager from '../components/pos/GiftCardManager';
import FinanceAccountsModal from '../components/pos/FinanceAccountsModal';
import PaymentSelectionModal from '../components/pos/PaymentSelectionModal';

import { posApi } from '../lib/posApi';
import { supabase } from '../lib/supabaseClient';
import { getProducts, searchProducts, Product } from '../lib/inventoryApi';
import { financeAccountService, FinanceAccount } from '../lib/financeAccountService';
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
  Calendar,
  MapPin,
  Printer,
  DollarSign,
  Package as PackageIcon,
  Settings,
  ArrowLeft,
  TrendingUp,
  Bell,
  Building,
  Crown,
  Gift,
  FileText,
  Calculator as CalculatorIcon,
  CreditCard as CreditCardIcon,
  RotateCcw as RotateCcwIcon,
  Users,
  Star,
  UserPlus,
  Award,
  ChevronRight,
  Bolt,
  Mic,
  HelpCircle,
  Wifi,
  Battery,
  Cloud,
  Activity
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

const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const [paymentAccount, setPaymentAccount] = useState<string>('');
  const [paymentAccounts, setPaymentAccounts] = useState<FinanceAccount[]>([]);
  const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'payment'>('products');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showAdvancedInventory, setShowAdvancedInventory] = useState(false);
  const [showLoyaltyProgram, setShowLoyaltyProgram] = useState(false);
  const [showGiftCardManager, setShowGiftCardManager] = useState(false);
  const [showPaymentsAccounts, setShowPaymentsAccounts] = useState(false);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  const [paymentSelected, setPaymentSelected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectingCustomer, setSelectingCustomer] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const cartListRef = useRef<HTMLDivElement>(null);

  // Enhanced header state variables
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaySales, setTodaySales] = useState(1247.50);
  const [todayOrders, setTodayOrders] = useState(12);
  const [weatherInfo, setWeatherInfo] = useState({ city: 'Nairobi', temp: 24 });
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isOnline, setIsOnline] = useState(true);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    printer: true,
    cashDrawer: true,
    scanner: false,
    network: true
  });

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadPaymentAccounts();
    loadDefaultLocation();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.model && product.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.product_code && product.product_code.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearchQuery.trim()) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(customerSearchQuery.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearchQuery, customers]);

  // Auto-fill amount paid with total when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      const totals = calculateTotals();
      setAmountPaid(totals.total);
    } else {
      setAmountPaid(0);
    }
  }, [cart, deliveryMethod]);

  // Handle return from delivery options page
  useEffect(() => {
    if (location.state?.orderCompleted) {
      // Process the completed order
      const deliveryData = location.state.deliveryData;
      if (deliveryData) {
        setDeliveryMethod(deliveryData.method);
        setDeliveryAddress(deliveryData.address);
        setDeliveryCity(deliveryData.city);
        setDeliveryNotes(deliveryData.notes);
      }
      
      // Process the sale
      processSaleWithDelivery();
      
      // Clear the state
      navigate(location.pathname, { replace: true });
    } else if (location.state?.returnToPayment) {
      // Return to payment selection
      const deliveryData = location.state.deliveryData;
      if (deliveryData) {
        setDeliveryMethod(deliveryData.method);
        setDeliveryAddress(deliveryData.address);
        setDeliveryCity(deliveryData.city);
        setDeliveryNotes(deliveryData.notes);
      }
      
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const allProducts = await getProducts();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      // First get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customersError) throw customersError;

      // Then get loyalty data
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_customers')
        .select('*');

      if (loyaltyError) throw loyaltyError;

      // Create a map of loyalty data by customer_id
      const loyaltyMap = new Map();
      (loyaltyData || []).forEach((loyalty: any) => {
        loyaltyMap.set(loyalty.customer_id, loyalty);
      });

      // Combine customers with their loyalty data
      const customersList = (customersData || []).map((customer: any) => {
        const loyaltyInfo = loyaltyMap.get(customer.id);
        
        return {
          ...customer,
          loyalty: loyaltyInfo ? {
            points: loyaltyInfo.points || 0,
            tier: loyaltyInfo.tier || 'bronze',
            totalSpent: loyaltyInfo.total_spent || 0,
            joinDate: loyaltyInfo.join_date,
            lastVisit: loyaltyInfo.last_visit,
            rewardsRedeemed: loyaltyInfo.rewards_redeemed || 0,
            isLoyaltyMember: true
          } : undefined
        };
      });
      
      setCustomers(customersList);
      setFilteredCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadPaymentAccounts = async () => {
    setPaymentAccountsLoading(true);
    try {
      const accounts = await financeAccountService.getPaymentMethods();
      console.log('🔧 Loaded payment accounts:', accounts);
      setPaymentAccounts(accounts);
      
      // Set default payment account if available
      if (accounts.length > 0 && !accounts.find(a => a.id === paymentAccount)) {
        setPaymentAccount(accounts[0].id);
        console.log('🔧 Set default payment account:', accounts[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading payment accounts:', error);
      setPaymentAccounts([]);
      
      // Add fallback payment methods if none available
      const fallbackAccounts = [
        {
          id: 'cash-fallback',
          name: 'Cash',
          type: 'cash' as const,
          balance: 0,
          currency: 'TZS',
          is_active: true,
          is_payment_method: true,
          payment_icon: 'cash.svg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'card-fallback',
          name: 'Card Payment',
          type: 'credit_card' as const,
          balance: 0,
          currency: 'TZS',
          is_active: true,
          is_payment_method: true,
          payment_icon: 'mastercard.svg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setPaymentAccounts(fallbackAccounts);
      setPaymentAccount('cash-fallback');
      console.log('🔧 Using fallback payment accounts');
    } finally {
      setPaymentAccountsLoading(false);
    }
  };

  const loadDefaultLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('name', 'Main Repair Center')
        .single();
      
      if (error) {
        console.error('Error loading default location:', error);
        // Set a fallback location
        setCurrentLocation({
          id: null,
          name: 'Main Repair Center',
          address: '123 Tech Street, Lagos',
          status: 'active'
        });
      } else {
        setCurrentLocation(data);
      }
    } catch (error) {
      console.error('Error loading default location:', error);
      // Set a fallback location
      setCurrentLocation({
        id: null,
        name: 'Main Repair Center',
        address: '123 Tech Street, Lagos',
        status: 'active'
      });
    }
  };

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

    // Visual feedback - add a temporary highlight class
    const element = document.querySelector(`[data-product-id="${product.id}"]`);
    if (element) {
      element.classList.add('animate-pulse', 'bg-green-100');
      setTimeout(() => {
        element.classList.remove('animate-pulse', 'bg-green-100');
      }, 1000);
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
    if (cart.length === 0) {
      addNotification('warning', 'Empty Cart', 'Please add items to cart before proceeding');
      return;
    }

    if (!selectedCustomer) {
      addNotification('warning', 'No Customer Selected', 'Please select a customer before proceeding');
      return;
    }
    
    // Show payment selection modal instead of directly processing
    setShowPaymentSelection(true);
  };

  const handlePaymentSelect = (selectedPaymentAccountId: string) => {
    console.log('🔧 Payment selected:', selectedPaymentAccountId);
    setPaymentAccount(selectedPaymentAccountId);
    setPaymentSelected(true);
    setShowPaymentSelection(false);
    
    // Navigate to delivery options page with order data
    const orderData = {
      summary: {
        customer: {
          name: selectedCustomer?.name || 'Customer',
          phone: selectedCustomer?.phone || ''
        },
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        totals: calculateTotals()
      }
    };
    
    navigate('/delivery-options', { state: { orderData } });
  };

  const processSaleWithDelivery = async () => {
    console.log('🔧 Processing sale with delivery...');
    
    // Validation
    if (cart.length === 0) {
      addNotification('warning', 'Empty Cart', 'Please add items to cart before proceeding');
      return;
    }

    if (!selectedCustomer) {
      addNotification('warning', 'No Customer Selected', 'Please select a customer before proceeding');
      return;
    }

    if (!paymentAccount) {
      addNotification('warning', 'No Payment Method', 'Please select a payment method before proceeding');
      return;
    }

    try {
      // Calculate totals
      const totals = calculateTotals();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Create sale order
      const orderData = {
        customer_id: selectedCustomer?.id || undefined,
        total_amount: totals.subtotal,
        discount_amount: 0,
        tax_amount: totals.tax,
        shipping_cost: totals.shipping,
        final_amount: totals.total,
        amount_paid: amountPaid,
        balance_due: totals.balance,
        payment_method: 'card' as 'cash' | 'card' | 'transfer' | 'installment' | 'payment_on_delivery',
        customer_type: customerType,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_method: deliveryMethod as 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup',
        delivery_notes: deliveryNotes,
        location_id: currentLocation?.id || null,
        created_by: user.id,
        status: (amountPaid >= totals.total ? 'completed' : 'partially_paid') as 'completed' | 'partially_paid'
      };
      
      console.log('🔧 Creating sale order with data:', orderData);
      const saleOrder = await posApi.createSaleOrder(orderData);
      
      // Create sale order items
      for (const item of cart) {
        const isVariant = item.id.includes('-variant-') || item.variant;
        
        const orderItem = {
          order_id: saleOrder.id,
          product_id: isVariant ? null : item.id,
          variant_id: isVariant ? item.id : null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_cost: item.unitPrice * 0.7,
          item_total: item.total,
          is_external_product: item.isExternal || false,
          external_product_details: item.isExternal ? {
            name: item.name,
            description: item.variant || 'External product',
            price: item.unitPrice
          } : null
        };
        
        console.log('🔧 Creating order item:', orderItem);
        
        const { error: itemError } = await supabase
          .from('sales_order_items')
          .insert([orderItem]);
        
        if (itemError) {
          console.error('Error creating order item:', itemError);
          throw new Error(`Failed to create order item: ${itemError.message}`);
        }
        
        // Deduct inventory if not external product and it's a variant
        if (!item.isExternal && isVariant) {
          try {
            await posApi.deductInventory(item.id, item.quantity);
            console.log(`🔧 Deducted ${item.quantity} from variant ${item.id}`);
          } catch (error) {
            console.warn('Failed to deduct inventory:', error);
            addNotification('warning', 'Inventory Warning', `Could not update stock for ${item.name}`);
          }
        }
      }
      
      // Update loyalty points if customer is selected
      if (selectedCustomer) {
        try {
          const pointsToAdd = Math.floor(totals.total / 100);
          await posApi.updateLoyaltyPoints(selectedCustomer.id, pointsToAdd);
          console.log(`🔧 Added ${pointsToAdd} loyalty points to customer ${selectedCustomer.id}`);
        } catch (error) {
          console.warn('Failed to update loyalty points:', error);
          addNotification('warning', 'Loyalty Warning', 'Could not update loyalty points');
        }
      }
      
      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer(null);
      setAmountPaid(0);
      setDeliveryAddress('');
      setDeliveryCity('');
      setDeliveryNotes('');
      setPaymentSelected(false);
      setPaymentAccount('');
      setActiveTab('products');
      
      addNotification('success', 'Sale Completed', `Transaction processed successfully. Order ID: ${saleOrder.id}`);
      
    } catch (error: any) {
      console.error('❌ Error processing sale:', error);
      addNotification('error', 'Sale Failed', `Failed to process transaction: ${error.message || 'Unknown error'}`);
    }
  };

  const holdOrder = () => {
    console.log('Holding order');
    addNotification('warning', 'Order Held', 'Order has been placed on hold');
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
    setPaymentSelected(false);
    addNotification('info', 'Cart Cleared', 'Shopping cart has been cleared');
  };

  const printReceipt = () => {
    console.log('Printing receipt...');
    addNotification('success', 'Receipt Printed', 'Receipt has been sent to printer');
  };

  const openCashDrawer = () => {
    // Simulate cash drawer opening
    console.log('Opening cash drawer...');
    // TODO: Integrate with actual cash drawer hardware
    addNotification('success', 'Cash Drawer', 'Cash drawer opened successfully!');
  };

  const quickSale = () => {
    // Quick sale mode - pre-fill common items
    console.log('Quick sale mode...');
    const quickItems = [
      { id: 'quick1', name: 'Quick Sale Item 1', price: 50000, quantity: 1 },
      { id: 'quick2', name: 'Quick Sale Item 2', price: 75000, quantity: 1 },
    ];
    
    quickItems.forEach(item => {
      const existingItem = cart.find(cartItem => cartItem.id === item.id);
      if (!existingItem) {
        setCart(prev => [...prev, {
          id: item.id,
          name: item.name,
          variant: 'Quick Sale',
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
          isExternal: true
        }]);
      }
    });
    
    addNotification('success', 'Quick Sale', 'Quick sale items added to cart');
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const openGiftCards = () => {
    setShowGiftCardManager(true);
  };

  const openSplitPayment = () => {
    addNotification('info', 'Split Payment', 'Split payment feature coming soon!');
  };

  const openReturns = () => {
    addNotification('info', 'Returns & Refunds', 'Returns management coming soon!');
  };

  const openTaxSettings = () => {
    addNotification('info', 'Tax Settings', 'Tax management coming soon!');
  };

  // Customer search functionality
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      // Search customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%, phone.ilike.%${query}%, email.ilike.%${query}%`)
        .limit(10);

      if (customersError) throw customersError;

      // Get loyalty data for the found customers
      const customerIds = (customers || []).map((c: any) => c.id);
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_customers')
        .select('*')
        .in('customer_id', customerIds);

      if (loyaltyError) throw loyaltyError;

      // Create a map of loyalty data by customer_id
      const loyaltyMap = new Map();
      (loyaltyData || []).forEach((loyalty: any) => {
        loyaltyMap.set(loyalty.customer_id, loyalty);
      });

      // Format the results to include loyalty information
      const formattedResults = (customers || []).map((customer: any) => {
        const loyaltyInfo = loyaltyMap.get(customer.id);
        
        return {
          ...customer,
          loyalty: loyaltyInfo ? {
            points: loyaltyInfo.points || 0,
            tier: loyaltyInfo.tier || 'bronze',
            totalSpent: loyaltyInfo.total_spent || 0,
            joinDate: loyaltyInfo.join_date,
            lastVisit: loyaltyInfo.last_visit,
            rewardsRedeemed: loyaltyInfo.rewards_redeemed || 0,
            isLoyaltyMember: true
          } : undefined
        };
      });

      setCustomerSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching customers:', error);
      addNotification('error', 'Search Error', 'Failed to search customers');
    }
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    if (query.length >= 2) {
      searchCustomers(query);
      setShowCustomerSearch(true);
    } else {
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
    }
  };

  const selectCustomer = (customer: any) => {
    // Add selection effect
    setSelectingCustomer(customer.id);
    
    // Show selection animation
    setTimeout(() => {
      setSelectedCustomer({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        type: customerType,
        loyalty: customer.loyalty
      });
      setCustomerSearchQuery('');
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
      
      // Show loyalty information in notification if available
      if (customer.loyalty?.isLoyaltyMember) {
        addNotification('success', 'Customer Selected', 
          `${customer.name} selected (${customer.loyalty.tier.toUpperCase()} member - ${customer.loyalty.points} points)`);
      } else {
        addNotification('success', 'Customer Selected', `${customer.name} selected`);
      }

      // Clear selection effect without switching tabs
      setTimeout(() => {
        setSelectingCustomer(null);
      }, 200);
    }, 300);
  };

  const removeSelectedCustomer = () => {
    setSelectedCustomer(null);
    addNotification('info', 'Customer Removed', 'Customer selection cleared');
  };

  const addCustomerToLoyalty = async (customer: Customer) => {
    try {
      // Insert into loyalty_customers table
      const { error } = await supabase
        .from('loyalty_customers')
        .insert([{
          customer_id: customer.id,
          points: 0,
          tier: 'bronze',
          total_spent: 0,
          join_date: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          rewards_redeemed: 0
        }]);
      
      if (error) throw error;

      // Create updated customer object with loyalty data
      const updatedCustomer = {
        ...customer,
        loyalty: {
          points: 0,
          tier: 'bronze' as const,
          totalSpent: 0,
          joinDate: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          rewardsRedeemed: 0,
          isLoyaltyMember: true
        }
      };

      // Update customers list
      setCustomers(prevCustomers => 
        prevCustomers.map(c => c.id === customer.id ? updatedCustomer : c)
      );
      
      // Update filtered customers
      setFilteredCustomers(prevFiltered => 
        prevFiltered.map(c => c.id === customer.id ? updatedCustomer : c)
      );

      // Update selected customer if it's the same customer
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(updatedCustomer);
      }

      addNotification('success', 'Loyalty Enrollment', `${customer.name} has been successfully enrolled in the loyalty program!`);
    } catch (error) {
      console.error('Error adding customer to loyalty:', error);
      addNotification('error', 'Enrollment Failed', 'Failed to enroll customer in loyalty program. Please try again.');
    }
  };

  const quickActions = [
    { label: 'Hold Order', action: holdOrder, icon: Save, variant: 'warning' as const },
    { label: 'Print Receipt', action: printReceipt, icon: Printer, variant: 'outline' as const },
    { label: 'Clear Cart', action: clearCart, icon: RotateCcw, variant: 'danger' as const },
    { label: 'Smart Search', action: () => setShowSmartSearch(true), icon: Search, variant: 'secondary' as const },
    { label: 'Dashboard', action: () => setShowDashboard(true), icon: TrendingUp, variant: 'outline' as const },
    { label: 'Location', action: () => setShowLocationSelector(true), icon: Building, variant: 'outline' as const },
    { label: 'Inventory', action: () => setShowAdvancedInventory(true), icon: Package, variant: 'secondary' as const },
    { label: 'Loyalty', action: () => setShowLoyaltyProgram(true), icon: Crown, variant: 'primary' as const },
    { label: 'Gift Cards', action: openGiftCards, icon: Gift, variant: 'outline' as const },
    { label: 'Split Payment', action: openSplitPayment, icon: CreditCard, variant: 'secondary' as const },
    { label: 'Payments Accounts', action: () => setShowPaymentsAccounts(true), icon: CreditCard, variant: 'primary' as const },
    { label: 'Returns', action: openReturns, icon: RotateCcw, variant: 'warning' as const },
    { label: 'Tax Settings', action: openTaxSettings, icon: FileText, variant: 'outline' as const },
  ];

  const exitPOS = () => {
    navigate('/dashboard');
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
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleProductSelect = (product: any) => {
    // Handle both old format and new CartProduct format
    const cartItem = {
      id: product.id,
      name: product.name,
      variant: product.variant,
      price: product.price,
      stock: product.stock
    };
    
    addToCart(cartItem);
    addNotification('success', 'Product Added', `${product.name} added to cart`);
  };

  const handleLocationSelect = (location: any) => {
    setCurrentLocation(location);
    addNotification('success', 'Location Changed', `Switched to ${location.name}`);
  };



  const handleInventoryItemSelect = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.sellingPrice,
      quantity: 1
    });
    addNotification('success', 'Item Added', `${item.name} added to cart`);
  };

  const handleLoyaltyCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    addNotification('success', 'Customer Selected', `${customer.name} selected`);
  };

  const handleGiftCardRedeem = (cardNumber: string, amount: number) => {
    // Add gift card redemption to cart as a discount
    const giftCardItem: CartItem = {
      id: `gift_card_${Date.now()}`,
      name: `Gift Card Redemption`,
      quantity: 1,
      unitPrice: -amount, // Negative price for discount
      total: -amount,
      isExternal: true
    };
    
    setCart(prev => [...prev, giftCardItem]);
          addNotification('success', 'Gift Card Applied', `Tsh${amount.toLocaleString()} redeemed from gift card`);
  };

  const handleGiftCardPurchase = (amount: number) => {
    // Add gift card purchase to cart
    const giftCardItem: CartItem = {
      id: `gift_card_purchase_${Date.now()}`,
      name: `Gift Card Purchase`,
      quantity: 1,
      unitPrice: amount,
      total: amount,
      isExternal: true
    };
    
    setCart(prev => [...prev, giftCardItem]);
    addNotification('success', 'Gift Card Added', `Gift card purchase added to cart`);
  };

  const totals = calculateTotals();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        switch(e.key) {
          case 'Enter':
            if (cart.length > 0) processSale();
            break;
          case 'Escape':
            exitPOS();
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
            setActiveTab('products');
            break;
          case '2':
            setActiveTab('customers');
            break;
          case '3':
            if (selectedCustomer && cart.length > 0) setActiveTab('payment');
            break;
          case 'q':
            quickSale();
            break;
          case 's':
            setShowSmartSearch(true);
            break;
        }
      } else if (e.key === 'Escape') {
        exitPOS();
      } else if (e.key === 'F1') {
        e.preventDefault();
        // Show keyboard shortcuts help
        addNotification('info', 'Keyboard Shortcuts', 
          'Ctrl+1: Products | Ctrl+2: Customers | Ctrl+3: Payment | Ctrl+Enter: Process Sale | Ctrl+H: Hold Order | Ctrl+C: Clear Cart | Ctrl+P: Print Receipt | Ctrl+Q: Quick Sale | Ctrl+S: Smart Search');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cart.length, selectedCustomer]);

  // Click outside to close customer search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-search-container')) {
        setShowCustomerSearch(false);
      }
    };

    if (showCustomerSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomerSearch]);

  // Keyboard navigation for cart
  useEffect(() => {
    const handleCartKey = (e: KeyboardEvent) => {
      if (!cart.length) return;
      if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
      if (editingCartIndex !== null) return;
      if (e.key === 'ArrowDown') {
        setEditingCartIndex((prev) => prev === null ? 0 : Math.min(cart.length - 1, prev + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setEditingCartIndex((prev) => prev === null ? 0 : Math.max(0, prev - 1));
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editingCartIndex !== null && cart[editingCartIndex]) {
          removeFromCart(cart[editingCartIndex].id);
          setEditingCartIndex(null);
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleCartKey);
    return () => document.removeEventListener('keydown', handleCartKey);
  }, [cart, editingCartIndex]);

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate battery level changes
  useEffect(() => {
    const batteryTimer = setInterval(() => {
      setBatteryLevel(prev => Math.max(10, prev - Math.random() * 0.1));
    }, 60000); // Update every minute
    return () => clearInterval(batteryTimer);
  }, []);

  // Simulate online status
  useEffect(() => {
    const networkTimer = setInterval(() => {
      setIsOnline(Math.random() > 0.05); // 95% uptime
    }, 30000); // Check every 30 seconds
    return () => clearInterval(networkTimer);
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>

            </div>



            {/* Right Side - Icon-Only Display */}
            <div className="flex items-center gap-2">
              {/* Weather/Location */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin size={20} className="text-blue-600" />
                <span className="text-sm font-medium">{weatherInfo.temp}°</span>
              </div>

              {/* Real-time Clock */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Clock size={20} className="text-blue-600" />
                <span className="text-sm font-medium">{currentTime.toLocaleTimeString()}</span>
              </div>

              {/* Sales with Dollar Icon */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign size={20} className="text-green-600" />
                <span className="text-sm font-medium text-green-600">${todaySales.toFixed(0)}</span>
              </div>

              {/* Orders with Package Icon */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Package size={20} className="text-blue-600" />
                <span className="text-sm font-medium">{todayOrders}</span>
              </div>



              {/* Online Status */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <Wifi size={20} className={isOnline ? 'text-green-600' : 'text-red-600'} />
              </div>

              {/* Battery Status */}
              <div className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-6 h-3 border border-gray-300 rounded-sm relative">
                  <div 
                    className={`h-1.5 rounded-sm absolute top-0.5 left-0.5 transition-all duration-300 ${
                      batteryLevel > 50 ? 'bg-green-500' : batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${batteryLevel}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{Math.round(batteryLevel)}%</span>
              </div>



              {/* Quick Action Buttons - Icon Only */}
              <button 
                onClick={() => setShowQuickSearch(!showQuickSearch)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Notifications"
              >
                <Bell size={20} className="text-blue-600" />
              </button>





              {/* Dark Mode Toggle */}
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />

              {/* Quick Actions Button */}
              <div className="relative">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2"
                >
                  <PackageIcon size={20} />
                </GlassButton>
                
                {/* Quick Actions Dropdown */}
                {showQuickActions && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl z-50">
                    <div className="p-2 space-y-1">
                      {quickActions.map((action, index) => (
                        <GlassButton
                          key={index}
                          variant={action.variant}
                          size="sm"
                          onClick={() => {
                            action.action();
                            setShowQuickActions(false);
                          }}
                          className="w-full justify-start"
                        >
                          <action.icon size={16} />
                          <span className="text-sm">{action.label}</span>
                        </GlassButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <GlassButton
                variant="outline"
                size="sm"
                onClick={exitPOS}
                className="p-2"
              >
                <ArrowLeft size={20} />
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Search Bar - POS Optimized */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur-xl border-b border-gray-200/50 sticky top-[88px] z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Tab Navigation - Modern Design */}
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-200/50 shadow-sm">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'products'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  <span>Products</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'customers'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>Customers</span>
                </div>
              </button>
              {selectedCustomer && cart.length > 0 && (
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'payment'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} />
                    <span>Payment</span>
                  </div>
                </button>
              )}
            </div>

            {/* Enhanced Search Bar */}
            <div className="flex-1 relative">
              {activeTab === 'payment' && selectedCustomer ? (
                // Modern Customer Display
                <div className="w-full border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{selectedCustomer.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          {selectedCustomer.phone && <span className="flex items-center gap-1">📞 {selectedCustomer.phone}</span>}
                          {selectedCustomer.email && <span className="flex items-center gap-1">📧 {selectedCustomer.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                        selectedCustomer.type === 'retail' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {selectedCustomer.type === 'retail' ? '👤 Retail' : '🏢 Wholesale'}
                      </span>
                      {selectedCustomer.loyalty?.isLoyaltyMember && (
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                          selectedCustomer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          selectedCustomer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          selectedCustomer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          <Crown size={10} className="inline mr-1" />
                          {selectedCustomer.loyalty.points} pts
                        </span>
                      )}
                      <GlassButton 
                        variant="danger" 
                        size="sm"
                        onClick={removeSelectedCustomer}
                        className="p-2 hover:scale-105 transition-transform"
                      >
                        <X size={14} />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ) : (
                // Modern Search Bar with Smart Features
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-xl border-2 border-gray-200/50 hover:border-blue-300/50 focus-within:border-blue-400/50 focus-within:shadow-xl transition-all duration-300 shadow-lg group-focus-within:scale-[1.02]">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder={
                        activeTab === 'products' 
                          ? "🔍 Search products, scan barcode, or say 'add iPhone 13'..."
                          : activeTab === 'customers'
                          ? "🔍 Search customers by name, phone, or email..."
                          : "🔍 Search..."
                      }
                      value={activeTab === 'customers' ? customerSearchQuery : searchQuery}
                      onChange={(e) => {
                        if (activeTab === 'customers') {
                          handleCustomerSearch(e.target.value);
                        } else {
                          setSearchQuery(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && activeTab === 'products' && searchQuery.trim()) {
                          // Auto-add first product if only one result
                          const filtered = products.filter(product => 
                            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (product.model && product.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (product.product_code && product.product_code.toLowerCase().includes(searchQuery.toLowerCase()))
                          );
                          if (filtered.length === 1) {
                            const firstVariant = filtered[0].variants && filtered[0].variants.length > 0 ? filtered[0].variants[0] : null;
                            if (firstVariant) {
                              addToCart({
                                id: firstVariant.id,
                                name: `${filtered[0].name} - ${firstVariant.variant_name}`,
                                variant: firstVariant.variant_name,
                                price: firstVariant.selling_price,
                                quantity: 1
                              });
                              setSearchQuery('');
                              addNotification('success', 'Product Added', `${filtered[0].name} added to cart`);
                            }
                          }
                        }
                      }}
                      className="w-full pl-12 pr-32 py-4 text-base border-0 bg-transparent focus:ring-0 focus:outline-none placeholder-gray-400"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1.5">
                      {activeTab === 'products' && (
                        <>
                          <GlassButton 
                            variant="outline" 
                            size="sm"
                            onClick={loadProducts}
                            disabled={productsLoading}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <RotateCcw size={14} className={productsLoading ? 'animate-spin' : ''} />
                          </GlassButton>
                          <GlassButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              addNotification('info', 'Barcode Scanner', 'Barcode scanning feature coming soon!');
                            }}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <Scan size={14} />
                          </GlassButton>
                          <GlassButton 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setShowSmartSearch(true)}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <Search size={14} />
                          </GlassButton>
                          <GlassButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              addNotification('info', 'Voice Search', 'Voice search feature coming soon!');
                            }}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <Mic size={14} />
                          </GlassButton>
                        </>
                      )}
                      {activeTab === 'customers' && (
                        <>
                          <GlassButton 
                            variant="outline" 
                            size="sm"
                            onClick={loadCustomers}
                            disabled={customersLoading}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <RotateCcw size={14} className={customersLoading ? 'animate-spin' : ''} />
                          </GlassButton>
                          <GlassButton 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setShowAddCustomer(true)}
                            className="p-2 hover:scale-105 transition-transform"
                          >
                            <UserPlus size={14} />
                          </GlassButton>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Customer Search Suggestions Dropdown */}
                  {activeTab === 'customers' && showCustomerSearch && customerSearchResults.length > 0 && !selectedCustomer && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                      <div className="p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-3 px-2 uppercase tracking-wide">Search Results</div>
                        {customerSearchResults.map((customer: any) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomer(customer)}
                            className="flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200/50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                                <User size={18} className="text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-600">
                                  {customer.phone && `📞 ${customer.phone}`}
                                  {customer.phone && customer.email && ' • '}
                                  {customer.email && `📧 ${customer.email}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Loyalty Status */}
                              {customer.loyalty?.isLoyaltyMember ? (
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                                    customer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    customer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    customer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                    'bg-orange-100 text-orange-700 border-orange-200'
                                  }`}>
                                    <Crown size={10} className="inline mr-1" />
                                    {customer.loyalty.tier.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {customer.loyalty.points} pts
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Not enrolled</span>
                              )}
                              <ChevronRight size={16} className="text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer" onClick={() => cart.length > 0 && setActiveTab('payment')}>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <ShoppingCart size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-medium">Cart Items</div>
                  <div className="text-lg font-bold text-blue-700">{cart.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <DollarSign size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-green-600 font-medium">Total</div>
                  <div className="text-lg font-bold text-green-700">Tsh{calculateTotals().total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'products' && (
                <div>
                  {/* Loading State */}
                  {productsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading products...</span>
                    </div>
                  )}

                  {/* Products Grid */}
                  {!productsLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => {
                        // Get the first variant for pricing and stock info
                        const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
                        const price = firstVariant ? firstVariant.selling_price : 0;
                        const stock = firstVariant ? firstVariant.available_quantity : 0;
                        
                        return (
                          <GlassCard
                            key={product.id}
                            data-product-id={product.id}
                            className="hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => {
                              if (firstVariant) {
                                addToCart({
                                  id: firstVariant.id,
                                  name: `${product.name} - ${firstVariant.variant_name}`,
                                  variant: firstVariant.variant_name,
                                  price: firstVariant.selling_price,
                                  quantity: 1
                                });
                              } else {
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  price: 0,
                                  quantity: 1
                                });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm line-clamp-2">
                                {product.name}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                stock > 10 
                                  ? 'bg-green-100 text-green-800' 
                                  : stock > 3 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {stock} in stock
                              </span>
                            </div>
                            
                            {product.brand && (
                              <p className="text-xs text-gray-600 mb-1">Brand: {product.brand}</p>
                            )}
                            
                            {product.category && (
                              <p className="text-xs text-gray-600 mb-2">Category: {product.category.name}</p>
                            )}

                            {firstVariant ? (
                              <p className="text-2xl font-bold text-blue-600 mb-3">Tsh{price.toLocaleString()}</p>
                            ) : (
                              <p className="text-sm text-gray-500 mb-3">No variants available</p>
                            )}

                            <div className="flex items-center gap-2">
                              <GlassButton 
                                variant="primary" 
                                size="sm" 
                                className="flex-1 group-hover:scale-105 transition-transform"
                              >
                                <Plus size={14} />
                                Add to Cart
                              </GlassButton>
                              {stock <= 3 && stock > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  Low Stock!
                                </div>
                              )}

                            </div>

                            {/* Show variant count if multiple variants */}
                            {product.variants && product.variants.length > 1 && (
                              <div className="mt-2 text-xs text-gray-500">
                                {product.variants.length} variants available
                              </div>
                            )}
                          </GlassCard>
                        );
                      })}
                    </div>
                  )}

                  {/* No Products Found */}
                  {!productsLoading && filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-600">Try adjusting your search or check if products are available.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'customers' && (
                <div>
                  {/* Loading State */}
                  {customersLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Loading customers...</span>
                    </div>
                  )}

                  {/* Selected Customer Display */}
                  {selectedCustomer && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <User size={20} className="text-green-600" />
                          Selected Customer
                        </h3>
                        <GlassButton
                          onClick={removeSelectedCustomer}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={16} />
                          <span>Clear</span>
                        </GlassButton>
                      </div>
                      
                      {/* Modern Customer Card */}
                      <GlassCard className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
                        {/* Top Section - Customer Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {selectedCustomer.name.charAt(0)}
                            </div>
                            {selectedCustomer.loyalty?.isLoyaltyMember && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                                <Crown size={12} className="text-yellow-800" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-900 text-xl">{selectedCustomer.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                selectedCustomer.type === 'retail' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {selectedCustomer.type === 'retail' ? '👤 Retail' : '🏢 Wholesale'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{selectedCustomer.phone}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {selectedCustomer.loyalty?.isLoyaltyMember 
                                  ? `Loyalty Member • ${selectedCustomer.loyalty.tier} tier`
                                  : 'New Customer'
                                }
                              </span>
                              <span className="text-xs text-green-600 font-medium">✓ Active for POS</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Section - Key Metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                              {selectedCustomer.loyalty?.isLoyaltyMember ? selectedCustomer.loyalty.points : '0'}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">LOYALTY POINTS</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                              {selectedCustomer.loyalty?.isLoyaltyMember ? selectedCustomer.loyalty.totalSpent.toLocaleString() : '0'}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">TOTAL SPENT</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">0</div>
                            <div className="text-xs text-gray-600 font-medium">ORDERS</div>
                          </div>
                        </div>

                        {/* Bottom Section - Actions */}
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {!selectedCustomer.loyalty?.isLoyaltyMember ? (
                              <GlassButton
                                onClick={() => addCustomerToLoyalty(selectedCustomer)}
                                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium"
                              >
                                <Crown size={16} className="mr-2" />
                                Add to Loyalty Program
                              </GlassButton>
                            ) : (
                              <GlassButton
                                onClick={() => setShowLoyaltyProgram(true)}
                                variant="outline"
                                className="flex-1"
                              >
                                <Award size={16} className="mr-2" />
                                Manage Loyalty
                              </GlassButton>
                            )}
                            
                            <GlassButton
                              onClick={() => navigate(`/orders?customer=${selectedCustomer.id}`)}
                              variant="outline"
                              className="px-4"
                            >
                              <Receipt size={16} />
                            </GlassButton>
                          </div>
                          
                          {/* Reward/Gift Section */}
                          <div className="flex gap-2">
                            <GlassButton
                              onClick={() => {
                                // TODO: Implement reward points functionality
                                addNotification('success', 'Reward Points', 'Points added successfully to customer account');
                              }}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                            >
                              <Gift size={16} className="mr-2" />
                              Reward Points
                            </GlassButton>
                            
                            <GlassButton
                              onClick={() => {
                                // TODO: Implement gift card functionality
                                addNotification('success', 'Gift Card Sent', 'Gift card has been sent to customer');
                              }}
                              variant="outline"
                              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              <CreditCard size={16} className="mr-2" />
                              Send Gift Card
                            </GlassButton>
                          </div>
                          
                          {/* Free Gift Section */}
                          <div className="flex gap-2">
                            <GlassButton
                              onClick={() => {
                                // TODO: Implement free gift product selection
                                addNotification('info', 'Free Gift', 'Select products to give as free gift to customer');
                              }}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                            >
                              <Package size={16} className="mr-2" />
                              Give Free Gift
                            </GlassButton>
                            
                            <GlassButton
                              onClick={() => {
                                // TODO: Implement quick free gift with predefined items
                                addNotification('success', 'Quick Gift', 'Free gift added to customer account');
                              }}
                              variant="outline"
                              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <Bolt size={16} className="mr-2" />
                              Quick Gift
                            </GlassButton>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  )}

                  {/* Customers Grid - Loyalty Style */}
                  {!customersLoading && !selectedCustomer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCustomers.slice(0, 6).map((customer) => (
                        <GlassCard
                          key={customer.id}
                          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                            !customer.loyalty?.isLoyaltyMember ? 'border-2 border-dashed border-gray-300' : ''
                          } ${
                            selectingCustomer === customer.id 
                              ? 'ring-4 ring-green-500 ring-opacity-50 scale-105 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50' 
                              : ''
                          }`}
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                              <p className="text-sm text-gray-600">{customer.phone}</p>
                              {customer.email && (
                                <p className="text-xs text-gray-500">{customer.email}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {customer.loyalty?.isLoyaltyMember ? (
                                <>
                                  <Crown size={16} className="text-yellow-500" />
                                  <span className={`text-xs px-2 py-1 rounded-full border ${
                                    customer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    customer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    customer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                    'bg-orange-100 text-orange-700 border-orange-200'
                                  }`}>
                                    {customer.loyalty.tier}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                                  Non-Member
                                </span>
                              )}
                            </div>
                          </div>

                          {customer.loyalty?.isLoyaltyMember ? (
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Points:</span>
                                <span className="font-semibold text-purple-600">{customer.loyalty.points.toLocaleString()}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Spent:</span>
                                <span className="font-medium">Tsh{customer.loyalty.totalSpent.toLocaleString()}</span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Rewards Redeemed:</span>
                                <span className="font-medium">{customer.loyalty.rewardsRedeemed}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 mb-4">
                              <div className="text-sm text-gray-500 italic">
                                Not enrolled in loyalty program
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mb-3">
                            {customer.loyalty?.isLoyaltyMember 
                              ? `Member since ${customer.loyalty.joinDate ? new Date(customer.loyalty.joinDate).toLocaleDateString() : 'N/A'}`
                              : `Customer since ${new Date().toLocaleDateString()}`
                            }
                          </div>

                          {!customer.loyalty?.isLoyaltyMember ? (
                            <div className="flex items-center gap-2">
                              <GlassButton 
                                variant="outline" 
                                size="sm"
                                className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20"
                                onClick={() => addCustomerToLoyalty(customer)}
                              >
                                <Crown size={14} />
                                <span className="ml-1">Add to Loyalty</span>
                              </GlassButton>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <GlassButton 
                                variant="outline" 
                                size="sm"
                                className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20"
                                onClick={() => {
                                  // TODO: Implement reward points functionality
                                  addNotification('info', 'Reward Points', `Award points to ${customer.name}`);
                                }}
                              >
                                <Award size={14} />
                                <span className="ml-1">Reward Points</span>
                              </GlassButton>
                            </div>
                          )}
                        </GlassCard>
                      ))}
                    </div>
                  )}



                  {/* No Customers Found */}
                  {!customersLoading && filteredCustomers.length === 0 && (
                    <div className="text-center py-12">
                      <User size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                      <p className="text-gray-600">Try adjusting your search or add a new customer.</p>
                    </div>
                  )}


                </div>
              )}

                            {activeTab === 'payment' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                  {!paymentSelected && !paymentAccount ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Account</h3>
                      <p className="text-sm text-gray-600 mb-4">Select a payment method to continue</p>
                      {paymentAccountsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-gray-600">Loading payment accounts...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {paymentAccounts.length > 0 ? (
                            paymentAccounts.map((account) => (
                              <button
                                key={account.id}
                                onClick={() => handlePaymentSelect(account.id)}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center text-center ${
                                  paymentAccount === account.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{ borderColor: paymentAccount === account.id ? financeAccountService.getColorForAccountType(account.type) : undefined }}
                              >
                                <div className="relative w-full">
                                  <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-3"
                                    style={{ backgroundColor: financeAccountService.getColorForAccountType(account.type) + '20' }}
                                  >
                                    {account.payment_icon && account.payment_icon.trim() ? (
                                      <img 
                                        src={
                                          account.payment_icon.startsWith('http://') || account.payment_icon.startsWith('https://') 
                                            ? account.payment_icon 
                                            : `/icons/payment-methods/${account.payment_icon}`
                                        }
                                        alt="Payment icon" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.warn(`Failed to load payment icon: ${account.payment_icon}`);
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <span 
                                      className={`text-lg font-medium ${account.payment_icon && account.payment_icon.trim() ? 'hidden' : ''}`}
                                      style={{ color: financeAccountService.getColorForAccountType(account.type) }}
                                    >
                                      {financeAccountService.getIconForAccountType(account.type)}
                                    </span>
                                  </div>
                                  
                                  {paymentAccount === account.id && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center">
                                  <span className="font-medium text-gray-900 text-sm block">{account.name}</span>
                                  <p className="text-xs text-gray-500 mt-1">{account.type}</p>
                                  <p className="text-xs font-semibold text-gray-700 mt-1">${account.balance.toFixed(2)}</p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <p>No payment accounts available</p>
                              <p className="text-sm">Please add payment accounts in the admin panel</p>
                            </div>
                          )}
                          
                          {/* Continue to Delivery Button */}
                          {paymentAccount && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <GlassButton
                                onClick={() => setPaymentSelected(true)}
                                className="w-full flex items-center justify-center gap-2"
                                size="lg"
                              >
                                <Truck size={16} />
                                <span>Continue to Delivery</span>
                              </GlassButton>
                            </div>
                          )}
                          
                          {/* Manage Accounts Button */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <GlassButton
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPaymentsAccounts(true)}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <CreditCard size={16} />
                              <span>Manage Payment Accounts</span>
                            </GlassButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
                        <GlassButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaymentSelected(false);
                            setPaymentAccount('');
                          }}
                        >
                          ← Back to Payment
                        </GlassButton>
                      </div>
                      <div className="space-y-4">


                        {/* Complete Sale Button */}
                        <div className="pt-4 border-t border-gray-200">
                          <GlassButton
                            onClick={processSaleWithDelivery}
                            className="w-full flex items-center justify-center gap-2"
                            size="lg"
                          >
                            <CreditCard size={20} />
                            <span>Complete Sale</span>
                          </GlassButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart & Summary */}
          <div className="col-span-4 space-y-6">
            {/* Cart */}
            <GlassCard className="bg-white/90">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <ShoppingCart size={20} />
                  Cart ({cart.length})
                </h2>
                <button 
                  className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  title="Clear Cart"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-base truncate">{selectedCustomer.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{selectedCustomer.phone || 'No phone'}</p>
                        {selectedCustomer.loyalty?.isLoyaltyMember && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                              selectedCustomer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                              selectedCustomer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                              selectedCustomer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              <Crown size={10} className="inline mr-1" />
                              {selectedCustomer.loyalty.tier.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {selectedCustomer.loyalty.points} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-3"
                      onClick={removeSelectedCustomer}
                      title="Remove Customer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-base">Your cart is empty</p>
                  <p className="text-sm">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={item.id} className={`bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-200 ${editingCartIndex === idx ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-sm'}`}
                      tabIndex={0}
                      onClick={() => setEditingCartIndex(idx)}
                      onFocus={() => setEditingCartIndex(idx)}
                      ref={idx === 0 ? cartListRef : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-base truncate">{item.name}</h3>
                              {item.variant && (
                                <p className="text-sm text-gray-500 truncate">{item.variant}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1.5">
                            <button
                              className="w-10 h-10 rounded-md bg-white text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center text-lg font-bold"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity - 1);
                              }}
                            >
                              -
                            </button>
                            {editingCartIndex === idx ? (
                              <input
                                type="number"
                                className="w-12 text-center text-base font-medium border-0 bg-transparent focus:ring-0 focus:outline-none"
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
                                className="w-12 text-center text-base font-medium cursor-pointer hover:bg-blue-50 rounded px-2 py-1"
                                tabIndex={0}
                                onClick={() => setEditingCartIndex(idx)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') setEditingCartIndex(idx);
                                }}
                              >
                                {item.quantity}
                              </span>
                            )}
                            <button
                              className="w-10 h-10 rounded-md bg-white text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center text-lg font-bold"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, item.quantity + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right min-w-0">
                            <p className="text-sm text-gray-500">Tsh{item.unitPrice.toLocaleString()}</p>
                            <p className="font-semibold text-gray-900 text-base">Tsh{item.total.toLocaleString()}</p>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            className="w-10 h-10 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.id);
                            }}
                          >
                            <X size={16} />
                          </button>
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
                                      <span>Tsh{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                                      <span>Tsh{totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                                      <span>Tsh{totals.shipping.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>Tsh{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amount Paid */}

                {/* Amount Paid */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Amount Paid
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const totals = calculateTotals();
                        setAmountPaid(totals.total);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Fill Total
                    </button>
                  </div>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="0.00"
                  />
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Balance:</span>
                    <span className={totals.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      Tsh{totals.balance.toLocaleString()}
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
                  Proceed to Payment
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
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      <div className="fixed bottom-20 right-6 z-40">
        <div className="relative">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <PackageIcon size={24} />
          </GlassButton>
          
          {/* Floating Action Items */}
          {showQuickActions && (
            <div className="absolute bottom-full right-0 mb-3 space-y-2">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="opacity-0 animate-pulse"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeIn 0.3s ease-out forwards'
                  }}
                >
                  <GlassButton
                    variant={action.variant}
                    size="sm"
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    <action.icon size={20} />
                  </GlassButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            {/* Left Side - Utility Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={printReceipt}
                disabled={cart.length === 0}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Print Receipt
                </span>
              </button>
              
              <button
                onClick={openCashDrawer}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <DollarSign size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Cash Drawer
                </span>
              </button>
              
              <button
                onClick={quickSale}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <PackageIcon size={18} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Quick Sale
                </span>
              </button>
              
              <button
                onClick={() => setShowSmartSearch(true)}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Search size={18} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Smart Search
                </span>
              </button>
              
              <button
                onClick={() => setShowDashboard(true)}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <TrendingUp size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Dashboard
                </span>
              </button>
              
              <button
                onClick={openSplitPayment}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <CreditCardIcon size={18} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Split Payment
                </span>
              </button>
              
              <button
                onClick={openReturns}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <RotateCcwIcon size={18} className="text-gray-600 group-hover:text-red-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Returns
                </span>
              </button>
            </div>

            {/* Center - Primary Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={holdOrder}
                disabled={cart.length === 0}
                className="group relative p-4 rounded-xl bg-amber-500/90 hover:bg-amber-600/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
              >
                <Save size={20} />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Hold Order
                </span>
              </button>
              
              <button
                onClick={processSale}
                disabled={cart.length === 0}
                className="group relative p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105"
              >
                <Receipt size={24} />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Process Sale
                </span>
              </button>
              
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="group relative p-4 rounded-xl bg-gray-500/90 hover:bg-gray-600/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
              >
                <RotateCcw size={20} />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Clear Cart
                </span>
              </button>
            </div>

            {/* Right Side - Settings */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoyaltyProgram(true)}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Crown size={18} className="text-gray-600 group-hover:text-yellow-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Loyalty
                </span>
              </button>
              
              <button
                onClick={() => setShowLocationSelector(true)}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Building size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Location
                </span>
              </button>
              
              <button
                onClick={() => setShowAdvancedInventory(true)}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Package size={18} className="text-gray-600 group-hover:text-orange-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Inventory
                </span>
              </button>
              
              <button
                onClick={openGiftCards}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Gift size={18} className="text-gray-600 group-hover:text-pink-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Gift Cards
                </span>
              </button>
              
              <button
                onClick={openSettings}
                className="group relative p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
              >
                <Settings size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  POS Settings
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <POSSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Customer Modal - Using Existing Component */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
      />

      {/* Mini Sales Dashboard */}
      <MiniSalesDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />

      {/* Smart Product Search */}
      <SmartProductSearch
        isOpen={showSmartSearch}
        onProductSelect={handleProductSelect}
        onClose={() => setShowSmartSearch(false)}
      />

      {/* Smart Notifications */}
      <SmartNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Location Selector */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation}
      />

      {/* Advanced Inventory Management */}
      <AdvancedInventory
        isOpen={showAdvancedInventory}
        onClose={() => setShowAdvancedInventory(false)}
        onItemSelect={handleInventoryItemSelect}
      />

      {/* Loyalty Program */}
      <LoyaltyProgram
        isOpen={showLoyaltyProgram}
        onClose={() => setShowLoyaltyProgram(false)}
        onCustomerSelect={handleLoyaltyCustomerSelect}
      />

      {/* Gift Card Manager */}
      <GiftCardManager
        isOpen={showGiftCardManager}
        onClose={() => setShowGiftCardManager(false)}
        onGiftCardRedeem={handleGiftCardRedeem}
        onGiftCardPurchase={handleGiftCardPurchase}
      />

      {/* Finance Accounts Modal */}
      <FinanceAccountsModal
        isOpen={showPaymentsAccounts}
        onClose={() => setShowPaymentsAccounts(false)}
      />

      {/* Payment Selection Modal */}
      <PaymentSelectionModal
        isOpen={showPaymentSelection}
        onClose={() => setShowPaymentSelection(false)}
        onPaymentSelect={handlePaymentSelect}
        totalAmount={calculateTotals().total}
      />



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
              <li><b>Ctrl+Q</b>: Quick Sale</li>
              <li><b>Ctrl+S</b>: Smart Search</li>
              <li><b>F1</b>: Show this help</li>
              <li><b>Esc</b>: Exit POS</li>
            </ul>
            <div className="mt-6 text-sm text-gray-500">Tip: You can use these shortcuts anywhere in the POS for super-fast sales!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage; 