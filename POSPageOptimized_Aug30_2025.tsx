import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import ProductSearchSection from '../components/pos/ProductSearchSection';
import POSCartSection from '../components/pos/POSCartSection';
import {
  ShoppingCart, Search, Barcode, CreditCard, Receipt, Plus, Minus, Trash2, DollarSign, Package, TrendingUp, Users, Activity, Calculator, Scan, ArrowLeft, ArrowRight, CheckCircle, XCircle, RefreshCw, AlertCircle, User, Phone, Mail, Crown, ChevronDown, ChevronUp, Clock, Smartphone, Warehouse, Command, FileText, BarChart3, Settings, Truck, Zap, Star, Gift, Clock as ClockIcon, Hash as HashIcon
} from 'lucide-react';
import { useDynamicDataStore, simulateSale } from '../lib/data/dynamicDataStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { posService } from '../../../lib/posService';
import { supabase } from '../../../lib/supabaseClient';
import { getExternalProductBySku, markExternalProductAsSold } from '../../../lib/externalProductApi';
import { 
  isSingleVariantProduct, 
  isMultiVariantProduct, 
  getPrimaryVariant, 
  getProductDisplayPrice, 
  getProductTotalStock,
  getProductStockStatus 
} from '../lib/productUtils';

// Import new smart services
import { smartSearchService } from '../lib/smartSearch';
import { realTimeStockService } from '../lib/realTimeStock';
import { dynamicPricingService } from '../lib/dynamicPricing';

// Import variant-aware POS components
import VariantProductCard from '../components/pos/VariantProductCard';
import VariantCartItem from '../components/pos/VariantCartItem';
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../lib/robustImageService';
import DeliverySection from '../components/pos/DeliverySection';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';
import SalesAnalyticsModal from '../components/pos/SalesAnalyticsModal';
import ZenoPayPaymentModal from '../components/pos/ZenoPayPaymentModal';
import PaymentTrackingModal from '../components/pos/PaymentTrackingModal';

import POSBottomBar from '../components/pos/POSBottomBar';
import DynamicPricingDisplay from '../components/pos/DynamicPricingDisplay';
import POSPricingSettings from '../components/pos/POSPricingSettings';
import DynamicPricingSettings from '../components/pos/DynamicPricingSettings';
import ReceiptSettings from '../components/pos/ReceiptSettings';
import BarcodeScannerSettingsTab from '../components/pos/BarcodeScannerSettingsTab';
import DeliverySettingsTab from '../components/pos/DeliverySettingsTab';
import SearchFilterSettingsTab from '../components/pos/SearchFilterSettingsTab';
import UserPermissionsSettingsTab from '../components/pos/UserPermissionsSettingsTab';
import LoyaltyCustomerSettingsTab from '../components/pos/LoyaltyCustomerSettingsTab';
import AnalyticsReportingSettingsTab from '../components/pos/AnalyticsReportingSettingsTab';
import AdvancedNotificationSettingsTab from '../components/pos/AdvancedNotificationSettingsTab';
import AdvancedSettingsTab from '../components/pos/AdvancedSettingsTab';
import GeneralSettingsTab from '../components/pos/GeneralSettingsTab';
import DynamicPricingSettingsTab from '../components/pos/DynamicPricingSettingsTab';
import ReceiptSettingsTab from '../components/pos/ReceiptSettingsTab';

// Import lazy-loaded modal wrappers
import { 
  POSSettingsModalWrapper, 
  POSDiscountModalWrapper, 
  POSReceiptModalWrapper,
  type POSSettingsModalRef 
} from '../components/pos/POSModals';

// Import draft functionality
import { useDraftManager } from '../hooks/useDraftManager';
import DraftManagementModal from '../components/pos/DraftManagementModal';
import DraftNotification from '../components/pos/DraftNotification';
import { POSSettingsService } from '../../../lib/posSettingsApi';
import { toast } from 'react-hot-toast';
import { 
  useDynamicPricingSettings,
  useGeneralSettings,
  useReceiptSettings,
  useBarcodeScannerSettings,
  useDeliverySettings,
  useSearchFilterSettings,
  useUserPermissionsSettings,
  useLoyaltyCustomerSettings,
  useAnalyticsReportingSettings,
  useNotificationSettings,
  useAdvancedSettings
} from '../../../hooks/usePOSSettings';
import { useDynamicDelivery } from '../hooks/useDynamicDelivery';

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
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Custom hook for debounced search
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

