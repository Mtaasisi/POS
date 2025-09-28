import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import PageHeader from '../components/ui/PageHeader';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ErrorState from '../components/ui/ErrorState';
import { 
  Package, Search, Plus, Grid, List, Filter, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, DollarSign, TrendingUp, 
  BarChart3, Settings, RefreshCw, CheckCircle, XCircle, Users, Crown, 
  AlertTriangle, Calculator, ShoppingCart, MoreHorizontal, Tag, Building, Truck,
  FileText, ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import forms and components
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import EnhancedStockAdjustModal from '../components/inventory/EnhancedStockAdjustModal';
import CategoryFormModal from '../components/inventory/CategoryFormModal';
import ProductExcelImportModal from '../components/ProductExcelImportModal';

import SupplierForm from '../components/inventory/SupplierForm';

// AddProductModal removed - using AddProductPage instead
import EditProductModal from '../components/inventory/EditProductModal';
import VariantProductCard from '../components/inventory/VariantProductCard';
import { useProductModals } from '../hooks/useProductModals';

// Import tab components
import EnhancedInventoryTab from '../components/inventory/EnhancedInventoryTab';
import PurchaseOrdersTab from '../components/inventory/PurchaseOrdersTab';
import AnalyticsTab from '../components/inventory/AnalyticsTab';
import SettingsTab from '../components/inventory/SettingsTab';

// Import database functionality
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { latsEventBus } from '../lib/data/eventBus';
import { runDatabaseDiagnostics, logDiagnosticResult } from '../lib/databaseDiagnostics';
import { useCyclingLoadingMessage } from '../../../hooks/useCyclingLoadingMessage';
import { LiveInventoryService, LiveInventoryMetrics } from '../lib/liveInventoryService';
import { Category, Supplier, StockMovement, Product } from '../types/inventory';


// Loading Progress Indicator Component
const LoadingProgressIndicator: React.FC<{ progress: any }> = ({ progress }) => {
  const totalSteps = 6;
  const completedSteps = Object.values(progress).filter(Boolean).length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  
  // Cycling loading messages for inventory
  const { currentMessage } = useCyclingLoadingMessage({
    enabled: completedSteps < totalSteps,
    interval: 2000,
    messages: [
      { text: "Loading inventory data...", icon: "📦", color: "text-blue-600" },
      { text: "Fetching product categories...", icon: "📁", color: "text-green-600" },
      { text: "Syncing supplier information...", icon: "🏢", color: "text-purple-600" },
      { text: "Loading supplier data...", icon: "🏢", color: "text-orange-600" },
      { text: "Calculating stock levels...", icon: "📊", color: "text-teal-600" },
      { text: "Preparing analytics...", icon: "📈", color: "text-indigo-600" },
      { text: "Almost ready...", icon: "🎯", color: "text-pink-600" }
    ]
  });

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="flex-1">
          <div className={`text-sm font-medium ${currentMessage.color || 'text-gray-700'}`}>
            {currentMessage.icon} {currentMessage.text}
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{completedSteps}/{totalSteps} steps</div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {Object.entries(progress).map(([key, loaded]) => (
          <div key={key} className="flex items-center space-x-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={`${loaded ? 'text-green-600' : 'text-gray-500'}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tab types
type TabType = 'inventory' | 'purchase-orders' | 'analytics' | 'settings';

const UnifiedInventoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Product modals
  const productModals = useProductModals();
  
  // Error handling
  const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });
  
  // Database state management
  const { 
    products, 
    categories, 
 
    suppliers,
    stockMovements,
    sales,
    isLoading,
    error,
    loadProducts,
    loadCategories,

    loadSuppliers,
    loadStockMovements,
    loadSales,
    createProduct,
    createCategory,

    createSupplier,
    updateProduct,
    deleteProduct,
    adjustStock
  } = useInventoryStore();

  // Minimal debug logging for products state - moved after filteredProducts definition

  // Database connection status
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Prevent multiple simultaneous data loads
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lastDataLoadTime, setLastDataLoadTime] = useState(0);
  const DATA_LOAD_COOLDOWN = 3000; // Reduced from 5 seconds to 3 seconds
  
  // Loading state for better UX
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(true);
  
  // Progressive loading states
  const [loadingProgress, setLoadingProgress] = useState({
    categories: false,
    suppliers: false,
    products: false,
    stockMovements: false,
    sales: false
  });
  
  // Cache management
  const [dataCache, setDataCache] = useState({
    categories: null as Category[] | null,

    suppliers: null as Supplier[] | null,
    products: null as Product[] | null,
    stockMovements: null as StockMovement[] | null,
    sales: null as any[] | null
  });

  // Live inventory metrics state
  const [liveMetrics, setLiveMetrics] = useState<LiveInventoryMetrics | null>(null);
  const [isLoadingLiveMetrics, setIsLoadingLiveMetrics] = useState(false);
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  
  // Excel import modal state
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('created');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Form state variables
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.more-actions-dropdown')) {
        setShowMoreActions(false);
      }
    };

    if (showMoreActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreActions]);

  // Optimized data loading with parallel execution and caching
  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (isDataLoading) {
        return;
      }

      // Check cooldown period and use cache if available
      const timeSinceLastLoad = Date.now() - lastDataLoadTime;
      if (timeSinceLastLoad < DATA_LOAD_COOLDOWN && dataCache.products && dataCache.categories) {
        setShowLoadingSkeleton(false);
        return;
      }

      await withErrorHandling(async () => {
        setIsDataLoading(true);
        setDbStatus('connecting');
        setShowLoadingSkeleton(true);
        
        try {
          // Run diagnostics only once per session or on first load
          if (lastDataLoadTime === 0) {
            runDatabaseDiagnostics().then(diagnosticResult => {
              if (diagnosticResult.errors.length > 0) {
                console.warn('⚠️ Database issues detected:', diagnosticResult.errors);
              }
            });
          }

          const loadingStartTime = Date.now();
          
          // Reset loading progress
          setLoadingProgress({
            categories: false,
            suppliers: false,
            products: false,
            stockMovements: false,
            sales: false
          });

          // Load essential data in parallel (categories, suppliers)
          const essentialDataPromises = [
            loadCategories().then(() => {
              setLoadingProgress(prev => ({ ...prev, categories: true }));
            }),
            loadSuppliers().then(() => {
              setLoadingProgress(prev => ({ ...prev, suppliers: true }));
            })
          ];

          await Promise.all(essentialDataPromises);

          // Load products (most important for UI)
          await loadProducts({ page: 1, limit: 50 });
          setLoadingProgress(prev => ({ ...prev, products: true }));

          // Load secondary data in parallel (stock movements and sales)
          const secondaryDataPromises = [
            loadStockMovements().then(() => {
              setLoadingProgress(prev => ({ ...prev, stockMovements: true }));
            }),
            loadSales().then(() => {
              setLoadingProgress(prev => ({ ...prev, sales: true }));
            })
          ];

          await Promise.all(secondaryDataPromises);

          // Cache the loaded data
          setDataCache({
            categories: categories,
      
            suppliers: suppliers,
            products: products,
            stockMovements: stockMovements,
            sales: sales
          });

          const loadingTime = Date.now() - loadingStartTime;
          console.log(`✅ Data loaded successfully in ${loadingTime}ms`);
          
          setDbStatus('connected');
          setLastDataLoadTime(Date.now());
          setShowLoadingSkeleton(false);
          
        } catch (error) {
          console.error('❌ Error loading data:', error);
          toast.error('Failed to load data from database');
          setDbStatus('error');
          setShowLoadingSkeleton(false);
        } finally {
          setIsDataLoading(false);
        }
      }, 'Loading unified inventory data');
    };
    
    loadData();
  }, [withErrorHandling, loadProducts, loadCategories, loadSuppliers, loadStockMovements, loadSales, isDataLoading, lastDataLoadTime]);

  // Load live inventory metrics
  const loadLiveMetrics = useCallback(async () => {
    if (isLoadingLiveMetrics) return;
    
    setIsLoadingLiveMetrics(true);
    try {
      console.log('🔄 [UnifiedInventoryPage] Loading live inventory metrics...');
      const liveData = await LiveInventoryService.getLiveInventoryMetrics();
      setLiveMetrics(liveData);
      console.log('✅ [UnifiedInventoryPage] Live metrics loaded:', liveData);
    } catch (error) {
      console.error('❌ [UnifiedInventoryPage] Error loading live metrics:', error);
      // Don't show error toast for live metrics as it's not critical
    } finally {
      setIsLoadingLiveMetrics(false);
    }
  }, []); // Remove isLoadingLiveMetrics dependency to prevent infinite loop

  // Load live metrics when products change or on initial load with debouncing
  useEffect(() => {
    if (products.length > 0 && !isLoadingLiveMetrics) {
      // Add debouncing to prevent excessive API calls
      const timeoutId = setTimeout(() => {
        loadLiveMetrics();
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [products.length, loadLiveMetrics, isLoadingLiveMetrics]);

  // Listen for stock updates and refresh live metrics
  useEffect(() => {
    const handleStockUpdate = (event: any) => {
      console.log('🔄 [UnifiedInventoryPage] Stock update detected, refreshing live metrics...', event);
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadLiveMetrics();
      }, 500);
    };

    const handleProductUpdate = (event: any) => {
      console.log('🔄 [UnifiedInventoryPage] Product update detected, refreshing live metrics...', event);
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadLiveMetrics();
      }, 500);
    };

    const handleSaleCompleted = (event: any) => {
      console.log('🔄 [UnifiedInventoryPage] Sale completed, refreshing live metrics...', event);
      // Small delay to ensure database is updated
      setTimeout(() => {
        loadLiveMetrics();
      }, 500);
    };

    // Subscribe to relevant events
    const unsubscribeStock = latsEventBus.subscribe('lats:stock.updated', handleStockUpdate);
    const unsubscribeProduct = latsEventBus.subscribe('lats:product.updated', handleProductUpdate);
    const unsubscribeSale = latsEventBus.subscribe('lats:sale.completed', handleSaleCompleted);

    // Cleanup subscriptions
    return () => {
      unsubscribeStock();
      unsubscribeProduct();
      unsubscribeSale();
    };
  }, [loadLiveMetrics]);

  // Calculate metrics (use live data when available, fallback to cached data)
  const metrics = useMemo(() => {
    // Use live metrics if available, otherwise calculate from cached products
    if (liveMetrics) {
      console.log('📊 [UnifiedInventoryPage] Using live metrics for calculation');
      return {
        totalItems: liveMetrics.totalProducts,
        lowStockItems: liveMetrics.lowStockItems,
        outOfStockItems: liveMetrics.outOfStockItems,
        reorderAlerts: liveMetrics.reorderAlerts,
        totalValue: liveMetrics.totalValue,
        retailValue: liveMetrics.retailValue || 0, // Add retail value from live metrics
        activeProducts: liveMetrics.activeProducts,
        featuredProducts: products.filter(p => p.isFeatured).length, // Still use cached for featured
        lastUpdated: liveMetrics.lastUpdated
      };
    }

    // Fallback to cached data calculation
    console.log('📊 [UnifiedInventoryPage] Using cached data for calculation');
    const totalItems = products.length;
    const lowStockItems = products.filter(product => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return totalStock > 0 && totalStock <= 10;
    }).length;
    const outOfStockItems = products.filter(product => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return totalStock <= 0;
    }).length;
    const reorderAlerts = products.filter(product => {
      const mainVariant = product.variants?.[0];
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return mainVariant?.minQuantity && totalStock <= mainVariant.minQuantity;
    }).length;
    const totalValue = products.reduce((sum, product) => {
      // Calculate value using ALL variants (consistent with LiveInventoryService)
      const productValue = product.variants?.reduce((variantSum, variant) => {
        const costPrice = variant.costPrice || 0;
        const quantity = variant.quantity || 0;
        return variantSum + (costPrice * quantity);
      }, 0) || 0;
      return sum + productValue;
    }, 0);
    
    const retailValue = products.reduce((sum, product) => {
      // Calculate retail value using ALL variants
      const productRetailValue = product.variants?.reduce((variantSum, variant) => {
        const sellingPrice = variant.sellingPrice || variant.price || 0;
        const quantity = variant.quantity || 0;
        return variantSum + (sellingPrice * quantity);
      }, 0) || 0;
      return sum + productRetailValue;
    }, 0);
    const activeProducts = products.filter(p => p.isActive).length;
    const featuredProducts = products.filter(p => p.isFeatured).length;

    // Debug logging for SKU, price, and stock data
    if (import.meta.env.MODE === 'development' && products.length > 0) {
      console.log('🔍 Debug: Product data check for SKU, price, stock:');
      products.slice(0, 3).forEach((product, index) => {
        const mainVariant = product.variants?.[0];
        console.log(`Product ${index + 1}:`, {
          name: product.name,
          sku: mainVariant?.sku || 'N/A',
          price: mainVariant?.sellingPrice || 0,
          stock: mainVariant?.quantity || 0,
          variantsCount: product.variants?.length || 0,
          totalStock: product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0
        });
      });
    }

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      reorderAlerts,
      totalValue,
      retailValue,
      activeProducts,
      featuredProducts,
      lastUpdated: new Date().toISOString()
    };
  }, [products, liveMetrics]);

  // Filter products based on active tab and filters
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter with enhanced variant search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.name.toLowerCase().includes(query) ||
        // Enhanced variant search - search through variant names, SKUs, and barcodes
        product.variants?.some(variant => 
          variant.name?.toLowerCase().includes(query) ||
          variant.sku?.toLowerCase().includes(query) ||
          variant.barcode?.toLowerCase().includes(query)
        )
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        categories.find(c => c.id === product.categoryId)?.name === selectedCategory
      );
    }



    // Apply status filter based on active tab
    if (activeTab === 'inventory') {
      if (selectedStatus === 'in-stock') {
        filtered = filtered.filter(product => {
          const stock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return stock > 10;
        });
      } else if (selectedStatus === 'low-stock') {
        filtered = filtered.filter(product => {
          const stock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return stock > 0 && stock <= 10;
        });
      } else if (selectedStatus === 'out-of-stock') {
        filtered = filtered.filter(product => {
          const stock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return stock <= 0;
        });
      }
    } else {
      // Inventory tab status filter
      if (selectedStatus !== 'all') {
        filtered = filtered.filter(product => product.isActive === (selectedStatus === 'active'));
      }
    }

    // Apply low stock only filter (inventory tab)
    if (activeTab === 'inventory' && showLowStockOnly) {
      filtered = filtered.filter(product => {
        const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
        return totalStock > 0 && totalStock <= 10;
      });
    }

    // Apply featured filter (inventory tab)
    if (activeTab === 'inventory' && showFeaturedOnly) {
      filtered = filtered.filter(product => product.isFeatured);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (a.variants?.[0]?.sellingPrice || 0) - (b.variants?.[0]?.sellingPrice || 0);
        case 'stock':
          const aStock = a.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          const bStock = b.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return bStock - aStock;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedStatus, showLowStockOnly, showFeaturedOnly, sortBy, activeTab, categories]);

  // Minimal debug logging for products state
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔍 [UnifiedInventoryPage] Products state changed:', {
        productsCount: products?.length || 0,
        isLoading,
        filteredProductsCount: filteredProducts?.length || 0,
        searchQuery,
        selectedCategory,
        selectedStatus
      });
    }
  }, [products, isLoading, filteredProducts, searchQuery, selectedCategory, selectedStatus]);

  // Format money
  const formatMoney = (amount: number) => {
    return format.money(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (productId: string, variantId: string, quantity: number, reason: string) => {
    try {
      await adjustStock(productId, variantId, quantity, reason);
      toast.success('Stock adjusted successfully');
      
      // Refresh live metrics after stock adjustment
      setTimeout(() => {
        loadLiveMetrics();
      }, 1000); // Small delay to ensure database is updated
    } catch (error) {
      toast.error('Failed to adjust stock');
      console.error('Stock adjustment error:', error);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first');
      return;
    }
    
    switch (action) {
      case 'export':
        try {
          const csvContent = "data:text/csv;charset=utf-8," + 
            "Name,SKU,Category,Price,Stock,Status\n" +
            selectedProducts.map(productId => {
              const product = products.find(p => p.id === productId);
              if (!product) return '';
              const category = categories.find(c => c.id === product.categoryId);
              const mainVariant = product.variants?.[0];
              return `${product.name},${mainVariant?.sku || 'N/A'},${category?.name || 'Uncategorized'},${mainVariant?.sellingPrice || 0},${product.totalQuantity || 0},${product.isActive ? 'Active' : 'Inactive'}`;
            }).filter(row => row !== '').join("\n");
          
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `products-export-${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Exported ${selectedProducts.length} products successfully!`);
        } catch (error) {
          console.error('Export error:', error);
          toast.error('Failed to export products');
        }
        break;
        
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
          try {
            const deletePromises = selectedProducts.map(productId => deleteProduct(productId));
            await Promise.all(deletePromises);
            toast.success(`Successfully deleted ${selectedProducts.length} products`);
            setSelectedProducts([]);
          } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete some products');
          }
        }
        break;
        
      case 'feature':
        try {
          const updatePromises = selectedProducts.map(async (productId) => {
            const product = products.find(p => p.id === productId);
            if (product) {
              const isFeatured = product.isFeatured;
                      // Note: tags field removed from database schema
        await updateProduct(productId, { isActive: true });
            }
          });
          
          await Promise.all(updatePromises);
          toast.success(`Successfully updated ${selectedProducts.length} products`);
          setSelectedProducts([]);
        } catch (error) {
          console.error('Feature error:', error);
          toast.error('Failed to feature products');
        }
        break;
        
      default:
        toast.error('Unknown action');
    }
  };

  // Handle import functionality - opens Excel import modal
  const handleImport = () => {
    setShowExcelImportModal(true);
  };

  // Handle Excel import completion
  const handleExcelImportComplete = async (importedProducts: Product[]) => {
    setShowExcelImportModal(false);
    toast.success(`Successfully imported ${importedProducts.length} products!`);
    
    // Refresh the data
    await Promise.all([
      loadProducts({ page: 1, limit: 50 }),
      loadCategories(),
      loadSuppliers()
    ]);
  };

  // Handle export functionality
  const handleExport = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,SKU,Category,Price,Stock,Status,Description\n" +
        products.map(product => {
          const category = categories.find(c => c.id === product.categoryId);
          const mainVariant = product.variants?.[0];
          return `"${product.name}","${mainVariant?.sku || 'N/A'}","${category?.name || 'Uncategorized'}","${mainVariant?.sellingPrice || 0}","${product.totalQuantity || 0}","${product.isActive ? 'Active' : 'Inactive'}","${product.description || ''}"`;
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `product-inventory-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Product inventory exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export product inventory');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Show error state if there's an error
  if (errorState.hasError) {
    return (
      <ErrorState
        error={errorState.error}
        onRetry={errorState.retry}
        onClearError={clearError}
      />
    );
  }

  return (
    <PageErrorBoundary pageName="Unified Inventory Management" showDetails={true}>
      {/* Loading Progress Indicator */}
      {isDataLoading && <LoadingProgressIndicator progress={loadingProgress} />}
      
      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unified Inventory Management</h1>
              <p className="text-gray-600 mt-1">Manage products and inventory in one place</p>
              {/* Database Status Indicator */}
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${
                  dbStatus === 'connected' ? 'bg-green-500' : 
                  dbStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  dbStatus === 'connected' ? 'text-green-600' : 
                  dbStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {dbStatus === 'connected' ? 'Database Connected' : 
                   dbStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
                </span>
                {isDataLoading && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                    <span className="text-xs text-blue-600">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <GlassButton
              onClick={() => navigate('/lats/inventory-management')}
              icon={<Settings size={18} />}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white"
            >
              Inventory Management
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/add-product')}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              Add Product
            </GlassButton>
            <GlassButton
              onClick={loadLiveMetrics}
              icon={<RefreshCw size={18} className={isLoadingLiveMetrics ? 'animate-spin' : ''} />}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              disabled={isLoadingLiveMetrics}
            >
              {isLoadingLiveMetrics ? 'Refreshing...' : 'Refresh Data'}
            </GlassButton>
            {dbStatus === 'error' && (
              <GlassButton
                onClick={() => {
                  setDbStatus('connecting');
                  loadProducts({ page: 1, limit: 50 });
                  loadCategories();
                  loadSuppliers();
                }}
                icon={<RefreshCw size={18} />}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white"
              >
                Retry Connection
              </GlassButton>
            )}

            {/* More Actions Dropdown */}
            <div className="relative more-actions-dropdown">
              <GlassButton
                onClick={() => setShowMoreActions(!showMoreActions)}
                icon={<MoreHorizontal size={18} />}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                More Actions
              </GlassButton>
              
              {showMoreActions && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Settings size={16} className="text-slate-600" />
                      Quick Actions
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Manage your inventory efficiently</p>
                  </div>
                  
                  {/* Actions Grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {/* Add Category */}
                      <button
                        onClick={() => {
                          try {
                            setShowCategoryForm(true);
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error opening category form:', error);
                            toast.error('Failed to open category form');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/30 hover:border-blue-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <Tag size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-blue-900 text-sm">Add Category</div>
                          <div className="text-xs text-blue-600">Organize products</div>
                        </div>
                        <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <Plus size={12} className="text-blue-600" />
                        </div>
                      </button>
                      

                      
                      {/* Add Supplier */}
                      <button
                        onClick={() => {
                          try {
                            setShowSupplierForm(true);
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error opening supplier form:', error);
                            toast.error('Failed to open supplier form');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/30 hover:border-purple-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Truck size={18} className="text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-purple-900 text-sm">Add Supplier</div>
                          <div className="text-xs text-purple-600">Manage suppliers</div>
                        </div>
                        <div className="w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Plus size={12} className="text-purple-600" />
                        </div>
                      </button>
                      
                      {/* Bulk Stock Adjust */}
                      <button
                        onClick={() => {
                          try {
                            setShowStockAdjustment(true);
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error opening stock adjustment:', error);
                            toast.error('Failed to open stock adjustment');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 border border-orange-200/30 hover:border-orange-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Package size={18} className="text-orange-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-orange-900 text-sm">Bulk Stock Adjust</div>
                          <div className="text-xs text-orange-600">Update quantities</div>
                        </div>
                        <div className="w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <RefreshCw size={12} className="text-orange-600" />
                        </div>
                      </button>
                      
                      {/* Bulk Actions */}
                      <button
                        onClick={() => {
                          try {
                            setShowBulkActions(true);
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error opening bulk actions:', error);
                            toast.error('Failed to open bulk actions');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/50 border border-indigo-200/30 hover:border-indigo-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                          <Settings size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-indigo-900 text-sm">Bulk Actions</div>
                          <div className="text-xs text-indigo-600">Mass operations</div>
                        </div>
                        <div className="w-6 h-6 bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                          <MoreHorizontal size={12} className="text-indigo-600" />
                        </div>
                      </button>
                      
                      {/* Delete Selected */}
                      <button
                        onClick={() => {
                          try {
                            setShowDeleteConfirmation(true);
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error opening delete confirmation:', error);
                            toast.error('Failed to open delete confirmation');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200/50 border border-red-200/30 hover:border-red-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <Trash2 size={18} className="text-red-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-red-900 text-sm">Delete Selected</div>
                          <div className="text-xs text-red-600">Remove products</div>
                        </div>
                        <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <AlertTriangle size={12} className="text-red-600" />
                        </div>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Download Template */}
                      <button
                        onClick={() => {
                          try {
                            navigate('/excel-templates');
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error navigating to templates:', error);
                            toast.error('Failed to open templates page');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/50 border border-indigo-200/30 hover:border-indigo-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                          <Download size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-indigo-900 text-sm">Download Template</div>
                          <div className="text-xs text-indigo-600">Excel templates</div>
                        </div>
                        <div className="w-6 h-6 bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                          <FileText size={12} className="text-indigo-600" />
                        </div>
                      </button>

                      {/* Import */}
                      <button
                        onClick={() => {
                          try {
                            handleImport();
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error starting import:', error);
                            toast.error('Failed to start import process');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 border border-green-200/30 hover:border-green-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <Upload size={18} className="text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-green-900 text-sm">Import Products</div>
                          <div className="text-xs text-green-600">Bulk import data</div>
                        </div>
                        <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <ArrowUp size={12} className="text-green-600" />
                        </div>
                      </button>

                      {/* Export */}
                      <button
                        onClick={() => {
                          try {
                            handleExport();
                            setShowMoreActions(false);
                          } catch (error) {
                            console.error('Error starting export:', error);
                            toast.error('Failed to start export process');
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 border border-orange-200/30 hover:border-orange-300/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Download size={18} className="text-orange-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-orange-900 text-sm">Export Products</div>
                          <div className="text-xs text-orange-600">Download data</div>
                        </div>
                        <div className="w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <ArrowDown size={12} className="text-orange-600" />
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="bg-gray-50/50 px-4 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Click outside to close
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Loading Skeleton */}
        {showLoadingSkeleton && (
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1">
          <div className="flex space-x-1">
            {[
              { id: 'inventory', label: 'Inventory Management', icon: Package, color: 'blue' },
              { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, color: 'purple' },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'green' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-${tab.color}-500 text-white shadow-lg`
                      : `text-gray-600 hover:text-${tab.color}-600 hover:bg-${tab.color}-50`
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'inventory' && (
          <EnhancedInventoryTab 
            products={filteredProducts}
            metrics={metrics}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            showLowStockOnly={showLowStockOnly}
            setShowLowStockOnly={setShowLowStockOnly}
            showFeaturedOnly={showFeaturedOnly}
            setShowFeaturedOnly={setShowFeaturedOnly}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            categories={categories}
            brands={[]}
            formatMoney={formatMoney}
            getStatusColor={getStatusColor}
            handleStockAdjustment={handleStockAdjustment}
            handleBulkAction={handleBulkAction}
            setShowStockAdjustModal={setShowStockAdjustModal}
            setSelectedProductForHistory={setSelectedProductForHistory}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
            toggleProductSelection={toggleProductSelection}
            toggleSelectAll={toggleSelectAll}
            navigate={navigate}
            productModals={productModals}
            deleteProduct={deleteProduct}
          />
        )}

        {activeTab === 'purchase-orders' && (
          <PurchaseOrdersTab 
            navigate={navigate}
            useInventoryStore={useInventoryStore}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            products={products}
            metrics={metrics}
            categories={categories}
            formatMoney={formatMoney}
            liveMetrics={liveMetrics}
            isLoadingLiveMetrics={isLoadingLiveMetrics}
            onRefreshLiveMetrics={loadLiveMetrics}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            setShowCategoryForm={setShowCategoryForm}
            setShowSupplierForm={setShowSupplierForm}
          />
        )}

        {/* Product Modals */}
        {/* AddProductModal removed - use AddProductPage instead */}

        <EditProductModal
          isOpen={productModals.showEditModal}
          onClose={productModals.closeEditModal}
          productId={productModals.editingProductId || ''}
          onProductUpdated={(product) => {
            toast.success('Product updated successfully!');
            loadProducts({ page: 1, limit: 50 });
          }}
        />

        {/* Enhanced Stock Adjustment Modal */}
        {showStockAdjustModal && selectedProductForHistory && (
          <EnhancedStockAdjustModal
            product={products.find(p => p.id === selectedProductForHistory)}
            isOpen={showStockAdjustModal}
            onClose={() => {
              setShowStockAdjustModal(false);
              setSelectedProductForHistory(null);
            }}
            onSubmit={async (data) => {
              const { variant, ...adjustmentData } = data;
              let quantity = adjustmentData.quantity;
              
              // Calculate the actual quantity change based on adjustment type
              if (adjustmentData.adjustmentType === 'out') {
                quantity = -quantity; // Negative for stock out
              } else if (adjustmentData.adjustmentType === 'set') {
                quantity = quantity - variant.quantity; // Difference for set
              }
              
              await handleStockAdjustment(selectedProductForHistory, variant.id, quantity, adjustmentData.reason);
            }}
            loading={isLoading}
          />
        )}

        {/* Form Modals */}
        <CategoryFormModal
          isOpen={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          onSubmit={async (categoryData) => {
            try {
              await createCategory(categoryData);
              toast.success('Category created successfully');
              setShowCategoryForm(false);
            } catch (error) {
              toast.error('Failed to create category');
              console.error('Category creation error:', error);
            }
          }}
          parentCategories={categories}
          loading={isLoading}
        />



        {showSupplierForm && (
          <SupplierForm
            isOpen={showSupplierForm}
            onClose={() => setShowSupplierForm(false)}
            onSubmit={async (supplierData) => {
              try {
                await createSupplier(supplierData);
                toast.success('Supplier created successfully');
                setShowSupplierForm(false);
              } catch (error) {
                toast.error('Failed to create supplier');
                console.error('Supplier creation error:', error);
              }
            }}
          />
        )}



        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowBulkActions(false)}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
                  <p className="text-sm text-gray-600">Select products to perform bulk operations</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    handleBulkAction('export');
                    setShowBulkActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900">Export Selected Products</span>
                </button>
                
                <button
                  onClick={() => {
                    handleBulkAction('feature');
                    setShowBulkActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
                >
                  <Star className="w-5 h-5 text-green-600" />
                  <span className="text-green-900">Feature Selected Products</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(true);
                    setShowBulkActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="text-red-900">Delete Selected Products</span>
                </button>
              </div>
              
              <div className="flex gap-3 justify-end">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowBulkActions(false)}
                  className="text-sm"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirmation(false)}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Products</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedProducts.length}</span> product{selectedProducts.length !== 1 ? 's' : ''}? 
                This action will permanently remove them from your inventory.
              </p>
              
              <div className="flex gap-3 justify-end">
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="text-sm"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    handleBulkAction('delete');
                    setShowDeleteConfirmation(false);
                  }}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel Import Modal */}
      <ProductExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        onImportComplete={handleExcelImportComplete}
      />
    </PageErrorBoundary>
  );
};

export default UnifiedInventoryPage;
