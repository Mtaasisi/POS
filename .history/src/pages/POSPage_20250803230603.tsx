import React, { useState, useEffect } from 'react';
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
import PaymentsAccountsModal from '../components/pos/PaymentsAccountsModal';
import { posApi } from '../lib/posApi';
import { supabase } from '../lib/supabaseClient';
import { getProducts, searchProducts, Product } from '../lib/inventoryApi';
import { paymentAccountService, PaymentAccount } from '../lib/paymentMethodService';
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
  ChevronRight
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
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
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
  const [currentLocation, setCurrentLocation] = useState<any>({
    id: '1',
    name: 'Main Repair Center',
    address: '123 Tech Street, Lagos',
    status: 'active'
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectingCustomer, setSelectingCustomer] = useState<string | null>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadPaymentAccounts();
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
      const accounts = await paymentAccountService.getActivePaymentAccounts();
      setPaymentAccounts(accounts);
      
      // Set default payment account if available
      if (accounts.length > 0 && !accounts.find(a => a.id === paymentAccount)) {
        setPaymentAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading payment accounts:', error);
      setPaymentAccounts([]);
    } finally {
      setPaymentAccountsLoading(false);
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
    if (cart.length === 0) return;
    
    try {
      // Calculate totals
      const totals = calculateTotals();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Create sale order
      const orderData = {
        customer_id: selectedCustomer?.id,
        total_amount: totals.subtotal,
        discount_amount: 0, // Add discount logic if needed
        tax_amount: totals.tax,
        shipping_cost: totals.shipping,
        final_amount: totals.total,
        amount_paid: amountPaid,
        balance_due: totals.balance,
        payment_account_id: paymentAccount,
        customer_type: customerType,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_method: deliveryMethod as 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup',
        delivery_notes: deliveryNotes,
        location_id: currentLocation.id,
        created_by: user.id,
        status: (amountPaid >= totals.total ? 'completed' : 'partially_paid') as 'completed' | 'partially_paid'
      };
      
      const saleOrder = await posApi.createSaleOrder(orderData);
      
      // Create sale order items
      for (const item of cart) {
        const orderItem = {
          order_id: saleOrder.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_cost: item.unitPrice * 0.7, // Mock cost (70% of selling price)
          item_total: item.total,
          is_external_product: item.isExternal || false
        };
        
        // Insert order item
        await supabase
          .from('sales_order_items')
          .insert([orderItem]);
        
        // Deduct inventory if not external product
        if (!item.isExternal) {
          try {
            await posApi.deductInventory(item.id, item.quantity);
          } catch (error) {
            console.warn('Failed to deduct inventory:', error);
          }
        }
      }
      
      // Update loyalty points if customer is selected
      if (selectedCustomer) {
        try {
          const pointsToAdd = Math.floor(totals.total / 100); // 1 point per ₦100
          await posApi.updateLoyaltyPoints(selectedCustomer.id, pointsToAdd);
        } catch (error) {
          console.warn('Failed to update loyalty points:', error);
        }
      }
      
      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer(null);
      setAmountPaid(0);
      setDeliveryAddress('');
      setDeliveryCity('');
      setDeliveryNotes('');
      
      addNotification('success', 'Sale Completed', `Transaction processed successfully. Order ID: ${saleOrder.id}`);
      
    } catch (error) {
      console.error('Error processing sale:', error);
      addNotification('error', 'Sale Failed', 'Failed to process transaction. Please try again.');
    }
  };

  const holdOrder = () => {
    console.log('Holding order');
    addNotification('warning', 'Order Held', 'Order has been placed on hold');
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
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

      // Switch to payments tab after selection effect
      setTimeout(() => {
        setActiveTab('payment');
        addNotification('info', 'Ready for Payment', 'Customer selected! Proceed to payment options.');
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
    addNotification('success', 'Gift Card Applied', `₦${amount.toLocaleString()} redeemed from gift card`);
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
        }
      } else if (e.key === 'Escape') {
        exitPOS();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cart.length]);

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
              
              {/* Current Location Display */}
              <div className="flex items-center gap-2 text-sm">
                <Building size={16} className="text-blue-600" />
                <span className="font-medium">{currentLocation.name}</span>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
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
                  className="flex items-center gap-2"
                >
                  <PackageIcon size={16} />
                  <span className="hidden sm:inline">Quick Actions</span>
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
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Exit POS</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Search Bar / Selected Customer Display */}
            <div className="relative">
              {activeTab === 'payment' && selectedCustomer ? (
                // Minimal Customer Display in Search Bar Area
                <div className="w-full border border-green-300 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                          {selectedCustomer.email && <span>📧 {selectedCustomer.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        selectedCustomer.type === 'retail' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedCustomer.type === 'retail' ? '👤 Retail' : '🏢 Wholesale'}
                      </span>
                      {selectedCustomer.loyalty?.isLoyaltyMember && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          selectedCustomer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                          selectedCustomer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          selectedCustomer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          <Crown size={10} className="inline mr-1" />
                          {selectedCustomer.loyalty.points} pts
                        </span>
                      )}
                      <GlassButton 
                        variant="danger" 
                        size="sm"
                        onClick={removeSelectedCustomer}
                      >
                        <X size={14} />
                      </GlassButton>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular Search Bar
                <>
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'products' 
                        ? "Search products by name, SKU, or scan barcode..."
                        : activeTab === 'customers'
                        ? "Search customers by name, phone, or email..."
                        : "Search..."
                    }
                    value={activeTab === 'customers' ? customerSearchQuery : searchQuery}
                    onChange={(e) => {
                      if (activeTab === 'customers') {
                        handleCustomerSearch(e.target.value);
                      } else {
                        setSearchQuery(e.target.value);
                      }
                    }}
                    className="w-full pl-12 pr-24 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                    {activeTab === 'products' && (
                      <>
                        <GlassButton 
                          variant="outline" 
                          size="sm"
                          onClick={loadProducts}
                          disabled={productsLoading}
                        >
                          <RotateCcw size={16} className={productsLoading ? 'animate-spin' : ''} />
                        </GlassButton>
                        <GlassButton variant="outline" size="sm">
                          <Scan size={16} />
                        </GlassButton>
                        <GlassButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setShowSmartSearch(true)}
                        >
                          <Search size={16} />
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
                        >
                          <RotateCcw size={16} className={customersLoading ? 'animate-spin' : ''} />
                        </GlassButton>
                        <GlassButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setShowAddCustomer(true)}
                        >
                          <UserPlus size={16} />
                        </GlassButton>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Customer Search Suggestions Dropdown */}
              {showCustomerSearch && customerSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">Search Results</div>
                    {customerSearchResults.map((customer: any) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{customer.name}</div>
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
                            <div className="flex items-center gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                customer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                                customer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                customer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                <Crown size={10} className="inline mr-1" />
                                {customer.loyalty.tier.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {customer.loyalty.points} pts
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not enrolled</span>
                          )}
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
            </div>

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
                              <p className="text-2xl font-bold text-blue-600 mb-3">₦{price.toLocaleString()}</p>
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
                              {stock === 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  Out of Stock!
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

                  {/* Customers Grid - Loyalty Style */}
                  {!customersLoading && (
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
                                <span className="font-medium">₦{customer.loyalty.totalSpent.toLocaleString()}</span>
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

                  {/* Selected Customer Display */}
                  {selectedCustomer && (
                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <User size={24} className="text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                              <p className="text-sm text-gray-600">
                                {selectedCustomer.phone && `📞 ${selectedCustomer.phone}`}
                                {selectedCustomer.phone && selectedCustomer.email && ' • '}
                                {selectedCustomer.email && `📧 ${selectedCustomer.email}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedCustomer.type === 'retail' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {selectedCustomer.type === 'retail' ? '👤 Retail' : '🏢 Wholesale'}
                            </span>
                            {selectedCustomer.loyalty?.isLoyaltyMember && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                selectedCustomer.loyalty.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                                selectedCustomer.loyalty.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                selectedCustomer.loyalty.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                <Crown size={12} className="inline mr-1" />
                                {selectedCustomer.loyalty.tier.toUpperCase()} • {selectedCustomer.loyalty.points} pts
                              </span>
                            )}
                            <span className="text-xs text-green-600 font-medium">✓ Customer Selected</span>
                          </div>
                        </div>
                        <GlassButton 
                          variant="danger" 
                          size="sm"
                          onClick={removeSelectedCustomer}
                          className="ml-4"
                        >
                          <X size={16} />
                          <span className="hidden sm:inline ml-1">Remove</span>
                        </GlassButton>
                      </div>
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

                  {/* Quick Add Customer */}
                  {!customersLoading && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="w-full p-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center group"
                      >
                        <Plus size={24} className="mx-auto mb-2 text-blue-400 group-hover:text-blue-500" />
                        <div className="font-medium text-blue-700">Add New Customer</div>
                        <div className="text-xs text-blue-500 mt-1">Create customer profile</div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Account</h3>
                      {paymentAccountsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-gray-600">Loading payment accounts...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentAccounts.length > 0 ? (
                            paymentAccounts.map((account) => (
                              <button
                                key={account.id}
                                onClick={() => setPaymentAccount(account.id)}
                                className={`w-full p-4 rounded-lg border-2 transition-all ${
                                  paymentAccount === account.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{ borderColor: paymentAccount === account.id ? paymentAccountService.getColorForAccountType(account.type) : undefined }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: paymentAccountService.getColorForAccountType(account.type) + '20' }}
                                    >
                                      <span className="text-sm font-medium" style={{ color: paymentAccountService.getColorForAccountType(account.type) }}>
                                        {paymentAccountService.getIconForAccountType(account.type)}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <span className="font-medium text-gray-900">{account.name}</span>
                                      <p className="text-xs text-gray-500">{account.type} • ${account.balance.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  {paymentAccount === account.id && (
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No payment accounts available</p>
                              <p className="text-sm">Please add payment accounts in the admin panel</p>
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

              {/* Amount Paid */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
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
                  Process Sale
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

      {/* Payments Accounts Modal */}
      <PaymentsAccountsModal
        isOpen={showPaymentsAccounts}
        onClose={() => setShowPaymentsAccounts(false)}
      />
    </div>
  );
};

export default POSPage; 