const POSPageOptimized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get dynamic data from store (for sales and payments)
  const { sales, addSale, addPayment } = useDynamicDataStore();
  
  // Get real customers from CustomersContext
  const { customers } = useCustomers();

  // All POS settings hooks
  const { settings: generalSettings } = useGeneralSettings();
  const { settings: dynamicPricingSettings } = useDynamicPricingSettings();
  const { settings: receiptSettings } = useReceiptSettings();
  const { settings: barcodeScannerSettings } = useBarcodeScannerSettings();
  const { settings: deliverySettings } = useDeliverySettings();
  const dynamicDelivery = useDynamicDelivery(deliverySettings);
  const [selectedDeliveryArea, setSelectedDeliveryArea] = useState<string>('');
  const { settings: searchFilterSettings } = useSearchFilterSettings();
  const { settings: userPermissionsSettings } = useUserPermissionsSettings();
  const { settings: loyaltyCustomerSettings } = useLoyaltyCustomerSettings();
  const { settings: analyticsReportingSettings } = useAnalyticsReportingSettings();
  const { settings: notificationSettings } = useNotificationSettings();
  const { settings: advancedSettings } = useAdvancedSettings();

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
    getSoldQuantity,
    loadSales
  } = useInventoryStore();

  // Performance optimization: Cache data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const isCachingEnabled = advancedSettings?.enable_caching;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTime = searchFilterSettings?.search_debounce_time || SEARCH_DEBOUNCE_MS;
  const debouncedSearchQuery = useDebounce(searchQuery, debounceTime);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'sales'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Settings state
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Customer state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [cashierName] = useState('John Cashier'); // In real app, get from auth
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Barcode scanning state
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<Array<{barcode: string, product: any, timestamp: Date}>>([]);

  // Modal states
  const [showAddExternalProductModal, setShowAddExternalProductModal] = useState(false);
  const [showDeliverySection, setShowDeliverySection] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

  // Draft management
  const { 
    saveDraft, 
    loadDraft, 
    getAllDrafts, 
    deleteDraft, 
    hasUnsavedChanges,
    currentDraftId 
  } = useDraftManager(cartItems, selectedCustomer);

  // Discount state
  const [manualDiscount, setManualDiscount] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  // Stats and notifications
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    topSellingProducts: []
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentShift, setCurrentShift] = useState({
    startTime: new Date(),
    totalSales: 0,
    totalTransactions: 0
  });

  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);

  // Receipt state
  const [receiptTemplate, setReceiptTemplate] = useState({
    header: '',
    footer: '',
    includeLogo: true,
    includeQR: true
  });
  const [receiptHistory, setReceiptHistory] = useState<any[]>([]);
  const [showReceiptHistory, setShowReceiptHistory] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptPrintMode, setReceiptPrintMode] = useState<'thermal' | 'a4' | 'email'>('thermal');

  // Inventory alerts
  const [showInventoryAlerts, setShowInventoryAlerts] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [inventoryAlerts, setInventoryAlerts] = useState<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    type: 'low_stock' | 'out_of_stock';
  }>>([]);

  // Stock adjustment
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<any>(null);

  // Customer loyalty
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState<{[key: string]: number}>({});
  const [customerPurchaseHistory, setCustomerPurchaseHistory] = useState<{[key: string]: any[]}>({});
  const [customerNotes, setCustomerNotes] = useState<{[key: string]: string}>({});
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<any>(null);
  const [showLoyaltyPoints, setShowLoyaltyPoints] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  // Analytics and reporting
  const [showSalesAnalytics, setShowSalesAnalytics] = useState(false);

  // Payment processing
  const [showZenoPayPayment, setShowZenoPayPayment] = useState(false);

  // Payment tracking
  const [showPaymentTracking, setShowPaymentTracking] = useState(false);

  // Settings modal refs
  const settingsModalRef = useRef<POSSettingsModalRef>(null);
  const generalSettingsRef = useRef<any>(null);
  const dynamicPricingSettingsRef = useRef<any>(null);
  const receiptSettingsRef = useRef<any>(null);
  const barcodeScannerSettingsRef = useRef<any>(null);
  const deliverySettingsRef = useRef<any>(null);
  const searchFilterSettingsRef = useRef<any>(null);
  const userPermissionsSettingsRef = useRef<any>(null);
  const loyaltyCustomerSettingsRef = useRef<any>(null);
  const analyticsReportingSettingsRef = useRef<any>(null);
  const notificationSettingsRef = useRef<any>(null);
  const advancedSettingsRef = useRef<any>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadSuppliers(),
          loadSales()
        ]);
        setDataLoaded(true);
        setLastLoadTime(Date.now());
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    if (!dataLoaded || (isCachingEnabled && Date.now() - lastLoadTime > CACHE_DURATION_MS)) {
      loadInitialData();
    }
  }, [dataLoaded, lastLoadTime, isCachingEnabled]);

  // Search functionality
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      // Generate search suggestions
      const suggestions = dbProducts.filter(product => 
        product.name?.toLowerCase().includes(query.toLowerCase()) ||
        product.sku?.toLowerCase().includes(query.toLowerCase()) ||
        product.brand?.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleSearchInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleUnifiedSearch(searchQuery.trim());
      }
    }
  };

  const handleUnifiedSearch = (query: string) => {
    // Check if it's a barcode
    if (/^\d{8,}$/.test(query)) {
      // It's likely a barcode
      startBarcodeScanner();
    } else {
      // Regular search
      setShowSearchResults(true);
    }
  };

  const startBarcodeScanner = () => {
    if (barcodeScannerSettings?.enable_barcode_scanner) {
      setShowBarcodeScanner(true);
    } else {
      toast('Barcode scanning not available');
    }
  };

  // Cart functionality
  const addToCart = (product: any, variant?: any) => {
    const existingItem = cartItems.find(item => 
      item.productId === product.id && 
      (!variant || item.variant?.id === variant.id)
    );

    if (existingItem) {
      setCartItems(prev => prev.map(item => 
        item.id === existingItem.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem = {
        id: `${product.id}-${variant?.id || 'default'}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: variant?.price || product.price,
        quantity: 1,
        totalPrice: variant?.price || product.price,
        variant,
        image: product.image
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeCartItem(itemId);
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity, totalPrice: quantity * item.price }
          : item
      ));
    }
  };

  const removeCartItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Customer functionality
  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
  };

  const handleShowCustomerSearch = () => {
    setShowCustomerSearchModal(true);
  };

  const handleShowCustomerDetails = (customer: any) => {
    setSelectedCustomerForDetails(customer);
    setShowCustomerDetails(true);
  };

  // Payment processing
  const handleProcessPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  // Calculate totals
  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = manualDiscount;
  const finalAmount = totalAmount - discountAmount;

  // Check if barcode scanner is enabled
  const isBarcodeScannerEnabled = barcodeScannerSettings?.enable_barcode_scanner;

  return (
    <div className="min-h-screen">
      {/* POS Top Bar */}
      <POSTopBar
        cartItemsCount={cartItems.length}
        totalAmount={totalAmount}
        productsCount={dbProducts.length}
        salesCount={sales.length}
        onProcessPayment={handleProcessPayment}
        onClearCart={clearCart}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query.trim()) {
            setShowSearchResults(true);
          } else {
            setShowSearchResults(false);
          }
        }}
        onScanBarcode={isBarcodeScannerEnabled ? startBarcodeScanner : undefined}
        onAddCustomer={() => {
          navigate('/customers');
        }}
        onAddProduct={userPermissionsSettings?.enable_product_creation ? () => {
          navigate('/lats/add-product');
        } : undefined}
        onViewReceipts={() => {
          alert('Receipts view coming soon!');
        }}
        onViewSales={analyticsReportingSettings?.enable_analytics ? () => {
          setShowSalesAnalytics(true);
        } : undefined}
        onOpenPaymentTracking={() => {
          setShowPaymentTracking(true);
        }}
        onOpenDrafts={() => setShowDraftModal(true)}
        isProcessingPayment={isProcessingPayment}
        hasSelectedCustomer={!!selectedCustomer}
        draftCount={getAllDrafts().length}
      />

      <div className="p-4 sm:p-6 pb-20 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Search Section */}
          <ProductSearchSection
            products={dbProducts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            categories={categories}
            brands={brands}
            onAddToCart={addToCart}
            onAddExternalProduct={() => setShowAddExternalProductModal(true)}
            onSearch={handleUnifiedSearch}
            onScanBarcode={startBarcodeScanner}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            productsPerPage={PRODUCTS_PER_PAGE}
          />

          {/* Cart Section */}
          <POSCartSection
            cartItems={cartItems}
            selectedCustomer={selectedCustomer}
            onRemoveCustomer={handleRemoveCustomer}
            onShowCustomerSearch={handleShowCustomerSearch}
            onShowCustomerDetails={handleShowCustomerDetails}
            onUpdateCartItemQuantity={updateCartItemQuantity}
            onRemoveCartItem={removeCartItem}
            onApplyDiscount={(type, value) => {
              setManualDiscount(value);
              setShowDiscountModal(false);
            }}
            onProcessPayment={handleProcessPayment}
            dynamicPricingEnabled={dynamicPricingSettings?.enable_dynamic_pricing}
            totalAmount={totalAmount}
            discountAmount={discountAmount}
            finalAmount={finalAmount}
          />
        </div>
      </div>

      {/* Modals */}
      <AddExternalProductModal
        isOpen={showAddExternalProductModal}
        onClose={() => setShowAddExternalProductModal(false)}
        onAddProduct={(product) => {
          addToCart(product);
          setShowAddExternalProductModal(false);
        }}
      />

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerAdded={(customer) => {
          setSelectedCustomer(customer);
          setShowAddCustomerModal(false);
        }}
      />

      <DraftManagementModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        drafts={getAllDrafts()}
        onLoadDraft={loadDraft}
        onDeleteDraft={deleteDraft}
        onSaveDraft={saveDraft}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <SalesAnalyticsModal
        isOpen={showSalesAnalytics}
        onClose={() => setShowSalesAnalytics(false)}
        sales={sales}
        dailyStats={dailyStats}
      />

      <ZenoPayPaymentModal
        isOpen={showZenoPayPayment}
        onClose={() => setShowZenoPayPayment(false)}
        amount={finalAmount}
        onPaymentComplete={(payment) => {
          // Handle payment completion
          setShowZenoPayPayment(false);
        }}
      />

      <PaymentTrackingModal
        isOpen={showPaymentTracking}
        onClose={() => setShowPaymentTracking(false)}
        payments={sales}
      />
    </div>
  );
};

export default POSPageOptimized;
