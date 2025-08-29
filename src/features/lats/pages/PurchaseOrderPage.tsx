// PurchaseOrderPage component for LATS module - Interactive Purchase Order Creation
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLoading } from '../../../context/LoadingContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';

import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import POTopBar from '../components/purchase-order/POTopBar';
import {
  ShoppingCart, Search, Barcode, FileText, Receipt, Plus, Minus, Trash2, DollarSign, 
  Package, TrendingUp, Building, Activity, Calculator, Scan, ArrowLeft, ArrowRight, 
  CheckCircle, XCircle, RefreshCw, AlertCircle, User, Phone, Mail, Crown, ChevronDown, 
  ChevronUp, Clock, Smartphone, Warehouse, Command, BarChart3, Settings, Truck, 
  Zap, Star, Gift, Hash as HashIcon, TestTube, Camera, Send, Calendar, CreditCard,
  Globe, Banknote, Scale, Target, Clipboard, PlusCircle, MinusCircle, Save, Eye,
  Users, MapPin, Factory, Store, Coins, Timer, ShoppingBag, Archive
} from 'lucide-react';

import { useInventoryStore } from '../stores/useInventoryStore';
import { supabase } from '../../../lib/supabaseClient';
import { 
  getPrimaryVariant, 
  getProductDisplayPrice, 
  getProductTotalStock,
  getProductStockStatus 
} from '../lib/productUtils';

// Import purchase order specific components
import VariantProductCard from '../components/pos/VariantProductCard';
import SupplierSelectionModal from '../components/purchase-order/SupplierSelectionModal';
import PurchaseOrderSettingsModal from '../components/purchase-order/PurchaseOrderSettingsModal';
import PurchaseOrderDraftModal from '../components/purchase-order/PurchaseOrderDraftModal';
import CurrencySelector from '../components/purchase-order/CurrencySelector';
import ExpectedDeliverySection from '../components/purchase-order/ExpectedDeliverySection';
import SupplierTermsSection from '../components/purchase-order/SupplierTermsSection';
import PurchaseOrderSummaryModal from '../components/purchase-order/PurchaseOrderSummaryModal';

import { toast } from '../../../lib/toastUtils';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../lib/robustImageService';

// Helper function to convert old image format to new format
const convertToProductImages = (imageUrls: string[]): ProductImage[] => {
  if (!imageUrls || imageUrls.length === 0) return [];
  
  return imageUrls.map((imageUrl, index) => ({
    id: `temp-${index}`,
    url: imageUrl,
    thumbnailUrl: imageUrl,
    fileName: `product-image-${index + 1}`,
    fileSize: 0,
    isPrimary: index === 0,
    uploadedAt: new Date().toISOString()
  }));
};

// Performance optimization constants
const PRODUCTS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Supported currencies for international suppliers
const SUPPORTED_CURRENCIES = [
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', flag: '🇷🇼' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' }
];

// Purchase Order Status Types
type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'partial_received' | 'received' | 'cancelled';

