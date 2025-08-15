// POSPage component for LATS module
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { useLoading } from '../../../context/LoadingContext';
import { useLoadingOperations } from '../../../hooks/useLoadingOperations';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';

import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import POSTopBar from '../components/pos/POSTopBar';
import {
  ShoppingCart, Search, Barcode, CreditCard, Receipt, Plus, Minus, Trash2, DollarSign, Package, TrendingUp, Users, Activity, Calculator, Scan, ArrowLeft, ArrowRight, CheckCircle, XCircle, RefreshCw, AlertCircle, User, Phone, Mail, Crown
} from 'lucide-react';
import { useDynamicDataStore, simulateSale } from '../lib/data/dynamicDataStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { posService } from '../../../lib/posService';
import { supabase } from '../../../lib/supabaseClient';
import { 
  isSingleVariantProduct, 
  isMultiVariantProduct, 
  getPrimaryVariant, 
  getProductDisplayPrice, 
  getProductTotalStock,
  getProductStockStatus 
} from '../lib/productUtils';

// Import variant-aware POS components
import VariantProductCard from '../components/pos/VariantProductCard';
import VariantCartItem from '../components/pos/VariantCartItem';
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import QuickCashPage from './QuickCashPage';
import DeliverySection from '../components/pos/DeliverySection';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';

// Demo products data
const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 14 Pro',
    sku: 'IPH14P-128',
    price: 159999,
    stockQuantity: 15,
    category: 'Smartphones',
    brand: 'Apple',
    image: '📱',
    barcode: '1234567890123'
  },
  {
    id: '2',
    name: 'Samsung Galaxy S23',
    sku: 'SAMS23-256',
    price: 129999,
    stockQuantity: 12,
    category: 'Smartphones',
    brand: 'Samsung',
    image: '📱',
    barcode: '1234567890124'
  },
  {
    id: '3',
    name: 'MacBook Pro 14"',
    sku: 'MBP14-512',
    price: 299999,
    stockQuantity: 8,
    category: 'Laptops',
    brand: 'Apple',
    image: '💻',
    barcode: '1234567890125'
  },
  {
    id: '4',
    name: 'Dell XPS 13',
    sku: 'DLLXPS-256',
    price: 189999,
    stockQuantity: 10,
    category: 'Laptops',
    brand: 'Dell',
    image: '💻',
    barcode: '1234567890126'
  },
  {
    id: '5',
    name: 'AirPods Pro',
    sku: 'AIRPP-2',
    price: 45999,
    stockQuantity: 25,
    category: 'Accessories',
    brand: 'Apple',
    image: '🎧',
    barcode: '1234567890127'
  },
  {
    id: '6',
    name: 'Samsung Galaxy Watch',
    sku: 'SGW6-44',
    price: 35999,
    stockQuantity: 18,
    category: 'Wearables',
    brand: 'Samsung',
    image: '⌚',
    barcode: '1234567890128'
  },
  {
    id: '7',
    name: 'iPad Air',
    sku: 'IPAD-AIR-64',
    price: 89999,
    stockQuantity: 20,
    category: 'Tablets',
    brand: 'Apple',
    image: '📱',
    barcode: '1234567890129'
  },
  {
    id: '8',
    name: 'Logitech MX Master 3',
    sku: 'LGMX3-BLK',
    price: 12999,
    stockQuantity: 30,
    category: 'Accessories',
    brand: 'Logitech',
    image: '🖱️',
    barcode: '1234567890130'
  }
];

// Demo customers data
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '+254700123456',
    email: 'john.smith@email.com',
    points: 1250,
    totalSpent: 45000,
    lastVisit: '2024-01-15',
    status: 'active',
    loyaltyLevel: 'gold',
    colorTag: 'vip'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '+254700123457',
    email: 'sarah.j@email.com',
    points: 850,
    totalSpent: 32000,
    lastVisit: '2024-01-10',
    status: 'active',
    loyaltyLevel: 'silver'
  },
  {
    id: '3',
    name: 'Mike Wilson',
    phone: '+254700123458',
    email: 'mike.w@email.com',
    points: 2100,
    totalSpent: 78000,
    lastVisit: '2024-01-12',
    status: 'vip',
    loyaltyLevel: 'platinum',
    colorTag: 'vip'
  },
  {
    id: '4',
    name: 'Lisa Brown',
    phone: '+254700123459',
    email: 'lisa.b@email.com',
    points: 450,
    totalSpent: 15000,
    lastVisit: '2024-01-08',
    status: 'active',
    loyaltyLevel: 'bronze'
  },
  {
    id: '5',
    name: 'David Lee',
    phone: '+254700123460',
    email: 'david.l@email.com',
    points: 3200,
    totalSpent: 120000,
    lastVisit: '2024-01-14',
    status: 'vip',
    loyaltyLevel: 'platinum',
    colorTag: 'vip'
  }
];

