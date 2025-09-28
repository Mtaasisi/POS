import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../../context/CustomersContext';
import { useAuth } from '../../../context/AuthContext';
import { rbacManager, type UserRole } from '../lib/rbac';
// import { useInventoryAlertPreferences } from '../../../../hooks/useInventoryAlertPreferences';
// import { applyInventoryAlertsMigration } from '../../../../utils/applyInventoryAlertsMigration';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import POSTopBar from '../components/pos/POSTopBar';
import ProductSearchSection from '../components/pos/ProductSearchSection';
import POSCartSection from '../components/pos/POSCartSection';
import { useDynamicDataStore } from '../lib/data/dynamicDataStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import DeliverySection from '../components/pos/DeliverySection';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';
import CustomerSelectionModal from '../components/pos/CustomerSelectionModal';
import CustomerEditModal from '../components/pos/CustomerEditModal';
import SalesAnalyticsModal from '../components/pos/SalesAnalyticsModal';
import ZenoPayPaymentModal from '../components/pos/ZenoPayPaymentModal';
import PaymentTrackingModal from '../components/pos/PaymentTrackingModal';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';
// import { supabase } from '../../../lib/supabaseClient';
import { usePaymentMethodsContext } from '../../../context/PaymentMethodsContext';
import { latsEventBus } from '../lib/data/eventBus';


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
import { saleProcessingService } from '../../../lib/saleProcessingService';
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
// const convertToProductImages = (imageUrls: string[]): ProductImage[] => {
//   if (!imageUrls || imageUrls.length === 0) return [];
//   
//   return imageUrls.map((imageUrl, index) => ({
//     id: `temp-${index}`,
//     url: imageUrl,
//     thumbnailUrl: imageUrl,
//     fileName: `product-image-${index + 1}`,
//     fileSize: 0,
//     isPrimary: index === 0,
//     uploadedAt: new Date().toISOString()
//   }));
// };


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
  
  // Get dynamic data from store (for sales and payments)
  const { sales } = useDynamicDataStore();
  
  // Get customers from context
  const { customers } = useCustomers();
  console.log('🔍 Context customers loaded:', customers?.length, 'customers');
  
  
  // Get authenticated user
  const { currentUser } = useAuth();
  
  // Inventory alert preferences from database (temporarily disabled)
  // const {
  //   preferences: alertPreferences,
  //   loading: alertPreferencesLoading,
  //   dismissAlertsForToday,
  //   permanentlyDisableAlerts,
  //   areAlertsDismissedForToday,
  //   logAlertHistory,
  //   isLowStockAlertsEnabled,
  //   lowStockThreshold: dbLowStockThreshold,
  //   showAlertsAsModal,
  //   showAlertsAsNotification,
  //   autoHideNotificationSeconds,
  //   areAlertsPermanentlyDisabled
  // } = useInventoryAlertPreferences();

  // Permission checks for current user
  const userRole = currentUser?.role as UserRole;
  const canAccessPOS = rbacManager.can(userRole, 'pos', 'view');
  const canSell = rbacManager.can(userRole, 'pos', 'sell');
  const canRefund = rbacManager.can(userRole, 'pos', 'refund');
  const canVoid = rbacManager.can(userRole, 'pos', 'void');
  const canViewInventory = rbacManager.can(userRole, 'pos-inventory', 'view');
  const canSearchInventory = rbacManager.can(userRole, 'pos-inventory', 'search');
  const canAddToCart = rbacManager.can(userRole, 'pos-inventory', 'add-to-cart');
  const canCreateSales = rbacManager.can(userRole, 'sales', 'create');
  const canViewSales = rbacManager.can(userRole, 'sales', 'view');
  const canEditSales = rbacManager.can(userRole, 'sales', 'edit');
  const canDeleteSales = rbacManager.can(userRole, 'sales', 'delete');
  const canRefundSales = rbacManager.can(userRole, 'sales', 'refund');

  // Get payment methods from global context
  const { paymentMethods: dbPaymentMethods, loading: paymentMethodsLoading } = usePaymentMethodsContext();

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
    loadProducts,
    loadCategories,
    loadSuppliers,
    loadSales
  } = useInventoryStore();

  // Transform products with category information
  const products = useMemo(() => {
    if (dbProducts.length === 0 || categories.length === 0) {
      return [];
    }
    
    return dbProducts.map(product => {
      // Try multiple possible category field names - handle both camelCase and snake_case
      const categoryId = product.categoryId || (product as any).category_id || (product as any).category?.id;
      
      // Find category by ID, with fallback to name matching if ID doesn't work
      let categoryName = 'Unknown Category';
      let foundCategory = null;
      
      if (categoryId && categories.length > 0) {
        foundCategory = categories.find(c => c.id === categoryId);
        if (foundCategory) {
          categoryName = foundCategory.name;
        }
      }
      
      // If no category found by ID, try to find by name (for backward compatibility)
      if (!foundCategory && product.name && categories.length > 0) {
        // Try to match category by product name patterns
        const productNameLower = product.name.toLowerCase();
        foundCategory = categories.find(c => {
          const categoryNameLower = c.name.toLowerCase();
          return productNameLower.includes(categoryNameLower) || 
                 categoryNameLower.includes(productNameLower);
        });
        if (foundCategory) {
          categoryName = foundCategory.name;
        }
      }
      
      return {
        ...product,
        categoryName,
        // Ensure category object is available for backward compatibility
        category: product.category || (foundCategory ? {
          id: foundCategory.id,
          name: foundCategory.name,
          description: foundCategory.description,
          color: foundCategory.color
        } : undefined)
      };
    });
  }, [dbProducts, categories]);

  // Performance optimization: Cache data loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const isCachingEnabled = advancedSettings?.enable_caching;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTime = searchFilterSettings?.search_debounce_time || SEARCH_DEBOUNCE_MS;
  const debouncedSearchQuery = useDebounce(searchQuery, debounceTime);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('in-stock');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'sales'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Settings state
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [cashierName, setCashierName] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // QrCode scanning state
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<Array<{barcode: string, product: any, timestamp: Date}>>([]);

  // Modal states
  const [showAddExternalProductModal, setShowAddExternalProductModal] = useState(false);
  const [showDeliverySection, setShowDeliverySection] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false);
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

  // Draft management
  const { 
    saveDraft, 
    loadDraft, 
    getAllDrafts, 
    hasUnsavedChanges,
    currentDraftId 
  } = useDraftManager({
    cartItems,
    customer: selectedCustomer
  });

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

  // QrCode scanner state
  const [showQrCodeScanner, setShowQrCodeScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedQrCodes, setScannedQrCodes] = useState<string[]>([]);

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
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [alertsDismissedToday, setAlertsDismissedToday] = useState(false);
  const [showAlertsAsNotification, setShowAlertsAsNotification] = useState(false);

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

  // Set cashier name from authenticated user
  useEffect(() => {
    if (currentUser) {
      setCashierName(currentUser.name || currentUser.email || 'POS User');
    }
  }, [currentUser]);

  // Component-level permission check
  useEffect(() => {
    if (currentUser && !canAccessPOS) {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, canAccessPOS, navigate]);

  // Show access denied if user doesn't have POS permissions
  if (!currentUser || !canAccessPOS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access the POS system.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }


  // Load initial data with comprehensive error handling
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Loading initial POS data...');
        
        // Load data with individual error handling
        const results = await Promise.allSettled([
          loadProducts(),
          loadCategories(),
          loadSuppliers(),
          loadSales()
        ]);

        // Check results and provide specific feedback
        const errors = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              const dataTypes = ['products', 'categories', 'suppliers', 'sales'];
              console.error(`Failed to load ${dataTypes[index]}:`, result.reason);
              return dataTypes[index];
            }
            return null;
          })
          .filter(Boolean);

        if (errors.length > 0) {
          toast.error(`Failed to load: ${errors.join(', ')}. Some features may not work properly.`);
        } else {
          toast.success('POS data loaded successfully');
        }

        // Debug categories loading
        console.log('🔍 POS Categories Debug:', {
          categoriesCount: categories?.length || 0,
          categories: categories?.map(cat => ({ id: cat.id, name: cat.name })) || [],
          categoriesLoaded: !!categories && categories.length > 0,
          categoriesData: categories
        });

        setDataLoaded(true);
        setLastLoadTime(Date.now());
      } catch (error) {
        console.error('Critical error loading initial data:', error);
        toast.error('Critical error loading POS data. Please refresh the page.');
      }
    };

    if (!dataLoaded || (isCachingEnabled && Date.now() - lastLoadTime > CACHE_DURATION_MS)) {
      loadInitialData();
    }
  }, [dataLoaded, lastLoadTime, isCachingEnabled]);

  // Monitor categories loading
  useEffect(() => {
    console.log('🔍 Categories State Changed:', {
      categoriesCount: categories?.length || 0,
      categories: categories?.map(cat => ({ id: cat.id, name: cat.name })) || [],
      categoriesLoaded: !!categories && categories.length > 0
    });
  }, [categories]);

  // Test direct category loading
  useEffect(() => {
    const testCategoryLoading = async () => {
      try {
        console.log('🧪 Testing direct category loading...');
        await loadCategories();
        console.log('🧪 Direct category loading completed');
      } catch (error) {
        console.error('🧪 Direct category loading failed:', error);
      }
    };
    
    // Test after a short delay to see if it's a timing issue
    const timer = setTimeout(testCategoryLoading, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for stock updates and refresh POS data after sales
  useEffect(() => {
    const handleStockUpdate = (event: any) => {
      console.log('🔄 [POSPageOptimized] Stock update detected, refreshing products...', event);
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadProducts();
      }, 500);
    };

    const handleSaleCompleted = (event: any) => {
      console.log('🔄 [POSPageOptimized] Sale completed, refreshing products and sales...', event);
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadProducts();
        loadSales();
      }, 500);
    };

    // Subscribe to relevant events
    const unsubscribeStock = latsEventBus.subscribe('lats:stock.updated', handleStockUpdate);
    const unsubscribeSale = latsEventBus.subscribe('lats:sale.completed', handleSaleCompleted);

    // Cleanup subscriptions
    return () => {
      unsubscribeStock();
      unsubscribeSale();
    };
  }, [loadProducts, loadSales]);


  // Customer selection functionality with error handling
  const handleRemoveCustomer = () => {
    try {
      if (!selectedCustomer) {
        toast.success('No customer to remove.');
        return;
      }
      
      setSelectedCustomer(null);
      toast.success('Customer removed');
    } catch (error) {
      console.error('Error removing customer:', error);
      toast.error('Failed to remove customer. Please try again.');
    }
  };

  const handleShowCustomerDetails = () => {
    if (selectedCustomer) {
      setSelectedCustomerForDetails(selectedCustomer);
      setShowCustomerDetails(true);
    }
  };


  const handleUnifiedSearch = (query: string) => {
    // Check if it's a barcode
    if (/^\d{8,}$/.test(query)) {
      // It's likely a barcode
      startQrCodeScanner();
    } else {
      // Regular search
      setShowSearchResults(true);
    }
  };

  const startQrCodeScanner = () => {
    try {
      // Check permissions
      if (!canSearchInventory) {
        return;
      }

      if (!barcodeScannerSettings?.enable_barcode_scanner) {
        toast.error('QrCode scanning is not enabled in settings.');
        return;
      }

      if (dbProducts.length === 0) {
        toast.error('No products available for scanning. Please load products first.');
        return;
      }

      setShowQrCodeScanner(true);
      setIsScanning(true);
      setScannerError('');
      toast.success('QrCode scanner started. Scan a product barcode.');
      
      // Start real barcode scanning
      // Note: In production, this would integrate with a real barcode scanner library
      // For now, we'll show a message to use external barcode scanner
      toast.success('Please use your external barcode scanner device to scan products');
      setIsScanning(false);
    } catch (error) {
      console.error('Error starting barcode scanner:', error);
      toast.error('Failed to start barcode scanner. Please try again.');
      setShowQrCodeScanner(false);
      setIsScanning(false);
    }
  };

  const handleQrCodeScanned = (barcode: string) => {
    try {
      // Validate barcode
      if (!barcode || barcode.trim() === '') {
        setScannerError('Invalid barcode');
        toast.error('Invalid barcode scanned. Please try again.');
        setIsScanning(false);
        setShowQrCodeScanner(false);
        return;
      }

      // Find product by barcode
      const product = dbProducts.find(p => (p as any).barcode === barcode || p.id.toString() === barcode);
      
      if (product) {
        // Add product to cart
        const existingItem = cartItems.find(item => item.productId === product.id);
        if (existingItem) {
          updateCartItemQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
          addToCart(product);
        }
        toast.success(`Product added: ${product.name}`);
        setScannedQrCodes(prev => [...prev, barcode]);
      } else {
        setScannerError('Product not found');
        toast.error(`Product not found for barcode: ${barcode}`);
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      setScannerError('Failed to process barcode');
      toast.error('Failed to process barcode. Please try again.');
    } finally {
      setIsScanning(false);
      setShowQrCodeScanner(false);
    }
  };

  const stopQrCodeScanner = () => {
    setShowQrCodeScanner(false);
    setIsScanning(false);
    setScannerError('');
    toast('QrCode scanner stopped');
  };

  // Inventory alerts functionality
  const checkLowStock = () => {
    // Use local threshold for now
    const threshold = lowStockThreshold || 5;
    
    const lowStockProducts = dbProducts.filter(product => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + ((variant as any).quantity || 0), 0) || 0;
      return totalStock <= threshold;
    });
    
    if (lowStockProducts.length > 0) {
      const newAlerts = lowStockProducts.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.variants?.reduce((sum, variant) => sum + ((variant as any).quantity || 0), 0) || 0,
        threshold: lowStockThreshold || 5,
        type: 'low_stock' as const
      }));
      
      setInventoryAlerts(newAlerts);
      
      // Check if there are new alerts that weren't previously dismissed
      const hasNewAlerts = newAlerts.some(newAlert => 
        !inventoryAlerts.some(existingAlert => 
          existingAlert.productId === newAlert.productId && 
          existingAlert.currentStock === newAlert.currentStock
        )
      );
      
      // Show notification instead of blocking modal if dismissed today
      if (alertsDismissedToday) {
        setShowAlertsAsNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowAlertsAsNotification(false);
        }, 5000);
      } else if (!alertsDismissed || hasNewAlerts) {
        setShowInventoryAlerts(true);
        if (hasNewAlerts) {
          setAlertsDismissed(false); // Reset dismissed state for new alerts
        }
      }
    } else {
      // No low stock products, reset alerts
      setInventoryAlerts([]);
    }
  };

  const handleCloseInventoryAlerts = (dismissForToday = false) => {
    setShowInventoryAlerts(false);
    setAlertsDismissed(true);
    
    if (dismissForToday) {
      const today = new Date().toDateString();
      localStorage.setItem('inventoryAlertsDismissedToday', today);
      setAlertsDismissedToday(true);
    }
  };

  const handleShowInventoryAlerts = () => {
    setShowInventoryAlerts(true);
    setAlertsDismissed(false);
  };

  // Migration handler for testing
  const handleApplyMigration = async () => {
    const success = await applyInventoryAlertsMigration();
    if (success) {
      toast.success('Database migration applied successfully!');
    } else {
      toast.error('Migration failed. Check console for details.');
    }
  };

  // Check for dismissed alerts today from database
  useEffect(() => {
    const checkDismissedAlerts = async () => {
      if (currentUser?.id && !alertPreferencesLoading) {
        const dismissed = await areAlertsDismissedForToday();
        setAlertsDismissedToday(dismissed);
      }
    };
    checkDismissedAlerts();
  }, [currentUser?.id, alertPreferencesLoading, areAlertsDismissedForToday]);

  // Check for low stock on data load
  useEffect(() => {
    if (dbProducts.length > 0) {
      checkLowStock();
    }
  }, [dbProducts, lowStockThreshold]);

  // Stock adjustment functionality
  const handleStockAdjustment = (productId: string, adjustment: number, _reason: string) => {
    try {
      // Find the product
      const product = dbProducts.find(p => p.id === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // Update stock (this would normally call an API)
      toast.success(`Stock adjusted for ${product.name}: ${adjustment > 0 ? '+' : ''}${adjustment}`);
      
      // Close the modal
      setShowStockAdjustment(false);
      setSelectedProductForAdjustment(null);
      
      // Refresh inventory data
      loadProducts();
    } catch (error) {
      toast.error('Failed to adjust stock');
      console.error('Stock adjustment error:', error);
    }
  };

  // Loyalty points functionality
  const handleAddLoyaltyPoints = (customerId: string, points: number, _reason: string) => {
    try {
      // Find the customer
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        toast.error('Customer not found');
        return;
      }

      // Add loyalty points (this would normally call an API)
      setCustomerLoyaltyPoints(prev => ({
        ...prev,
        [customerId]: (prev[customerId] || 0) + points
      }));
      toast.success(`Added ${points} loyalty points to ${customer.name}`);
      
      // Close the modal
      setShowLoyaltyPoints(false);
      setPointsToAdd('');
      setPointsReason('');
    } catch (error) {
      toast.error('Failed to add loyalty points');
      console.error('Loyalty points error:', error);
    }
  };

  // Receipt history functionality
  const loadReceiptHistory = async () => {
    try {
      // Load real receipt history from database
      // This would typically call a receipts API or query the sales table
      const receipts = sales.map((sale, index) => ({
        id: sale.id,
        saleId: sale.id,
        date: (sale as any).created_at || (sale as any).soldAt || new Date().toISOString(),
        total: (sale as any).total_amount || (sale as any).total || 0,
        customer: (sale as any).customer_name || sale.customerName || 'Walk-in Customer',
        items: (sale as any).items?.length || 0
      }));
      setReceiptHistory(receipts);
    } catch (error) {
      console.error('Error loading receipt history:', error);
      toast.error('Failed to load receipt history');
    }
  };

  useEffect(() => {
    if (showReceiptHistory) {
      loadReceiptHistory();
    }
  }, [showReceiptHistory, sales]);

  // Cart functionality with error handling
  const addToCart = (product: any, variant?: any) => {
    try {
      // Check permissions
      if (!canAddToCart) {
        return;
      }

      // Validate product
      if (!product || !product.id) {
        toast.error('Invalid product. Please try again.');
        return;
      }

      // Validate price
      const price = variant?.price || product.price;
      if (!price || price <= 0) {
        toast.error('Invalid product price. Please contact support.');
        return;
      }

      const existingItem = cartItems.find(item => 
        item.productId === product.id && 
        (!variant || item.variantId === variant.id)
      );

      if (existingItem) {
        setCartItems(prev => prev.map(item => 
          item.id === existingItem.id 
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        ));
        toast.success(`${product.name} quantity updated`);
      } else {
        const newItem = {
          id: `${product.id}-${variant?.id || 'default'}-${Date.now()}`,
          productId: product.id,
          variantId: variant?.id || 'default',
          productName: product.name,
          variantName: variant?.name || 'Default',
          sku: variant?.sku || product.sku || 'N/A',
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          availableQuantity: variant?.quantity || product.quantity || 0,
          image: product.image
        };
        setCartItems(prev => [...prev, newItem]);
        toast.success(`${product.name} added to cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    try {
      // Validate inputs
      if (!itemId) {
        toast.error('Invalid item ID. Please try again.');
        return;
      }

      if (quantity < 0) {
        toast.error('Quantity cannot be negative.');
        return;
      }

      if (quantity === 0) {
        removeCartItem(itemId);
        return;
      }

      // Check if item exists
      const existingItem = cartItems.find(item => item.id === itemId);
      if (!existingItem) {
        toast.error('Item not found in cart.');
        return;
      }

      setCartItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      toast.error('Failed to update item quantity. Please try again.');
    }
  };

  const removeCartItem = (itemId: string) => {
    try {
      if (!itemId) {
        toast.error('Invalid item ID. Please try again.');
        return;
      }

      const itemToRemove = cartItems.find(item => item.id === itemId);
      if (itemToRemove) {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        toast.success(`${itemToRemove.productName} removed from cart`);
      } else {
        toast.error('Item not found in cart.');
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast.error('Failed to remove item from cart. Please try again.');
    }
  };

  const clearCart = () => {
    try {
      if (cartItems.length === 0) {
        toast.success('Cart is already empty.');
        return;
      }
      
      setCartItems([]);
      toast.success('Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart. Please try again.');
    }
  };

  // Customer functionality - functions already defined above

  // Payment processing with error handling
  const handleProcessPayment = () => {
    try {
      // Check permissions
      if (!canSell || !canCreateSales) {
        return;
      }

      // Validate cart
      if (cartItems.length === 0) {
        toast.error('Cart is empty. Please add items before processing payment.');
        return;
      }

      // Validate total amount
      if (finalAmount <= 0) {
        toast.error('Invalid total amount. Please check your cart items.');
        return;
      }

      // Check if customer is required for certain payment methods (optional for now)
      if (!selectedCustomer && (finalAmount > 50000)) {
        toast.error('Customer information is recommended for payments over 50,000 TZS');
        // Don't return, just show warning
      }

      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error in handleProcessPayment:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handleRefreshData = () => {
    loadProducts();
    loadSales();
    loadCategories();
    loadSuppliers();
    toast.success('Data refreshed successfully');
  };

  // Calculate totals
  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = manualDiscount;
  const finalAmount = totalAmount - discountAmount;

  // Check if barcode scanner is enabled
  const isQrCodeScannerEnabled = barcodeScannerSettings?.enable_barcode_scanner;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <LATSBreadcrumb />



      {/* POS Top Bar */}
      <POSTopBar
        cartItemsCount={cartItems.length}
        totalAmount={totalAmount}
        onProcessPayment={handleProcessPayment}
        onClearCart={clearCart}
        onScanQrCode={isQrCodeScannerEnabled ? startQrCodeScanner : () => {}}
        onAddCustomer={() => {
          setShowAddCustomerModal(true);
        }}
        onViewReceipts={() => {
          alert('Receipts view coming soon!');
        }}
        onViewSales={analyticsReportingSettings?.enable_analytics && canViewSales ? () => {
          setShowSalesAnalytics(true);
        } : () => {}}
        onOpenPaymentTracking={() => {
          setShowPaymentTracking(true);
        }}
        onOpenDrafts={() => setShowDraftModal(true)}
        isProcessingPayment={isProcessingPayment}
        hasSelectedCustomer={!!selectedCustomer}
        draftCount={getAllDrafts().length}
        // Bottom bar actions moved to top bar
        onViewAnalytics={() => setShowSalesAnalytics(true)}
        onPaymentTracking={() => setShowPaymentTracking(true)}
        onCustomers={() => setShowAddCustomerModal(true)}
        onReports={() => setShowSalesAnalytics(true)}
        onRefreshData={handleRefreshData}
      />

      {/* Temporary Migration Button - Remove after migration is applied */}
      {currentUser?.role === 'admin' && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={handleApplyMigration}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply DB Migration
          </button>
        </div>
      )}

      <div className="p-4 sm:p-6 pb-6 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Search Section */}
          <ProductSearchSection
            products={products as any}
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
            categories={categories?.map(cat => cat.name) || []}
            brands={[]}
            onAddToCart={addToCart}
            onAddExternalProduct={() => setShowAddExternalProductModal(true)}
            onSearch={handleUnifiedSearch}
            onScanQrCode={startQrCodeScanner}
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
            onShowCustomerSearch={() => setShowCustomerSelectionModal(true)}
            onShowCustomerDetails={handleShowCustomerDetails}
            onUpdateCartItemQuantity={updateCartItemQuantity}
            onRemoveCartItem={removeCartItem}
            onApplyDiscount={(_type, value) => {
              setManualDiscount(value);
              setShowDiscountModal(false);
            }}
            onProcessPayment={handleProcessPayment}
            onShowDiscountModal={() => setShowDiscountModal(true)}
            onClearDiscount={() => {
              setManualDiscount(0);
              setDiscountValue('');
              setDiscountType('percentage');
            }}
            dynamicPricingEnabled={dynamicPricingSettings?.enable_dynamic_pricing}
            totalAmount={totalAmount}
            discountAmount={discountAmount}
            finalAmount={finalAmount}
            onEditCustomer={(_customer) => setShowCustomerEditModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <AddExternalProductModal
        isOpen={showAddExternalProductModal}
        onClose={() => setShowAddExternalProductModal(false)}
        onProductAdded={(product) => {
          addToCart(product);
          setShowAddExternalProductModal(false);
        }}
      />

      <CustomerSelectionModal
        isOpen={showCustomerSelectionModal}
        onClose={() => setShowCustomerSelectionModal(false)}
        onCustomerSelect={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerSelectionModal(false);
          toast.success(`Customer "${customer.name}" selected!`);
        }}
        selectedCustomer={selectedCustomer}
      />

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerCreated={(customer) => {
          setSelectedCustomer(customer);
          setShowAddCustomerModal(false);
          toast.success(`New customer "${customer.name}" created and selected!`);
        }}
      />

      <CustomerEditModal
        isOpen={showCustomerEditModal}
        onClose={() => setShowCustomerEditModal(false)}
        customer={selectedCustomer}
        onCustomerUpdated={(updatedCustomer) => {
          setSelectedCustomer(updatedCustomer);
          setShowCustomerEditModal(false);
        }}
      />

      <DraftManagementModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onLoadDraft={loadDraft}
        currentDraftId={currentDraftId || undefined}
      />

      <SalesAnalyticsModal
        isOpen={showSalesAnalytics}
        onClose={() => setShowSalesAnalytics(false)}
      />

      <ZenoPayPaymentModal
        isOpen={showZenoPayPayment}
        onClose={() => setShowZenoPayPayment(false)}
        cartItems={cartItems}
        total={finalAmount}
        onPaymentComplete={async (payment) => {
          try {
            // Handle successful payment completion
            console.log('ZenoPay payment completed successfully:', payment);
            
            // Validate customer selection
            if (!selectedCustomer && !customerName) {
              toast.error('Please select a customer or enter customer name');
              return;
            }

            // Prepare sale data for database
            const saleData = {
              customerId: selectedCustomer?.id || null,
              customerName: selectedCustomer?.name || customerName || 'Walk-in Customer',
              customerPhone: selectedCustomer?.phone || null,
              customerEmail: selectedCustomer?.email || null,
              items: cartItems.map(item => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                productName: item.name,
                variantName: item.name, // Using name as variant name
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.totalPrice,
                costPrice: 0, // Will be calculated by service
                profit: 0 // Will be calculated by service
              })),
              subtotal: totalAmount,
              tax: 0, // No tax for now
              discount: manualDiscount,
              discountType: discountType,
              discountValue: parseFloat(discountValue) || 0,
              total: finalAmount,
              paymentMethod: {
                type: 'zenopay',
                details: {
                  transactionId: payment.id,
                  provider: 'ZenoPay'
                },
                amount: finalAmount
              },
              paymentStatus: 'completed' as const,
              soldBy: cashierName || 'POS User',
              soldAt: new Date().toISOString(),
              notes: `ZenoPay Transaction ID: ${payment.id || 'N/A'}`
            };

            // Process the sale using the service
            const result = await saleProcessingService.processSale(saleData);
            
            if (result.success) {
              // Clear cart after successful payment
              clearCart();
              
              // Clear customer selection
              setSelectedCustomer(null);
              
              // Show success message
              toast.success(`ZenoPay payment completed successfully! Sale #${result.sale?.saleNumber}`);
              
              // Close payment modal
              setShowZenoPayPayment(false);
            } else {
              throw new Error(result.error || 'Failed to process sale');
            }
            
          } catch (error) {
            console.error('Error handling ZenoPay payment completion:', error);
            toast.error(`Payment completed but failed to process sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
        customer={selectedCustomer}
      />

      <PaymentTrackingModal
        isOpen={showPaymentTracking}
        onClose={() => setShowPaymentTracking(false)}
      />

      {/* New Payments Popup Modal */}
      <PaymentsPopupModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={finalAmount}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.name || 'Walk-in Customer'}
        description={`POS Sale - ${cartItems.length} items`}
        onPaymentComplete={async (payments, totalPaid) => {
          try {
            // Validate payment data before processing
            if (!payments || payments.length === 0) {
              throw new Error('No payment data received');
            }

            console.log('Processing payments:', {
              paymentCount: payments.length,
              totalPaid: totalPaid,
              payments: payments.map((p: any) => ({
                method: p.paymentMethod,
                amount: p.amount,
                reference: p.reference
              }))
            });

            // Prepare sale data for database with multiple payments
            const saleData = {
              customerId: selectedCustomer?.id || null,
              customerName: selectedCustomer?.name || 'Walk-in Customer',
              customerPhone: selectedCustomer?.phone || null,
              customerEmail: selectedCustomer?.email || null,
              items: cartItems.map(item => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                productName: item.name,
                variantName: item.name, // Using name as variant name
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.totalPrice,
                costPrice: 0, // Will be calculated by service
                profit: 0 // Will be calculated by service
              })),
              subtotal: totalAmount,
              tax: 0, // No tax for now
              discount: manualDiscount,
              discountType: discountType,
              discountValue: parseFloat(discountValue) || 0,
              total: finalAmount,
              // Payment method structure expected by sale processing service
              paymentMethod: {
                type: payments.length === 1 ? payments[0].paymentMethod : 'multiple',
                details: {
                  payments: payments.map((payment: any) => ({
                    method: payment.paymentMethod,
                    amount: payment.amount,
                    accountId: payment.paymentAccountId,
                    reference: payment.reference,
                    notes: payment.notes,
                    timestamp: payment.timestamp
                  })),
                  totalPaid: totalPaid
                },
                amount: totalPaid || 0
              },
              paymentStatus: 'completed' as const,
              soldBy: 'POS User',
              soldAt: new Date().toISOString(),
              notes: payments.map((p: any) => p.notes).filter(Boolean).join('; ') || undefined
            };

            // Process the sale using the service
            const result = await saleProcessingService.processSale(saleData);
            
            if (result.success) {
              // Clear cart after successful payment
              clearCart();
              
              // Clear customer selection
              setSelectedCustomer(null);
              
              // Show success message
              const displayAmount = totalPaid || finalAmount;
              toast.success(`Payment of ${displayAmount.toLocaleString()} TZS processed successfully! Sale #${result.sale?.saleNumber}`);
              
              // Close payment modal
              setShowPaymentModal(false);
            } else {
              console.error('Sale processing failed:', result.error);
              throw new Error(result.error || 'Failed to process sale');
            }
            
          } catch (error) {
            console.error('Error processing payment:', error);
            
            // Only throw critical errors that actually prevent payment completion
            if (error instanceof Error) {
              // Check if it's a critical error that should stop the payment
              const criticalErrors = [
                'Customer information is required',
                'No payment data received',
                'Failed to process sale',
                'Database connection error',
                'Invalid payment method'
              ];
              
              const isCriticalError = criticalErrors.some(criticalError => 
                error.message.toLowerCase().includes(criticalError.toLowerCase())
              );
              
              if (isCriticalError) {
                throw error; // This will be caught by the modal and show error toast
              } else {
                // For non-critical errors, log them but don't fail the payment
                console.warn('Non-critical error during payment processing:', error.message);
                // Continue with successful payment flow
                const displayAmount = totalPaid || finalAmount;
                toast.success(`Payment of ${displayAmount.toLocaleString()} TZS processed successfully!`);
                setShowPaymentModal(false);
              }
            } else {
              throw error; // Unknown error type, throw it
            }
          }
        }}
        title="Process POS Payment"
      />

      {/* Additional Modals */}
      <POSSettingsModalWrapper
        ref={settingsModalRef}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
        onSaveSettings={async (_settings: any) => {
          setIsSavingSettings(true);
          try {
            // Validate settings
            if (!_settings || typeof _settings !== 'object') {
              throw new Error('Invalid settings data');
            }

            console.log('Saving POS settings...');
            await POSSettingsService.saveAllSettings(_settings);
            toast.success('Settings saved successfully');
          } catch (error) {
            console.error('Error saving settings:', error);
            
            // Provide specific error messages
            if (error instanceof Error) {
              if (error.message.includes('network') || error.message.includes('fetch')) {
                toast.error('Network error. Please check your connection and try again.');
              } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
              } else if (error.message.includes('validation')) {
                toast.error('Invalid settings data. Please check your input and try again.');
              } else {
                toast.error(`Failed to save settings: ${error.message}`);
              }
            } else {
              toast.error('Failed to save settings. Please try again.');
            }
          } finally {
            setIsSavingSettings(false);
          }
        }}
        isSaving={isSavingSettings}
      />

      <POSDiscountModalWrapper
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApplyDiscount={(_type: string, _value: string) => {
          setDiscountType(_type as "fixed" | "percentage");
          setDiscountValue(_value);
          const discountAmount = _type === 'percentage' 
            ? (totalAmount * parseFloat(_value)) / 100
            : parseFloat(_value);
          setManualDiscount(discountAmount);
          setShowDiscountModal(false);
        }}
        onClearDiscount={() => {
          setManualDiscount(0);
          setDiscountValue('');
          setDiscountType('percentage');
        }}
        currentTotal={totalAmount}
        hasExistingDiscount={discountAmount > 0}
      />

      <POSReceiptModalWrapper
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={currentReceipt}
        onPrint={(_mode: string) => {
          setReceiptPrintMode(_mode as "email" | "thermal" | "a4");
          // Handle printing logic
        }}
        onEmail={(_email: string) => {
          // Handle email logic
        }}
      />

      {/* QrCode Scanner Modal */}
      {showQrCodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">QrCode Scanner</h3>
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-blue-600 text-2xl mb-2">📱</div>
                <p className="text-blue-800 font-medium">External QrCode Scanner</p>
                <p className="text-blue-600 text-sm mt-1">Use your connected barcode scanner device to scan product barcodes</p>
              </div>
              <p className="text-gray-600 mb-4">Scanner is ready and waiting for input</p>
            </div>
            {scannerError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-red-600 text-sm">{scannerError}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={stopQrCodeScanner}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Stop Scanner
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomerForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
            <div className="space-y-3">
              <div>
                <label className="font-medium">Name:</label>
                <p className="text-gray-600">{selectedCustomerForDetails.name}</p>
              </div>
              {selectedCustomerForDetails.phone && (
                <div>
                  <label className="font-medium">Phone:</label>
                  <p className="text-gray-600">{selectedCustomerForDetails.phone}</p>
                </div>
              )}
              {selectedCustomerForDetails.email && (
                <div>
                  <label className="font-medium">Email:</label>
                  <p className="text-gray-600">{selectedCustomerForDetails.email}</p>
                </div>
              )}
              {selectedCustomerForDetails.address && (
                <div>
                  <label className="font-medium">Address:</label>
                  <p className="text-gray-600">{selectedCustomerForDetails.address}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowCustomerDetails(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Alerts Modal */}
      {showInventoryAlerts && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseInventoryAlerts}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Inventory Alerts</h3>
              <button
                onClick={() => handleCloseInventoryAlerts()}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert) => (
                  <div key={alert.productId} className="p-3 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-red-600">{alert.productName}</div>
                        <div className="text-sm text-gray-600">
                          Current Stock: {alert.currentStock} | Threshold: {alert.threshold}
                        </div>
                      </div>
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        Low Stock
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No inventory alerts</p>
              )}
            </div>
            <div className="flex gap-2 justify-between mt-4">
              <button
                onClick={() => handleCloseInventoryAlerts(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
              >
                Don't Show Today
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCloseInventoryAlerts()}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const success = await permanentlyDisableAlerts();
                    if (success) {
                      setAlertsDismissed(true);
                      setShowInventoryAlerts(false);
                      setAlertsDismissedToday(true);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Don't Show Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Alerts Notification (Non-blocking) */}
      {showAlertsAsNotification && (
        <div className="fixed top-4 right-4 z-50 bg-orange-100 border border-orange-300 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800">Low Stock Alert</h4>
              <p className="text-sm text-orange-700 mt-1">
                {inventoryAlerts.length} product{inventoryAlerts.length !== 1 ? 's' : ''} running low on stock
              </p>
              <button
                onClick={() => {
                  setShowAlertsAsNotification(false);
                  setShowInventoryAlerts(true);
                }}
                className="text-sm text-orange-600 hover:text-orange-800 underline mt-1"
              >
                View Details
              </button>
            </div>
            <button
              onClick={() => setShowAlertsAsNotification(false)}
              className="flex-shrink-0 text-orange-400 hover:text-orange-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Stock Adjustment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={selectedProductForAdjustment?.id || ''}
                  onChange={(e) => {
                    const product = dbProducts.find(p => p.id === e.target.value);
                    setSelectedProductForAdjustment(product || null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a product</option>
                  {dbProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current: {product.variants?.reduce((sum, variant) => sum + ((variant as any).quantity || 0), 0) || 0})
                    </option>
                  ))}
                </select>
              </div>
              {selectedProductForAdjustment && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Adjustment Amount</label>
                    <input
                      type="number"
                      placeholder="Enter adjustment amount"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      id="adjustmentAmount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <input
                      type="text"
                      placeholder="Enter reason for adjustment"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      id="adjustmentReason"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowStockAdjustment(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amountInput = document.getElementById('adjustmentAmount') as HTMLInputElement;
                  const reasonInput = document.getElementById('adjustmentReason') as HTMLInputElement;
                  if (selectedProductForAdjustment && amountInput && reasonInput) {
                    handleStockAdjustment(
                      selectedProductForAdjustment.id,
                      parseInt(amountInput.value) || 0,
                      reasonInput.value || 'Manual adjustment'
                    );
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Points Modal */}
      {showLoyaltyPoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Loyalty Points</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} (Current Points: {typeof customerLoyaltyPoints === 'object' ? customerLoyaltyPoints[customer.id] || 0 : customerLoyaltyPoints})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Points to Add</label>
                    <input
                      type="number"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                      placeholder="Enter points to add"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <input
                      type="text"
                      value={pointsReason}
                      onChange={(e) => setPointsReason(e.target.value)}
                      placeholder="Enter reason for points"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowLoyaltyPoints(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCustomer && parseInt(pointsToAdd) > 0) {
                    handleAddLoyaltyPoints(
                      selectedCustomer.id,
                      parseInt(pointsToAdd),
                      pointsReason || 'Manual points addition'
                    );
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt History Modal */}
      {showReceiptHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh]">
            <h3 className="text-lg font-semibold mb-4">Receipt History</h3>
            <div className="overflow-y-auto max-h-96">
              {receiptHistory.length > 0 ? (
                <div className="space-y-2">
                  {receiptHistory.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        // Show receipt details or print
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">Receipt #{receipt.id}</div>
                          <div className="text-sm text-gray-600">
                            Date: {new Date(receipt.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Customer: {receipt.customer}
                          </div>
                          <div className="text-sm text-gray-600">
                            Items: {receipt.items}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            ${(receipt.total as number).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No receipt history found</p>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowReceiptHistory(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Notification */}
      <DraftNotification
        draftCount={getAllDrafts().length}
        onViewDrafts={() => setShowDraftModal(true)}
        onDismiss={() => setShowDraftNotification(false)}
        isVisible={showDraftNotification && getAllDrafts().length > 0}
      />

      {/* Delivery Section */}
      {showDeliverySection && (
        <DeliverySection
          isOpen={showDeliverySection}
          onClose={() => setShowDeliverySection(false)}
          onDeliverySet={(_delivery) => {
            // Handle delivery setting
            setShowDeliverySection(false);
          }}
        />
      )}

    </div>
  );
};

export default POSPageOptimized;