// Payment Terms
const PAYMENT_TERMS = [
  { id: 'net_15', name: 'Net 15', description: 'Payment due in 15 days' },
  { id: 'net_30', name: 'Net 30', description: 'Payment due in 30 days' },
  { id: 'net_45', name: 'Net 45', description: 'Payment due in 45 days' },
  { id: 'net_60', name: 'Net 60', description: 'Payment due in 60 days' },
  { id: 'advance', name: 'Advance Payment', description: 'Payment before delivery' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Payment on delivery' },
  { id: '2_10_net_30', name: '2/10 Net 30', description: '2% discount if paid within 10 days, net 30' }
];

interface PurchaseCartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number; // Purchase price from supplier
  quantity: number;
  totalPrice: number;
  availableQuantity?: number;
  currentStock?: number;
  supplierSku?: string;
  notes?: string;
  category?: string;
  brand?: string;
}

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  currency?: string;
  isActive: boolean;
  totalSpent?: number;
  ordersCount?: number;
  lastOrderDate?: string;
  rating?: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: Supplier;
  items: PurchaseCartItem[];
  currency: string;
  exchangeRate?: number;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  expectedDelivery: string;
  paymentTerms: string;
  notes: string;
  status: PurchaseOrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Performance optimization hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const PurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
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
    adjustStock,
    createPurchaseOrder
  } = useInventoryStore();

  // Performance optimization: Cache data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search for better performance
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  
  // Ref for search input to enable keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced search and filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'supplier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use database products and transform them
  const products = useMemo(() => {
    return dbProducts.map(product => ({
      ...product,
      categoryName: categories.find(c => c.id === product.categoryId)?.name || 'Unknown Category',
      brandName: product.brand?.name || undefined,
      images: product.images || []
    }));
  }, [dbProducts, categories, brands]);

  // Optimized filtered products with pagination
  const filteredProducts = useMemo(() => {
    if (showSearchResults && searchResults.length > 0) {
      return searchResults;
    }
    
    let filtered = products;
    
    // Basic search filter
    if (debouncedSearchQuery.trim() && !showSearchResults) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const category = categories.find(c => c.id === product.categoryId)?.name || '';
        const brand = product.brand?.name || '';
        
        const hasBarcodeMatch = product.variants?.some(variant => 
          variant.barcode && variant.barcode.includes(query)
        ) || false;
        
        return (product.name?.toLowerCase() || '').includes(query) ||
               (mainVariant?.sku?.toLowerCase() || '').includes(query) ||
               (brand.toLowerCase() || '').includes(query) ||
               (category.toLowerCase() || '').includes(query) ||
               hasBarcodeMatch;
      });
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(product => product.brandId === selectedBrand);
    }
    
    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const price = mainVariant?.costPrice || mainVariant?.sellingPrice || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const stock = mainVariant?.quantity || 0;
        
        switch (stockFilter) {
          case 'in-stock':
            return stock > 10;
          case 'low-stock':
            return stock > 0 && stock <= 10;
          case 'out-of-stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.variants?.[0]?.costPrice || a.variants?.[0]?.sellingPrice || 0;
          bValue = b.variants?.[0]?.costPrice || b.variants?.[0]?.sellingPrice || 0;
          break;
        case 'stock':
          aValue = a.variants?.[0]?.quantity || 0;
          bValue = b.variants?.[0]?.quantity || 0;
          break;
        case 'recent':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, categories, brands, debouncedSearchQuery, selectedCategory, selectedBrand, priceRange, stockFilter, sortBy, sortOrder, showSearchResults, searchResults]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // Update pagination when filtered products change
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    setTotalPages(newTotalPages);
    
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, currentPage]);

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🛒 Purchase Order: Loading data from database...');
        await Promise.all([
          loadProducts({ page: 1, limit: 100 }),
          loadCategories(),
          loadBrands(),
          loadSuppliers()
        ]);
        console.log('📊 Purchase Order: Data loaded successfully');
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data for Purchase Order:', error);
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadBrands, loadSuppliers]);

  // Local state for purchase order
  const [purchaseCartItems, setPurchaseCartItems] = useState<PurchaseCartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(SUPPORTED_CURRENCIES[0]); // Default to TZS
  const [exchangeRate, setExchangeRate] = useState(1);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[1].id); // Default to Net 30
  const [purchaseOrderNotes, setPurchaseOrderNotes] = useState('');
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState<PurchaseOrderStatus>('draft');

  // Modal states
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showPOSummary, setShowPOSummary] = useState(false);
  const [isCreatingPO, setIsCreatingPO] = useState(false);

  // Computed values for purchase order
  const subtotal = purchaseCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.18; // 18% VAT for Tanzania
  const tax = subtotal * taxRate;
  const discount = 0; // TODO: Implement supplier discounts
  const totalAmount = subtotal + tax - discount;

  // Convert to base currency (TZS) if different currency selected
  const totalInBaseCurrency = selectedCurrency.code === 'TZS' ? totalAmount : totalAmount * exchangeRate;

  // Handle adding product to purchase cart
  const handleAddToPurchaseCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    const selectedVariant = variant || getPrimaryVariant(product);
    if (!selectedVariant) {
      alert('Product has no variants available');
      return;
    }

    // Use cost price if available, otherwise use selling price as estimate
    const costPrice = selectedVariant.costPrice || selectedVariant.sellingPrice * 0.7; // Estimate 70% of selling price
    const sku = selectedVariant.sku || 'N/A';
    const currentStock = selectedVariant.quantity || 0;
    
    setPurchaseCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.productId === product.id && item.variantId === selectedVariant.id
      );
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * costPrice
              }
            : item
        );
      } else {
        // Add new item
        const newItem: PurchaseCartItem = {
          id: `${product.id}-${selectedVariant.id}-${Date.now()}`,
          productId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          variantName: selectedVariant.name,
          sku: sku,
          costPrice: costPrice,
          quantity: quantity,
          totalPrice: costPrice * quantity,
          currentStock: currentStock,
          category: product.categoryName,
          brand: product.brandName
        };
        return [...prevItems, newItem];
      }
    });
    
    // Clear search after adding
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  // Handle updating cart item quantity
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    
    setPurchaseCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.costPrice
          };
        }
        return item;
      })
    );
  }, []);

  // Handle removing item from cart
  const handleRemoveFromCart = useCallback((itemId: string) => {
    setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Handle updating item cost price
  const handleUpdateCostPrice = useCallback((itemId: string, newCostPrice: number) => {
    setPurchaseCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            costPrice: newCostPrice,
            totalPrice: item.quantity * newCostPrice
          };
        }
        return item;
      })
    );
  }, []);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    if (purchaseCartItems.length > 0 && confirm('Are you sure you want to clear the purchase cart?')) {
      setPurchaseCartItems([]);
    }
  }, [purchaseCartItems.length]);

  // Handle supplier selection
  const handleSupplierSelect = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Set default currency and payment terms based on supplier
    if (supplier.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === supplier.currency);
      if (supplierCurrency) {
        setSelectedCurrency(supplierCurrency);
      }
    }
    if (supplier.paymentTerms) {
      setPaymentTerms(supplier.paymentTerms);
    }
    setShowSupplierSearch(false);
  }, []);

  // Handle search input changes
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, []);

  // Handle unified search
  const handleUnifiedSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSearchQuery('');
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setSearchQuery(trimmedQuery);
    setShowSearchResults(true);
    setIsSearching(true);

    try {
      // Simple search implementation
      const filtered = products.filter(product => {
        const mainVariant = product.variants?.[0];
        const category = categories.find(c => c.id === product.categoryId)?.name || '';
        const brand = product.brand?.name || '';
        
        const hasBarcodeMatch = product.variants?.some(variant => 
          variant.barcode && variant.barcode.includes(trimmedQuery)
        ) || false;
        
        return (product.name?.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
               (mainVariant?.sku?.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
               (brand.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
               (category.toLowerCase() || '').includes(trimmedQuery.toLowerCase()) ||
               hasBarcodeMatch;
      });
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error in search:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [products, categories, brands]);

  // Handle search input key press
  const handleSearchInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleUnifiedSearch(searchQuery.trim());
    }
  }, [searchQuery, handleUnifiedSearch]);

  // Handle global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+F to focus search input
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    // Ctrl+N to create new purchase order
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      handleClearCart();
    }
  }, [handleClearCart]);

  // Add global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // Handle creating purchase order
  const handleCreatePurchaseOrder = useCallback(async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier before creating purchase order');
      return;
    }

    if (purchaseCartItems.length === 0) {
      alert('Please add items to the purchase order');
      return;
    }

    if (!expectedDelivery) {
      alert('Please set expected delivery date');
      return;
    }

    setIsCreatingPO(true);
    
    try {
      const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
      
      const purchaseOrderData = {
        orderNumber,
        supplierId: selectedSupplier.id,
        currency: selectedCurrency.code,
        exchangeRate: exchangeRate,
        expectedDelivery,
        paymentTerms,
        notes: purchaseOrderNotes,
        status: purchaseOrderStatus,
        items: purchaseCartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          notes: item.notes || ''
        }))
      };

      const result = await createPurchaseOrder(purchaseOrderData);
      
      if (result.ok) {
        toast.success(`Purchase Order ${orderNumber} created successfully!`);
        
        // Clear form
        setPurchaseCartItems([]);
        setSelectedSupplier(null);
        setExpectedDelivery('');
        setPurchaseOrderNotes('');
        setPurchaseOrderStatus('draft');
        
        // Navigate to purchase order detail
        navigate(`/lats/purchase-orders/${result.data.id}`);
      } else {
        toast.error(result.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Error creating purchase order. Please try again.');
    } finally {
      setIsCreatingPO(false);
    }
  }, [selectedSupplier, purchaseCartItems, expectedDelivery, paymentTerms, purchaseOrderNotes, purchaseOrderStatus, selectedCurrency, exchangeRate, createPurchaseOrder, navigate]);

  // Format money with currency
  const formatMoney = (amount: number, currency?: string) => {
    const currencyToUse = currency || selectedCurrency.code;
    const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === currencyToUse) || selectedCurrency;
    
    if (currencyToUse === 'TZS') {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
    }
    
    return `${currencyObj.symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Purchase Order Top Bar */}
      <POTopBar
        cartItemsCount={purchaseCartItems.length}
        totalAmount={totalAmount}
        currency={selectedCurrency}
        productsCount={products.length}
        suppliersCount={suppliers.length}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
        onClearCart={handleClearCart}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query.trim()) {
            setShowSearchResults(true);
          } else {
            setShowSearchResults(false);
          }
        }}
        onAddSupplier={() => navigate('/lats/inventory-management?tab=suppliers')}
        onAddProduct={() => navigate('/lats/add-product')}
        onViewPurchaseOrders={() => navigate('/lats/purchase-orders')}
        onOpenDrafts={() => setShowDraftModal(true)}
        isCreatingPO={isCreatingPO}
        hasSelectedSupplier={!!selectedSupplier}
        draftCount={0} // TODO: Implement draft management
      />

      <div className="p-4 sm:p-6 pb-20 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Search Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Fixed Search Section */}
              <div className="flex-shrink-0 mb-6 space-y-4">
                {/* Product Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-orange-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products to add to purchase order... (Ctrl+F focus)"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchInputKeyPress}
                    className="w-full pl-14 pr-24 py-5 text-lg border-2 border-orange-200 rounded-xl bg-white text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{ minHeight: '60px' }}
                  />
                  
                  {/* Loading indicator */}
                  {isSearching && (
                    <div className="absolute left-14 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                    </div>
                  )}
                  
                  {/* Barcode indicator */}
                  {searchQuery.trim() && searchQuery.length >= 8 && /^[A-Za-z0-9]+$/.test(searchQuery) && (
                    <div className="absolute left-14 top-1/2 transform -translate-y-1/2">
                      <Barcode className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                      title="Advanced filters"
                    >
                      <Command className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          handleUnifiedSearch(searchQuery.trim());
                        }
                      }}
                      className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-95"
                      title="Search products"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Brand Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <select
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">All Brands</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stock Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                        <select
                          value={stockFilter}
                          onChange={(e) => setStockFilter(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="all">All Items</option>
                          <option value="in-stock">In Stock</option>
                          <option value="low-stock">Low Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="name">Name</option>
                          <option value="price">Price</option>
                          <option value="stock">Stock</option>
                          <option value="recent">Recent</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setSelectedBrand('');
                          setPriceRange({ min: '', max: '' });
                          setStockFilter('all');
                          setSortBy('name');
                          setSortOrder('asc');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Products Section */}
              <div className="flex-1 overflow-y-auto">
                {/* Search Results */}
                {showSearchResults && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-700">
                        Search Results ({filteredProducts.length})
                      </h3>
                      <button
                        onClick={() => setShowSearchResults(false)}
                        className="text-sm text-orange-600 hover:text-orange-800"
                      >
                        Show All Products
                      </button>
                    </div>
                    
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
                          <VariantProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToPurchaseCart}
                            primaryColor="orange"
                            actionText="Add to PO"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">No products found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* All Products Grid */}
                {!showSearchResults && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-700">Available Products</h3>
                      <span className="text-sm text-gray-500">{products.length} products</span>
                    </div>
                    {products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.slice(0, 12).map((product) => (
                          <VariantProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToPurchaseCart}
                            primaryColor="orange"
                            actionText="Add to PO"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2">📦</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
                        <p className="text-gray-600 mb-4">No products found in the database</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Purchase Cart Section */}
          <div className="lg:w-[450px] flex-shrink-0">
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Purchase Cart</h2>
                  <p className="text-sm text-gray-600">{purchaseCartItems.length} items to purchase</p>
                </div>
              </div>

              {/* Supplier Selection Section */}
              <div className="mb-6">
                {selectedSupplier ? (
                  <div className="p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {selectedSupplier.name.charAt(0)}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-gradient-to-r from-green-400 to-emerald-500">
                            <Truck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{selectedSupplier.name}</div>
                          {selectedSupplier.contactPerson && (
                            <div className="text-sm text-gray-600">{selectedSupplier.contactPerson}</div>
                          )}
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {selectedSupplier.phone || 'No phone'}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200">
                              {selectedSupplier.country || 'Unknown Location'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                              <Coins className="w-3 h-3" />
                              {selectedSupplier.currency || selectedCurrency.code}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // TODO: Show supplier details modal
                          }}
                          className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200"
                          title="View supplier details"
                        >
                          <User className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedSupplier(null)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowSupplierSearch(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 text-base border-2 border-orange-200 rounded-xl bg-white text-gray-900 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                    >
                      <Search className="w-5 h-5 text-orange-500" />
                      <span className="text-gray-600">Select Supplier</span>
                      <Plus className="w-4 h-4 text-orange-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Currency & Settings Section */}
              {selectedSupplier && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                        currencies={SUPPORTED_CURRENCIES}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      >
                        {PAYMENT_TERMS.map(term => (
                          <option key={term.id} value={term.id}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                {purchaseCartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h3>
                    <p className="text-gray-600 mb-4">Add products to create a purchase order</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {purchaseCartItems.map((item) => (
                      <div key={item.id} className="bg-white border-2 rounded-xl border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {item.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{item.name}</div>
                              {item.variantName && item.variantName !== 'Default' && (
                                <div className="text-sm text-gray-600">{item.variantName}</div>
                              )}
                              <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                              <div className="text-xs text-gray-500">Stock: {item.currentStock || 0}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity and Price Controls */}
                        <div className="space-y-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 w-16">Qty:</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Cost Price Input */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 w-16">Price:</span>
                            <div className="flex-1">
                              <input
                                type="number"
                                value={item.costPrice}
                                onChange={(e) => handleUpdateCostPrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>

                          {/* Total Price Display */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="font-bold text-orange-600">{formatMoney(item.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Order Summary */}
              {purchaseCartItems.length > 0 && (
                <>
                  {/* Expected Delivery Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Purchase Order Summary */}
                  <div className="mt-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-4 border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatMoney(subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tax (18%)</span>
                        <span className="font-semibold text-gray-900">{formatMoney(tax)}</span>
                      </div>
                      
                      <div className="border-t-2 border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatMoney(totalAmount)}
                          </span>
                        </div>
                        {selectedCurrency.code !== 'TZS' && (
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            ≈ {formatMoney(totalInBaseCurrency, 'TZS')} (Base currency)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-3 flex-shrink-0">
                    {/* Main Action Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Draft Button */}
                      <GlassButton
                        onClick={() => setShowDraftModal(true)}
                        icon={<Save size={20} />}
                        variant="outline"
                        className="w-full h-16"
                        disabled={purchaseCartItems.length === 0}
                      >
                        Save
                      </GlassButton>
                      
                      {/* Clear Cart Button */}
                      <GlassButton
                        onClick={handleClearCart}
                        icon={<Trash2 size={20} />}
                        variant="secondary"
                        className="w-full h-16"
                      >
                        Clear
                      </GlassButton>
                      
                      {/* Create PO Button */}
                      <GlassButton
                        onClick={handleCreatePurchaseOrder}
                        icon={isCreatingPO ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                        className="w-full h-16 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-bold"
                        disabled={!selectedSupplier || purchaseCartItems.length === 0 || !expectedDelivery || isCreatingPO}
                      >
                        {isCreatingPO ? 'Creating...' : 'Create PO'}
                      </GlassButton>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Supplier Search Modal */}
      {showSupplierSearch && (
        <SupplierSelectionModal
          isOpen={showSupplierSearch}
          onClose={() => setShowSupplierSearch(false)}
          onSupplierSelect={handleSupplierSelect}
          suppliers={suppliers}
        />
      )}

      {/* Purchase Order Settings Modal */}
      {showSettings && (
        <PurchaseOrderSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Draft Management Modal */}
      {showDraftModal && (
        <PurchaseOrderDraftModal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          cartItems={purchaseCartItems}
          supplier={selectedSupplier}
          currency={selectedCurrency}
          expectedDelivery={expectedDelivery}
          paymentTerms={paymentTerms}
          notes={purchaseOrderNotes}
        />
      )}

      {/* Purchase Order Summary Modal */}
      {showPOSummary && (
        <PurchaseOrderSummaryModal
          isOpen={showPOSummary}
          onClose={() => setShowPOSummary(false)}
          cartItems={purchaseCartItems}
          supplier={selectedSupplier}
          currency={selectedCurrency}
          subtotal={subtotal}
          tax={tax}
          totalAmount={totalAmount}
          expectedDelivery={expectedDelivery}
          paymentTerms={paymentTerms}
          notes={purchaseOrderNotes}
          onCreatePO={handleCreatePurchaseOrder}
          isCreating={isCreatingPO}
        />
      )}
    </div>
  );
};

export default PurchaseOrderPage;