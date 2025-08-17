import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
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
  AlertTriangle, Calculator, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import forms and components
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import BrandForm from '../components/inventory/BrandForm';
import CategoryFormModal from '../components/inventory/CategoryFormModal';
import SupplierForm from '../components/inventory/SupplierForm';
import AddProductModal from '../components/inventory/AddProductModal';
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
    brands, 
    suppliers,
    stockMovements,
    sales,
    isLoading,
    error,
    loadProducts,
    loadCategories,
    loadBrands,
    loadSuppliers,
    loadStockMovements,
    loadSales,
    createProduct,
    createCategory,
    createBrand,
    createSupplier,
    updateProduct,
    deleteProduct,
    adjustStock
  } = useInventoryStore();

  // Database connection status
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Prevent multiple simultaneous data loads
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lastDataLoadTime, setLastDataLoadTime] = useState(0);
  const DATA_LOAD_COOLDOWN = 5000; // 5 seconds cooldown between loads
  
  // Loading state for better UX
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(true);
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Form state variables
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string | null>(null);

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (isDataLoading) {
        console.log('⏳ LATS Unified Inventory: Data loading already in progress, skipping...');
        return;
      }

      // Check if we recently loaded data
      const timeSinceLastLoad = Date.now() - lastDataLoadTime;
      if (timeSinceLastLoad < DATA_LOAD_COOLDOWN) {
        console.log(`⏳ LATS Unified Inventory: Data loaded recently (${Math.round(timeSinceLastLoad / 1000)}s ago), skipping...`);
        return;
      }

      await withErrorHandling(async () => {
        console.log('🔧 LATS Unified Inventory: Loading data...');
        setIsDataLoading(true);
        setDbStatus('connecting');
        setShowLoadingSkeleton(true);
        
        try {
          // Run database diagnostics first
          console.log('🔍 Running database diagnostics...');
          const diagnosticResult = await runDatabaseDiagnostics();
          logDiagnosticResult(diagnosticResult);
          
          if (diagnosticResult.errors.length > 0) {
            console.warn('⚠️ Database issues detected:', diagnosticResult.errors);
            if (diagnosticResult.recommendations.length > 0) {
              console.log('💡 Recommendations:', diagnosticResult.recommendations);
            }
          }
          
          // Show loading skeleton for at least 500ms for better UX
          const loadingStartTime = Date.now();
          
          // Load data sequentially to avoid conflicts
          console.log('📊 Loading categories...');
          await loadCategories();
          
          console.log('📊 Loading brands...');
          await loadBrands();
          
          console.log('📊 Loading suppliers...');
          await loadSuppliers();
          
          console.log('📊 Loading products...');
          await loadProducts();
          
          console.log('📊 Loading stock movements...');
          await loadStockMovements();
          
          console.log('📊 Loading sales...');
          await loadSales();
          
          // Ensure minimum loading time for better UX
          const loadingTime = Date.now() - loadingStartTime;
          if (loadingTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - loadingTime));
          }
          
          console.log('📊 LATS Unified Inventory: Data loaded successfully');
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
  }, [withErrorHandling, loadProducts, loadCategories, loadBrands, loadSuppliers, loadStockMovements, loadSales, isDataLoading, lastDataLoadTime]);

  // Calculate metrics
  const metrics = useMemo(() => {
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
      const mainVariant = product.variants?.[0];
      const totalStock = product.variants?.reduce((stockSum, variant) => stockSum + (variant.quantity || 0), 0) || 0;
      return sum + ((mainVariant?.costPrice || 0) * totalStock);
    }, 0);
    const activeProducts = products.filter(p => p.isActive).length;
    const featuredProducts = products.filter(p => p.isFeatured).length;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      reorderAlerts,
      totalValue,
      activeProducts,
      featuredProducts
    };
  }, [products]);

  // Filter products based on active tab and filters
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.variants?.some(variant => 
          variant.sku?.toLowerCase().includes(query)
        ) ||
        product.brand?.name.toLowerCase().includes(query) ||
        product.category?.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        categories.find(c => c.id === product.categoryId)?.name === selectedCategory
      );
    }

    // Apply brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => 
        product.brand?.name === selectedBrand
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
      // Catalog tab status filter
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

    // Apply featured filter (catalog tab)
    if (activeTab === 'catalog' && showFeaturedOnly) {
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
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedStatus, showLowStockOnly, showFeaturedOnly, sortBy, activeTab, categories, brands]);

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
            "Name,SKU,Category,Brand,Price,Stock,Status\n" +
            selectedProducts.map(productId => {
              const product = products.find(p => p.id === productId);
              if (!product) return '';
              const category = categories.find(c => c.id === product.categoryId);
              const brand = product.brand;
              const mainVariant = product.variants?.[0];
              return `${product.name},${mainVariant?.sku || 'N/A'},${category?.name || 'Uncategorized'},${brand?.name || 'No Brand'},${mainVariant?.sellingPrice || 0},${product.totalQuantity || 0},${product.isActive ? 'Active' : 'Inactive'}`;
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
              const newTags = isFeatured 
                ? product.tags.filter((tag: string) => tag !== 'featured')
                : [...product.tags, 'featured'];
              
              await updateProduct(productId, { tags: newTags });
            }
          });
          
          await Promise.all(updatePromises);
          toast.success(`Successfully ${selectedProducts.some(id => products.find(p => p.id === id)?.tags.includes('featured')) ? 'unfeatured' : 'featured'} ${selectedProducts.length} products`);
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

  // Handle import functionality
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        toast.loading('Importing products...');
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = lines.slice(1).filter(line => line.trim());
            
            let importedCount = 0;
            let errorCount = 0;
            
            for (const line of data) {
              try {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const productData: any = {};
                
                headers.forEach((header, index) => {
                  productData[header.toLowerCase()] = values[index] || '';
                });
                
                const product = {
                  name: productData.name || productData.product_name,
                  description: productData.description || productData.desc,
                  categoryId: '',
                  brandId: '',
                  supplierId: '',
                  images: [],
                  tags: productData.tags ? productData.tags.split(',').map((t: string) => t.trim()) : [],
                  variants: [{
                    sku: productData.sku || productData.product_code,
                    name: productData.name || productData.product_name,
                    attributes: {},
                    costPrice: parseFloat(productData.cost || productData.cost_price || '0'),
                    sellingPrice: parseFloat(productData.price || productData.selling_price || '0'),
                    quantity: parseInt(productData.stock || productData.quantity || '0'),
                    minQuantity: parseInt(productData.min_stock || '0'),
                    maxQuantity: parseInt(productData.max_stock || '100'),
                    barcode: productData.barcode || productData.upc || ''
                  }]
                };
                
                const result = await createProduct(product);
                if (result.ok) {
                  importedCount++;
                } else {
                  errorCount++;
                }
              } catch (error) {
                errorCount++;
                console.error('Error importing product:', error);
              }
            }
            
            toast.dismiss();
            if (errorCount === 0) {
              toast.success(`Successfully imported ${importedCount} products!`);
            } else {
              toast.success(`Imported ${importedCount} products with ${errorCount} errors`);
            }
            
            await Promise.all([
              loadProducts(),
              loadCategories(),
              loadBrands(),
              loadSuppliers()
            ]);
            
          } catch (error) {
            toast.dismiss();
            toast.error('Failed to parse import file');
            console.error('Import parsing error:', error);
          }
        };
        
        reader.readAsText(file);
        
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to import products');
        console.error('Import error:', error);
      }
    };
    input.click();
  };

  // Handle export functionality
  const handleExport = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,SKU,Category,Brand,Price,Stock,Status,Description,Tags\n" +
        products.map(product => {
          const category = categories.find(c => c.id === product.categoryId);
                        const brand = product.brand;
          const mainVariant = product.variants?.[0];
          return `"${product.name}","${mainVariant?.sku || 'N/A'}","${category?.name || 'Uncategorized'}","${brand?.name || 'No Brand'}","${mainVariant?.sellingPrice || 0}","${product.totalQuantity || 0}","${product.isActive ? 'Active' : 'Inactive'}","${product.description || ''}","${product.tags.join(', ')}"`;
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `product-catalog-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Product catalog exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export product catalog');
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unified Inventory Management</h1>
              <p className="text-gray-600 mt-1">Manage products, inventory, and catalog in one place</p>
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
              onClick={productModals.openAddModal}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              Add Product
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/excel-templates')}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              Download Template
            </GlassButton>
            <GlassButton
              onClick={handleImport}
              icon={<Upload size={18} />}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              Import
            </GlassButton>
            <GlassButton
              onClick={handleExport}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
            >
              Export
            </GlassButton>
            {dbStatus === 'error' && (
              <GlassButton
                onClick={() => {
                  setDbStatus('connecting');
                  loadProducts();
                  loadCategories();
                  loadBrands();
                  loadSuppliers();
                }}
                icon={<RefreshCw size={18} />}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white"
              >
                Retry Connection
              </GlassButton>
            )}
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
            brands={brands}
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
            brands={brands}
            formatMoney={formatMoney}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            setShowBrandForm={setShowBrandForm}
            setShowCategoryForm={setShowCategoryForm}
            setShowSupplierForm={setShowSupplierForm}
          />
        )}

        {/* Product Modals */}
        <AddProductModal
          isOpen={productModals.showAddModal}
          onClose={productModals.closeAddModal}
          onProductCreated={(product) => {
            toast.success('Product created successfully!');
            loadProducts();
          }}
        />

        <EditProductModal
          isOpen={productModals.showEditModal}
          onClose={productModals.closeEditModal}
          productId={productModals.editingProductId || ''}
          onProductUpdated={(product) => {
            toast.success('Product updated successfully!');
            loadProducts();
          }}
        />

        {/* Stock Adjustment Modal */}
        {showStockAdjustModal && selectedProductForHistory && (
          <StockAdjustModal
            variant={products.find(p => p.id === selectedProductForHistory)?.variants?.[0]}
            isOpen={showStockAdjustModal}
            onClose={() => {
              setShowStockAdjustModal(false);
              setSelectedProductForHistory(null);
            }}
            onSubmit={async (data) => {
              const product = products.find(p => p.id === selectedProductForHistory);
              if (product && product.variants?.[0]) {
                const variant = product.variants[0];
                let quantity = data.quantity;
                
                // Calculate the actual quantity change based on adjustment type
                if (data.adjustmentType === 'out') {
                  quantity = -quantity; // Negative for stock out
                } else if (data.adjustmentType === 'set') {
                  quantity = quantity - variant.quantity; // Difference for set
                }
                
                await handleStockAdjustment(product.id, variant.id, quantity, data.reason);
              }
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

        {showBrandForm && (
          <BrandForm
            isOpen={showBrandForm}
            onClose={() => setShowBrandForm(false)}
            onSubmit={async (brandData) => {
              try {
                await createBrand(brandData);
                toast.success('Brand created successfully');
                setShowBrandForm(false);
              } catch (error) {
                toast.error('Failed to create brand');
                console.error('Brand creation error:', error);
              }
            }}
          />
        )}

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
    </PageErrorBoundary>
  );
};

export default UnifiedInventoryPage;