// Payment methods
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵', description: 'Cash payment' },
  { id: 'mpesa', name: 'M-Pesa', icon: '📱', description: 'Mobile money' },
  { id: 'card', name: 'Card', icon: '💳', description: 'Credit/Debit card' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Bank transfer' }
];

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  price: number;
  quantity: number;
  totalPrice: number;
  availableQuantity?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  totalSpent: number;
  lastVisit: string;
  status: 'active' | 'vip' | 'inactive';
  loyaltyLevel?: 'platinum' | 'gold' | 'silver' | 'bronze';
  colorTag?: 'vip';
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Receipt {
  id: string;
  date: string;
  time: string;
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashier: string;
  receiptNumber: string;
}

const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get dynamic data from store (for sales and payments)
  const { sales, addSale, addPayment } = useDynamicDataStore();
  
  // Get real customers from CustomersContext
  const { customers } = useCustomers();

  // Global loading system
  const { withLoading, fetchWithLoading } = useLoadingOperations();
  
  // Database state management
  const { 
    products: dbProducts,
    categories,
    brands,
    suppliers,
    isLoading: productsLoading,
    loadProducts,
    loadCategories,
    loadBrands,
    loadSuppliers,
    searchProducts,
    adjustStock
  } = useInventoryStore();

  // Use database products instead of demo data and transform them to include required properties
  const products = useMemo(() => {
    return dbProducts.map(product => ({
      ...product,
      categoryName: categories.find(c => c.id === product.categoryId)?.name || 'Unknown Category',
      brandName: brands.find(b => b.id === product.brandId)?.name || undefined,
      images: product.images || []
    }));
  }, [dbProducts, categories, brands]);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [cashierName] = useState('John Cashier'); // In real app, get from auth

  // Add state for recent scans
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<Array<{barcode: string, product: any, timestamp: Date}>>([]);

  // POS-specific modal states only
  const [showAddExternalProductModal, setShowAddExternalProductModal] = useState(false);
  const [showQuickCashKeypad, setShowQuickCashKeypad] = useState(false);
  const [showDeliverySection, setShowDeliverySection] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Load data from database on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔧 LATS POS: Loading data from database...');
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadBrands(),
          loadSuppliers()
        ]);
        console.log('📊 LATS POS: Data loaded successfully');
        console.log('📦 Products available for POS:', products.length);
        console.log('📂 Categories loaded:', categories.length);
        console.log('🏷️ Brands loaded:', brands.length);
        console.log('🏢 Suppliers loaded:', suppliers.length);
      } catch (error) {
        console.error('Error loading data for POS:', error);
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadBrands, loadSuppliers]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return products.filter(product => {
      const mainVariant = product.variants?.[0];
      const category = categories.find(c => c.id === product.categoryId)?.name || '';
      const brand = brands.find(b => b.id === product.brandId)?.name || '';
      
      return (product.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (mainVariant?.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (brand.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (category.toLowerCase() || '').includes(searchQuery.toLowerCase());
    });
  }, [products, categories, brands, searchQuery]);

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    
    return customers.filter(customer =>
      (customer.name?.toLowerCase() || '').includes(customerSearchQuery.toLowerCase()) ||
      (customer.phone || '').includes(customerSearchQuery) ||
      (customer.email?.toLowerCase() || '').includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  // Computed values
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.16; // 16% tax
  
  // Enhanced discount calculation based on customer loyalty level
  const discount = useMemo(() => {
    if (!selectedCustomer) return 0;
    
    // Check for VIP status based on loyalty level or color tag
    const isVIP = selectedCustomer.loyaltyLevel === 'platinum' || 
                  selectedCustomer.loyaltyLevel === 'gold' ||
                  selectedCustomer.colorTag === 'vip';
    
    if (isVIP) {
      return subtotal * 0.05; // 5% VIP discount
    }
    
    // Bronze and Silver customers get 2% discount
    if (selectedCustomer.loyaltyLevel === 'bronze' || selectedCustomer.loyaltyLevel === 'silver') {
      return subtotal * 0.02; // 2% discount
    }
    
    return 0;
  }, [selectedCustomer, subtotal]);
  
  const total = subtotal + tax - discount;

  // Handle adding product to cart with variant support
  const handleAddToCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    const selectedVariant = variant || getPrimaryVariant(product);
    if (!selectedVariant) {
      alert('Product has no variants available');
      return;
    }

    const price = selectedVariant.sellingPrice || 0;
    const sku = selectedVariant.sku || 'N/A';
    const currentStock = selectedVariant.quantity || 0;
    
    if (currentStock <= 0) {
      alert(`Cannot add ${product.name} - ${selectedVariant.name}. No stock available.`);
      return;
    }

    if (quantity > currentStock) {
      alert(`Cannot add ${quantity} units. Only ${currentStock} units available in stock for ${product.name} - ${selectedVariant.name}.`);
      return;
    }
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.productId === product.id && item.variantId === selectedVariant.id
      );
      
      if (existingItem) {
        // Check if adding more would exceed stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > currentStock) {
          alert(`Cannot add more ${product.name} - ${selectedVariant.name}. Only ${currentStock} units available in stock.`);
          return prevItems;
        }
        
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: newQuantity,
                totalPrice: newQuantity * price
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product.id}-${selectedVariant.id}-${Date.now()}`,
          productId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          variantName: selectedVariant.name,
          sku: sku,
          price: price,
          quantity: quantity,
          totalPrice: price * quantity,
          availableQuantity: currentStock
        };
        return [...prevItems, newItem];
      }
    });
    
    // Clear search after adding
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  // Handle navigation state from variant selection
  useEffect(() => {
    if (location.state?.action === 'addToCart' && location.state?.selectedVariant) {
      const { product, selectedVariant, quantity } = location.state;
      
      // Add the selected variant to cart
      handleAddToCart(product, selectedVariant, quantity || 1);
      
      // Clear the navigation state to prevent re-processing
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, handleAddToCart, navigate]);

  // Consolidated unified search handler for both text search and barcode scanning
  const handleUnifiedSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    setSearchQuery(trimmedQuery);
    setShowSearchResults(true);

    // Check if input looks like a barcode (long numeric/alphanumeric string)
    const isBarcodeLike = trimmedQuery.length >= 8 && /^[A-Za-z0-9]+$/.test(trimmedQuery);
    
    // Try to find exact match first (for barcodes, SKUs, or IDs)
    const exactMatch = products.find(p => {
      const mainVariant = p.variants?.[0];
      return mainVariant?.sku === trimmedQuery || 
             mainVariant?.barcode === trimmedQuery ||
             p.id === trimmedQuery;
    });
    
    if (exactMatch) {
      // Add to scan history if it's barcode-like
      if (isBarcodeLike) {
        setScanHistory(prev => [
          { barcode: trimmedQuery, product: exactMatch, timestamp: new Date() },
          ...prev.slice(0, 9) // Keep last 10 scans
        ]);
      }
      
      // Auto-add to cart for exact matches
      handleAddToCart(exactMatch);
      setSearchQuery('');
      setShowSearchResults(false);
      return;
    }

    // For text search, show filtered results
    const filtered = products.filter(product => {
      const mainVariant = product.variants?.[0];
      
      // Get category and brand names from the store
      const category = categories.find(c => c.id === product.categoryId)?.name || '';
      const brand = brands.find(b => b.id === product.brandId)?.name || '';
      
      return (product.name?.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
             (mainVariant?.sku?.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
             (brand.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
             (category.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
             (mainVariant?.barcode && mainVariant.barcode.includes(trimmedQuery));
    });

    // If only one result and it's a barcode-like input, auto-add to cart
    if (filtered.length === 1 && isBarcodeLike) {
      handleAddToCart(filtered[0]);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  }, [products, handleAddToCart]);

  // Handle search input changes
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show search results if there's input
    if (value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, []);

  // Handle search input key press (Enter key)
  const handleSearchInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleUnifiedSearch(searchQuery.trim());
    }
  }, [searchQuery, handleUnifiedSearch]);

  // Handle customer search
  const handleCustomerSearch = useCallback((query: string) => {
    setCustomerSearchQuery(query);
    setShowCustomerSearch(query.trim().length > 0);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setShowCustomerSearch(false);
  }, []);

  // Handle removing customer
  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Handle new customer created
  const handleCustomerCreated = useCallback((newCustomer: any) => {
    setSelectedCustomer(newCustomer);
    setShowAddCustomerModal(false);
    setCustomerSearchQuery('');
    setShowCustomerSearch(false);
  }, []);

  // Handle updating cart item quantity with variant support
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          // Check stock availability for the specific variant
          const product = products.find(p => p.id === item.productId);
          const variant = product?.variants?.find(v => v.id === item.variantId);
          const currentStock = variant?.quantity || 0;
          
          if (newQuantity > currentStock) {
            alert(`Cannot increase quantity. Only ${currentStock} units available in stock for ${item.name} - ${item.variantName || 'Default'}.`);
            return item; // Return unchanged item
          }
          
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.price
          };
        }
        return item;
      })
    );
  }, [products]);

  // Handle removing item from cart
  const handleRemoveFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Generate receipt
  const generateReceipt = useCallback((paymentMethod: PaymentMethod, saleNumber?: string): Receipt => {
    const now = new Date();
    const receiptNumber = saleNumber || `RCP-${Date.now().toString().slice(-6)}`;
    
    return {
      id: Date.now().toString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      items: [...cartItems],
      customer: selectedCustomer,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      cashier: cashierName,
      receiptNumber
    };
  }, [cartItems, selectedCustomer, subtotal, tax, discount, total, cashierName]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  }, []);

  // Handle payment completion
  const handlePaymentComplete = useCallback(async () => {
    if (!selectedCustomer) {
      alert('Please select a customer before processing payment');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deduct stock for all items in cart
      console.log('🔧 LATS POS: Deducting stock for sale...');
      const stockDeductionPromises = cartItems.map(async (item) => {
        try {
          // Find the product in the database
          const product = products.find(p => p.id === item.productId);
          if (!product) {
            console.warn(`Product not found for cart item: ${item.name}`);
            return { success: false, error: 'Product not found' };
          }

          // Get the specific variant for this cart item
          const variant = product.variants?.find(v => v.id === item.variantId);
          if (!variant) {
            console.warn(`Variant not found for product: ${product.name}, variant ID: ${item.variantId}`);
            return { success: false, error: 'Product variant not found' };
          }

          // Check if enough stock is available for this variant
          const currentStock = variant.quantity || 0;
          if (currentStock < item.quantity) {
            console.warn(`Insufficient stock for ${product.name} - ${variant.name}: ${currentStock} available, ${item.quantity} requested`);
            return { success: false, error: `Insufficient stock for ${product.name} - ${variant.name}` };
          }

          // Deduct stock (negative quantity for deduction)
          const deductionQuantity = -item.quantity;
          const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
          const reason = `POS Sale - Receipt: ${receiptNumber}`;
          
          const stockResponse = await adjustStock(
            product.id, 
            variant.id, 
            deductionQuantity, 
            reason
          );

          if (stockResponse.ok) {
            console.log(`✅ Stock deducted for ${product.name} - ${variant.name}: ${item.quantity} units`);
            return { success: true, product: `${product.name} - ${variant.name}`, quantity: item.quantity };
          } else {
            console.error(`❌ Failed to deduct stock for ${product.name} - ${variant.name}:`, stockResponse.message);
            return { success: false, error: stockResponse.message };
          }
        } catch (error) {
          console.error(`❌ Error deducting stock for ${item.name}:`, error);
          return { success: false, error: 'Stock deduction failed' };
        }
      });

      // Wait for all stock deductions to complete
      const stockResults = await Promise.all(stockDeductionPromises);
      
      // Check if any stock deductions failed
      const failedDeductions = stockResults.filter(result => !result.success);
      if (failedDeductions.length > 0) {
        const errorMessage = failedDeductions.map(f => f.error).join('\n');
        alert(`Payment completed but some stock deductions failed:\n${errorMessage}`);
        console.error('❌ Some stock deductions failed:', failedDeductions);
      } else {
        console.log('✅ All stock deductions completed successfully');
      }

      // Save the sale to the database
      console.log('💾 Saving sale to database...');
      const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
      
      try {
        // Create sale record
        const { data: sale, error: saleError } = await supabase
          .from('lats_sales')
          .insert([{
            sale_number: saleNumber,
            customer_id: selectedCustomer?.id || null,
            total_amount: total,
            payment_method: selectedPaymentMethod?.id || 'cash',
            status: 'completed',
            created_by: null
          }])
          .select()
          .single();

        if (saleError) {
          console.error('❌ Failed to create sale:', saleError);
          throw new Error(`Failed to create sale: ${saleError.message}`);
        }

        // Create sale items
        const saleItemsData = cartItems.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variant = product?.variants?.find(v => v.id === item.variantId) || product?.variants?.[0];
          
          return {
            sale_id: sale.id,
            product_id: item.productId,
            variant_id: variant?.id || null,
            quantity: item.quantity,
            price: item.price,
            total_price: item.totalPrice
          };
        });

        const { error: itemsError } = await supabase
          .from('lats_sale_items')
          .insert(saleItemsData);

        if (itemsError) {
          console.error('❌ Failed to create sale items:', itemsError);
          throw new Error(`Failed to create sale items: ${itemsError.message}`);
        }

        console.log('✅ Sale saved successfully:', sale.id);
        
        // Generate receipt
        const receipt: Receipt = {
          id: sale.id,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          items: cartItems,
          customer: selectedCustomer,
          subtotal: subtotal,
          tax: tax,
          discount: discount,
          total: total,
          paymentMethod: selectedPaymentMethod!,
          cashier: cashierName,
          receiptNumber: saleNumber
        };

        setCurrentReceipt(receipt);
        setShowReceipt(true);
        
        // Clear cart
        setCartItems([]);
        setSelectedCustomer(null);
        setSelectedPaymentMethod(null);
        
        console.log('✅ Sale saved successfully:', sale.id);
        
        // Reload products to get updated stock levels
        await loadProducts();
        
        // Calculate loyalty points earned (1 point per 100 TZS)
        const pointsEarned = Math.floor(total / 100);
        
        // Clear cart after successful payment
        setCartItems([]);
        setSelectedCustomer(null);
        setSelectedPaymentMethod(null);
        setShowPaymentModal(false);
        
        // Show success message
        const customerInfo = selectedCustomer 
          ? `\nCustomer: ${selectedCustomer.name}\nLoyalty Points Earned: ${pointsEarned}`
          : '\nWalk-in Customer';
        
        const stockInfo = failedDeductions.length > 0 
          ? `\n⚠️ ${failedDeductions.length} stock deduction(s) failed`
          : '\n✅ Stock updated successfully';
        
        alert(`Payment completed successfully!\nTotal: ${formatMoney(total)}${customerInfo}${stockInfo}`);
        
      } catch (error) {
        console.error('❌ Error saving sale:', error);
        alert(`Payment completed but sale was not saved: ${error}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [total, selectedCustomer, selectedPaymentMethod, generateReceipt, cartItems, products, adjustStock, loadProducts]);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    if (cartItems.length > 0 && confirm('Are you sure you want to clear the cart?')) {
      setCartItems([]);
    }
  }, [cartItems.length]);

  // Check stock availability for all cart items
  const checkStockAvailability = useCallback(() => {
    const stockIssues = [];
    
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        stockIssues.push(`${item.name}: Product not found`);
        continue;
      }

      const mainVariant = product.variants?.[0];
      if (!mainVariant) {
        stockIssues.push(`${item.name}: No product variant found`);
        continue;
      }

      const currentStock = mainVariant.quantity || 0;
      if (currentStock < item.quantity) {
        stockIssues.push(`${item.name}: Insufficient stock (${currentStock} available, ${item.quantity} requested)`);
      }
    }

    return stockIssues;
  }, [cartItems, products]);

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer before proceeding to checkout');
      return;
    }

    // Check stock availability before proceeding
    const stockIssues = checkStockAvailability();
    if (stockIssues.length > 0) {
      const issueMessage = stockIssues.join('\n');
      alert(`Cannot proceed with sale due to stock issues:\n\n${issueMessage}`);
      return;
    }

    setShowPaymentModal(true);
  }, [cartItems.length, selectedCustomer, checkStockAvailability]);

  // Format money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen">
      {/* POS Top Bar */}
      <POSTopBar
        cartItemsCount={cartItems.length}
        totalAmount={cartItems.reduce((sum, item) => sum + item.totalPrice, 0)}
        productsCount={products.length}
        salesCount={sales.length}
        onProcessPayment={() => setShowPaymentModal(true)}
        onClearCart={() => setCartItems([])}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query.trim()) {
            setShowSearchResults(true);
          } else {
            setShowSearchResults(false);
          }
        }}
        onScanBarcode={() => {
          // TODO: Implement barcode scanning
          alert('Barcode scanning feature coming soon!');
        }}
        onAddCustomer={() => {
          // TODO: Navigate to add customer page or open modal
          navigate('/customers');
        }}
        onAddProduct={() => {
          // TODO: Navigate to add product page
          navigate('/lats/inventory/products/new');
        }}
        onViewReceipts={() => {
          // TODO: Navigate to receipts page
          alert('Receipts view coming soon!');
        }}
        onViewSales={() => {
          // TODO: Navigate to sales page
          alert('Sales view coming soon!');
        }}
        isProcessingPayment={isProcessingPayment}
        hasSelectedCustomer={!!selectedCustomer}
      />

      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
        {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Cart Items</p>
              <p className="text-2xl font-bold text-blue-900">{cartItems.length}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(cartItems.reduce((sum, item) => sum + item.totalPrice, 0))}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Available Products</p>
              <p className="text-2xl font-bold text-purple-900">{products.length}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Today's Sales</p>
              <p className="text-2xl font-bold text-amber-900">{sales.length}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Product Search Section */}
        <div className="xl:col-span-3">
          <GlassCard className="p-6">
            {/* POS Quick Actions Section */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">POS Quick Actions</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowAddExternalProductModal(true)}
                  className="p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left"
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Add External Product</span>
                  </div>
                  <p className="text-xs text-gray-600">Quick product entry for sales</p>
                </button>

                <button
                  onClick={() => setShowQuickCashKeypad(true)}
                  className="p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left"
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Quick Cash</span>
                  </div>
                  <p className="text-xs text-gray-600">Fast cash transactions</p>
                </button>

                <button
                  onClick={() => setShowDeliverySection(true)}
                  className="p-3 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Delivery</span>
                  </div>
                  <p className="text-xs text-gray-600">Set up delivery options</p>
                </button>

                <button
                  onClick={() => setShowQuickCashKeypad(true)}
                  className="p-3 bg-white rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Quick Cash Modal</span>
                  </div>
                  <p className="text-xs text-gray-600">Open Quick Cash modal</p>
                </button>

                <button
                  onClick={() => setShowQuickCashKeypad(true)}
                  className="p-3 bg-white rounded-lg border border-emerald-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Quick Cash (TZS {total.toLocaleString()})</span>
                  </div>
                  <p className="text-xs text-gray-600">Process cash payment for current total</p>
                </button>
              </div>
            </div>

            {/* Unified Search Interface */}
            <div className="mb-6">
              {/* Universal Search header hidden */}
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500" />
                <input
                  type="text"
                  placeholder="🔍 Search products by name, SKU, brand, category, or scan barcode..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchInputKeyPress}
                  className="w-full pl-14 pr-16 py-5 text-lg border-2 border-blue-200 rounded-xl bg-white text-gray-900 placeholder-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ minHeight: '60px' }}
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      handleUnifiedSearch(searchQuery.trim());
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95"
                  title="Search or scan"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Barcode className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recent Scans History */}
            {scanHistory.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                                  <div>
                  <h3 className="font-medium text-purple-900">Recent Scans</h3>
                </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {scanHistory.slice(0, 6).map((scan, index) => (
                    <div
                      key={index}
                      onClick={() => handleAddToCart(scan.product)}
                      className="p-3 bg-white rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm">📦</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{scan.product.name}</div>
                          <div className="text-xs text-gray-500">Barcode: {scan.barcode}</div>
                          <div className="text-xs text-purple-600">{formatMoney(scan.product.variants?.[0]?.sellingPrice || 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {scanHistory.length > 6 && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setScanHistory([])}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      Clear History ({scanHistory.length} items)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Search Results with Enhanced Features */}
            {showSearchResults && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">
                    Search Results ({filteredProducts.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setShowSearchResults(false)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Show All Products
                    </button>
                  </div>
                </div>
                
                {/* Search Suggestions */}
                {filteredProducts.length === 0 && searchQuery.trim() && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">No exact matches found</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      <p className="mb-2">Try these search tips:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Use partial product names (e.g., "iPhone" instead of "iPhone 14 Pro")</li>
                        <li>• Search by brand name (e.g., "Apple", "Samsung")</li>
                        <li>• Use SKU codes (e.g., "IPH14P-128")</li>
                        <li>• Try category names (e.g., "Smartphones", "Laptops")</li>
                        <li>• Check spelling and try different variations</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {filteredProducts.length > 0 ? (
                  <>
                    {/* Quick Actions */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Quick actions:</span>
                      {filteredProducts.length === 1 && (
                        <button
                          onClick={() => handleAddToCart(filteredProducts[0])}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
                        >
                          Add to Cart
                        </button>
                      )}
                      <button
                        onClick={() => {
                          filteredProducts.forEach(product => handleAddToCart(product));
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                      >
                        Add All ({filteredProducts.length})
                      </button>
                    </div>
                    
                    {/* Results Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <VariantProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">No products found for "{searchQuery}"</p>
                    <div className="text-sm text-gray-500">
                      <p className="mb-2">Try searching by:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>• Product name (e.g., "iPhone")</div>
                        <div>• SKU code (e.g., "IPH14P-128")</div>
                        <div>• Brand name (e.g., "Apple")</div>
                        <div>• Category (e.g., "Smartphones")</div>
                        <div>• Barcode number</div>
                        <div>• Partial matches</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Database Products Grid */}
            {!showSearchResults && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">Available Products</h3>
                  <span className="text-sm text-gray-500">{products.length} products</span>
                </div>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const mainVariant = product.variants?.[0];
                      const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
                      
                      return (
                        <VariantProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">📦</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
                    <p className="text-gray-600 mb-4">No products found in the database</p>
                    <div className="text-sm text-gray-500">
                      <p>Add products to your inventory to start selling</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Cart Section */}
        <div className="xl:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Shopping Cart</h2>
                <p className="text-sm text-gray-600">{cartItems.length} items in cart</p>
              </div>
            </div>

            {/* Customer Search Section */}
            <div className="mb-6">
              {/* Customer Selection header hidden */}

              {selectedCustomer ? (
                <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {selectedCustomer.name.charAt(0)}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                          selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold'
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                            : 'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}>
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {selectedCustomer.phone}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold'
                              ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200' 
                              : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                          }`}>
                            {selectedCustomer.colorTag === 'vip' || selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold' ? 'VIP Member' : 'Active Member'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {selectedCustomer.points} points
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCustomer}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input
                      type="text"
                      placeholder="👤 Search customers by name, phone, or email..."
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-12 pr-14 py-3 text-base border-2 border-blue-200 rounded-xl bg-white text-gray-900 placeholder-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 shadow-md hover:shadow-lg transition-all duration-200"
                    />
                    <button
                      onClick={() => setShowAddCustomerModal(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                      title="Add new customer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                                      {/* Customer Search Results */}
                    {showCustomerSearch && filteredCustomers.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredCustomers.slice(0, 4).map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {customer.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.phone}</div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-1 py-0.5 rounded ${
                                  customer.colorTag === 'vip' || customer.loyaltyLevel === 'platinum' || customer.loyaltyLevel === 'gold'
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {customer.colorTag === 'vip' || customer.loyaltyLevel === 'platinum' || customer.loyaltyLevel === 'gold' ? 'VIP' : 'Active'}
                                </span>
                                <span className="text-gray-500">{customer.points} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredCustomers.length > 4 && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          +{filteredCustomers.length - 4} more customers
                        </div>
                      )}
                    </div>
                  )}

                  {showCustomerSearch && filteredCustomers.length === 0 && customerSearchQuery.trim() && (
                    <div className="text-center py-4">
                      <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No customers found for "{customerSearchQuery}"</p>
                      <button
                        onClick={() => setShowAddCustomerModal(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Customer
                      </button>
                    </div>
                  )}

                  {/* Customer Required warning hidden */}
                </div>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h3>
                <p className="text-gray-600 mb-4">Add products to start a transaction</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    const availableVariants = product?.variants?.map(variant => ({
                      id: variant.id,
                      name: variant.name,
                      sku: variant.sku,
                      price: variant.sellingPrice,
                      quantity: variant.quantity,
                      attributes: variant.attributes || {}
                    })) || [];

                    return (
                      <VariantCartItem
                        key={item.id}
                        item={{
                          ...item,
                          unitPrice: item.price,
                          availableQuantity: item.availableQuantity || 0
                        }}
                        onQuantityChange={(quantity) => handleUpdateQuantity(item.id, quantity)}
                        onRemove={() => handleRemoveFromCart(item.id)}
                        availableVariants={availableVariants}
                        showStockInfo={true}
                      />
                    );
                  })}
                </div>

                {/* Cart Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (16%):</span>
                    <span className="font-semibold">{formatMoney(tax)}</span>
                  </div>
                  
                  {/* Conditional Discount Display */}
                  {discount > 0 && selectedCustomer && (
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Discount:</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          {selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold' || selectedCustomer.colorTag === 'vip' 
                            ? 'VIP 5%' 
                            : 'Loyalty 2%'}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">-{formatMoney(discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatMoney(total)}</span>
                    </div>
                  </div>
                  
                  {/* Customer Loyalty Info */}
                  {selectedCustomer && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Customer Benefits</span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div>• {selectedCustomer.name} - {selectedCustomer.loyaltyLevel || 'Standard'} Member</div>
                        <div>• Current Points: {selectedCustomer.points}</div>
                        <div>• Total Spent: {formatMoney(selectedCustomer.totalSpent)}</div>
                        {discount > 0 && (
                          <div>• Applied Discount: {selectedCustomer.loyaltyLevel === 'platinum' || selectedCustomer.loyaltyLevel === 'gold' || selectedCustomer.colorTag === 'vip' ? '5%' : '2%'}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <GlassButton
                    onClick={() => setShowPaymentModal(true)}
                    icon={<CreditCard size={18} />}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    disabled={!selectedCustomer}
                  >
                    Process Payment
                  </GlassButton>
                  <GlassButton
                    onClick={() => setCartItems([])}
                    icon={<Trash2 size={18} />}
                    variant="secondary"
                    className="w-full"
                  >
                    Clear Cart
                  </GlassButton>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Select Payment Method</h2>
                <p className="text-sm text-gray-600">Choose how to process the payment</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedPaymentMethod?.id === method.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                    {selectedPaymentMethod?.id === method.id && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Information */}
            {selectedCustomer ? (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Customer</span>
                </div>
                <div className="text-sm text-blue-700">
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className="text-xs">{selectedCustomer.phone}</div>
                  {selectedCustomer.loyaltyLevel && (
                    <div className="text-xs mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {selectedCustomer.loyaltyLevel} Member
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Customer Required</span>
                </div>
                <div className="text-sm text-red-700">
                  Please select a customer before processing payment
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">{formatMoney(cartItems.reduce((sum, item) => sum + item.totalPrice, 0) * 1.16)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <GlassButton
                onClick={() => setShowPaymentModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handlePaymentComplete}
                disabled={!selectedPaymentMethod || !selectedCustomer || isProcessingPayment}
                icon={isProcessingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle size={18} />}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Payment Successful!</h2>
                <p className="text-sm text-gray-600">Transaction completed successfully</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Receipt #{currentReceipt.receiptNumber}</h3>
                <p className="text-sm text-gray-600">{currentReceipt.date} at {currentReceipt.time}</p>
              </div>

              <div className="space-y-2 mb-4">
                {currentReceipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatMoney(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatMoney(currentReceipt.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatMoney(currentReceipt.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span>{formatMoney(currentReceipt.discount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatMoney(currentReceipt.total)}</span>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Payment Method: {currentReceipt.paymentMethod.name}</p>
                <p>Cashier: {currentReceipt.cashier}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlassButton
                onClick={() => setShowReceipt(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </GlassButton>
              <GlassButton
                onClick={() => window.print()}
                icon={<Receipt size={18} />}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              >
                Print Receipt
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* POS-specific Modals Only */}
      
      {/* Add External Product Modal */}
      {showAddExternalProductModal && (
        <AddExternalProductModal
          isOpen={showAddExternalProductModal}
          onClose={() => setShowAddExternalProductModal(false)}
          onProductAdded={(product) => {
            console.log('External product added:', product);
            // Add the external product to cart
            const cartItem = {
              id: `${product.sku}-${Date.now()}`,
              productId: product.sku,
              name: product.name,
              sku: product.sku,
              price: product.price,
              quantity: product.quantity,
              totalPrice: product.price * product.quantity
            };
            setCartItems(prev => [...prev, cartItem]);
            setShowAddExternalProductModal(false);
          }}
        />
      )}

      {/* Quick Cash Modal */}
      <QuickCashPage
        isOpen={showQuickCashKeypad}
        onClose={() => setShowQuickCashKeypad(false)}
        suggestedAmount={total}
        onAmountEntered={(amount: number) => {
          console.log('Quick cash amount:', amount);
          // Handle cash payment
          const change = amount - total;
          alert(`Cash received: TZS ${amount.toLocaleString()}\nChange due: TZS ${change.toFixed(2)}`);
          setShowQuickCashKeypad(false);
        }}
      />

      {/* Delivery Section */}
      {showDeliverySection && (
        <DeliverySection
          isOpen={showDeliverySection}
          onClose={() => setShowDeliverySection(false)}
          onDeliverySet={(delivery) => {
            console.log('Delivery set:', delivery);
            // Handle delivery setup
            alert(`Delivery configured for ${delivery.customerName}\nAddress: ${delivery.deliveryAddress}\nFee: TZS ${delivery.deliveryFee}`);
            setShowDeliverySection(false);
          }}
        />
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      </div>
    </div>
  );
};

export default POSPage;
