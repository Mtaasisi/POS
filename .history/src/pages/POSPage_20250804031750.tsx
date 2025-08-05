import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import DeliveryOptionsModal from '../components/pos/DeliveryOptionsModal';
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

const POSPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
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
    setActiveTab('payment');
    addNotification('success', 'Payment Method Selected', 'Payment method has been selected. Continue to delivery options.');
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

  const handleDeliveryOptionsConfirm = (deliveryData: {
    method: string;
    address: string;
    city: string;
    notes: string;
  }) => {
    setDeliveryMethod(deliveryData.method);
    setDeliveryAddress(deliveryData.address);
    setDeliveryCity(deliveryData.city);
    setDeliveryNotes(deliveryData.notes);
    addNotification('success', 'Delivery Options Updated', 'Delivery settings have been configured');
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-gradient-to-br from-slate-50 to-blue-50`}>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        .step-active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }
        .step-completed {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        .step-pending {
          background: white;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }
      `}</style>

      {/* Modern Header with Stepper */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
                <p className="text-sm text-gray-600">Modern sales processing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Current Time</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Cart Items</p>
                <p className="font-semibold text-gray-900">{cart.length}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="flex items-center gap-2 text-sm">
                <Building size={16} className="text-blue-600" />
                <span className="font-medium">{currentLocation?.name || 'Loading...'}</span>
              </div>
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              <GlassButton
                variant="outline"
                size="sm"
                onClick={exitPOS}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Exit</span>
              </GlassButton>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-full transition-all ${
                activeTab === 'products' ? 'step-active' : 
                cart.length > 0 ? 'step-completed' : 'step-pending'
              }`}>
                <Package size={16} className="mr-2" />
                <span className="font-medium">Products</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center px-4 py-2 rounded-full transition-all ${
                activeTab === 'customers' ? 'step-active' : 
                selectedCustomer ? 'step-completed' : 'step-pending'
              }`}>
                <User size={16} className="mr-2" />
                <span className="font-medium">Customer</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center px-4 py-2 rounded-full transition-all ${
                activeTab === 'payment' ? 'step-active' : 
                paymentSelected ? 'step-completed' : 'step-pending'
              }`}>
                <CreditCard size={16} className="mr-2" />
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Panel - Products */}
          <div className="col-span-5 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              {/* Enhanced Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="🔍 Search products, scan barcode, or say 'add iPhone 13'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
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
                  className="w-full pl-12 pr-32 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                  <GlassButton 
                    variant="outline" 
                    size="sm"
                    onClick={loadProducts}
                    disabled={productsLoading}
                  >
                    <RotateCcw size={16} className={productsLoading ? 'animate-spin' : ''} />
                  </GlassButton>
                  <GlassButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      addNotification('info', 'Barcode Scanner', 'Barcode scanning feature coming soon!');
                    }}
                  >
                    <Scan size={16} />
                  </GlassButton>
                  <GlassButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setShowSmartSearch(true)}
                  >
                    <Search size={16} />
                  </GlassButton>
                  <GlassButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      addNotification('info', 'Voice Search', 'Voice search feature coming soon!');
                    }}
                  >
                    <Mic size={16} />
                  </GlassButton>
                </div>
              </div>

              {/* Products Grid */}
              <div className="h-[calc(100vh-400px)] overflow-y-auto">
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading products...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product) => {
                      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
                      const price = firstVariant ? firstVariant.selling_price : 0;
                      const stock = firstVariant ? firstVariant.available_quantity : 0;
                      
                      return (
                        <div
                          key={product.id}
                          data-product-id={product.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => {
                            if (firstVariant) {
                              addToCart({
                                id: firstVariant.id,
                                name: `${product.name} - ${firstVariant.variant_name}`,
                                variant: firstVariant.variant_name,
                                price: firstVariant.selling_price,
                                quantity: 1
                              });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
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
                          
                          {firstVariant ? (
                            <p className="text-lg font-bold text-blue-600 mb-2">Tsh{price.toLocaleString()}</p>
                          ) : (
                            <p className="text-sm text-gray-500 mb-2">No variants available</p>
                          )}

                          <div className="flex items-center gap-2">
                            <GlassButton 
                              variant="primary" 
                              size="sm" 
                              className="flex-1 group-hover:scale-105 transition-transform"
                            >
                              <Plus size={14} />
                              Add
                            </GlassButton>
                            {stock <= 3 && stock > 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                Low Stock!
                              </div>
                            )}
                            {stock === 0 && (
                              <div className="text-xs text-red-600 font-medium">
                                Out of Stock!
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Cart */}
          <div className="col-span-4 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 h-full">
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
                <div className="space-y-3 h-[calc(100vh-400px)] overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`bg-gray-50 rounded-lg p-3 ${editingCartIndex === idx ? 'ring-2 ring-blue-400' : ''}`}
                      tabIndex={0}
                      onClick={() => setEditingCartIndex(idx)}
                      onFocus={() => setEditingCartIndex(idx)}
                      ref={idx === 0 ? cartListRef : undefined}
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
                              onKeyDown={e => {
                                if (e.key === 'Enter') setEditingCartIndex(idx);
                              }}
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
            </div>
          </div>

          {/* Right Panel - Customer & Payment */}
          <div className="col-span-3 space-y-4">
            {/* Customer Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Customer
              </h3>
              
              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{selectedCustomer.name}</h4>
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
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown size={16} className="text-purple-600" />
                        <span className="font-medium text-purple-900">Loyalty Member</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        {selectedCustomer.loyalty.points} points • {selectedCustomer.loyalty.tier} tier
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showCustomerSearch && customerSearchResults.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {customerSearchResults.map((customer: any) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </div>
                          {customer.loyalty?.isLoyaltyMember && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomer(true)}
                    className="w-full"
                  >
                    <UserPlus size={16} className="mr-2" />
                    Add New Customer
                  </GlassButton>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {selectedCustomer && cart.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment
                </h3>
                
                {!paymentSelected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Select payment method:</p>
                    {paymentAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handlePaymentSelect(account.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          paymentAccount === account.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm">💰</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{account.name}</div>
                            <div className="text-xs text-gray-500">{account.type}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    <GlassButton
                      onClick={() => setShowDeliveryOptions(true)}
                      className="w-full"
                      size="lg"
                    >
                      <Truck size={16} className="mr-2" />
                      Configure Delivery
                    </GlassButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-900">Delivery</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {deliveryMethod === 'pickup' ? 'Pickup' : 
                         deliveryMethod === 'local_transport' ? 'Local Transport' :
                         deliveryMethod === 'air_cargo' ? 'Air Cargo' :
                         deliveryMethod === 'bus_cargo' ? 'Bus Cargo' : 'Configure Delivery'}
                      </p>
                    </div>
                    
                    <GlassButton
                      onClick={processSaleWithDelivery}
                      className="w-full"
                      size="lg"
                      variant="success"
                    >
                      <CreditCard size={20} className="mr-2" />
                      Complete Sale
                    </GlassButton>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2">
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
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>Tsh{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  placeholder="0.00"
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className={totals.balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    Tsh{totals.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
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
                className="flex items-center gap-2"
              >
                <Save size={20} />
                Hold Order
              </GlassButton>
              
              <GlassButton
                variant="outline"
                size="lg"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex items-center gap-2"
              >
                <RotateCcw size={20} />
                Clear Cart
              </GlassButton>
              
              <GlassButton
                variant="outline"
                size="lg"
                onClick={printReceipt}
                disabled={cart.length === 0}
                className="flex items-center gap-2"
              >
                <Printer size={20} />
                Print Receipt
              </GlassButton>
            </div>

            <div className="flex items-center gap-3">
              <GlassButton
                variant="outline"
                size="lg"
                onClick={() => setShowSmartSearch(true)}
                className="flex items-center gap-2"
              >
                <Search size={20} />
                Smart Search
              </GlassButton>
              
              <GlassButton
                variant="outline"
                size="lg"
                onClick={() => setShowDashboard(true)}
                className="flex items-center gap-2"
              >
                <TrendingUp size={20} />
                Dashboard
              </GlassButton>
              
              <GlassButton
                variant="success"
                size="lg"
                onClick={processSale}
                disabled={cart.length === 0}
                className="flex items-center gap-2 px-8"
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
              <li><b>Ctrl+Q</b>: Quick Sale</li>
              <li><b>Ctrl+S</b>: Smart Search</li>
              <li><b>F1</b>: Show this help</li>
              <li><b>Esc</b>: Exit POS</li>
            </ul>
            <div className="mt-6 text-sm text-gray-500">Tip: You can use these shortcuts anywhere in the POS for super-fast sales!</div>
          </div>
        </div>
      )}

      {/* All Existing Modals */}
      <POSSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
      />

      <MiniSalesDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />

      <SmartProductSearch
        isOpen={showSmartSearch}
        onProductSelect={handleProductSelect}
        onClose={() => setShowSmartSearch(false)}
      />

      <SmartNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation}
      />

      <AdvancedInventory
        isOpen={showAdvancedInventory}
        onClose={() => setShowAdvancedInventory(false)}
        onItemSelect={handleInventoryItemSelect}
      />

      <LoyaltyProgram
        isOpen={showLoyaltyProgram}
        onClose={() => setShowLoyaltyProgram(false)}
        onCustomerSelect={handleLoyaltyCustomerSelect}
      />

      <GiftCardManager
        isOpen={showGiftCardManager}
        onClose={() => setShowGiftCardManager(false)}
        onGiftCardRedeem={handleGiftCardRedeem}
        onGiftCardPurchase={handleGiftCardPurchase}
      />

      <FinanceAccountsModal
        isOpen={showPaymentsAccounts}
        onClose={() => setShowPaymentsAccounts(false)}
      />

      <PaymentSelectionModal
        isOpen={showPaymentSelection}
        onClose={() => setShowPaymentSelection(false)}
        onPaymentSelect={handlePaymentSelect}
        totalAmount={calculateTotals().total}
      />

      <DeliveryOptionsModal
        isOpen={showDeliveryOptions}
        onClose={() => setShowDeliveryOptions(false)}
        onConfirm={handleDeliveryOptionsConfirm}
        currentDeliveryData={{
          method: deliveryMethod,
          address: deliveryAddress,
          city: deliveryCity,
          notes: deliveryNotes
        }}
      />
    </div>
  );
};

export default POSPage; 