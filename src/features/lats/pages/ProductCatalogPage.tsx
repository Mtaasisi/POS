import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import LATSQuickActions from '../components/ui/LATSQuickActions';
import { 
  Package, Search, Plus, Grid, List, Filter, SortAsc, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, Tag, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Users, Crown, Calendar, RotateCcw, RefreshCw as RefreshCwIcon,
  ShoppingCart, FileText, CreditCard, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import product forms

import CategoryFormModal from '../components/inventory/CategoryFormModal';
import SupplierForm from '../components/inventory/SupplierForm';
import VariantProductCard from '../components/inventory/VariantProductCard';
// AddProductModal removed - using AddProductPage instead
import EditProductModal from '../components/inventory/EditProductModal';
import { useProductModals } from '../hooks/useProductModals';

// Import database functionality
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { latsEventBus } from '../lib/data/eventBus';

// Product catalog data is now loaded from database

const LOCAL_STORAGE_KEY = 'productCatalogPrefs';
const CACHE_KEY = 'productCatalogCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache utility functions
const getCachedData = (key: string) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

// Debounce hook
const useDebounce = (value: any, delay: number) => {
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

const getInitialPrefs = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const ProductCatalogPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Product modals
  const productModals = useProductModals();
  
  // Database state management
  const { 
    products, 
    categories, 
    brands, 
    suppliers,
    sales,
    isLoading,
    error,
    loadProducts,
    loadCategories,
    loadBrands,
    loadSuppliers,
    loadSales,
    getSoldQuantity,
    createProduct,
    createCategory,
    createBrand,
    createSupplier,
    updateProduct,
    deleteProduct
  } = useInventoryStore();

  // Database connection status
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Restore preferences from localStorage
  const prefs = getInitialPrefs();
  const [searchQuery, setSearchQuery] = useState(prefs.searchQuery ?? '');
  const [selectedCategory, setSelectedCategory] = useState(prefs.selectedCategory ?? 'all');
  const [selectedBrand, setSelectedBrand] = useState(prefs.selectedBrand ?? 'all');
  const [selectedStatus, setSelectedStatus] = useState(prefs.selectedStatus ?? 'all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(prefs.showFeaturedOnly ?? false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(prefs.viewMode ?? 'grid');
  const [sortBy, setSortBy] = useState(prefs.sortBy ?? 'name');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(prefs.showAdvancedFilters ?? false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Performance optimizations
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Form state variables
  const [showProductForm, setShowProductForm] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Load data from database on component mount with error handling
  useEffect(() => {
    const loadData = async () => {
      console.log('🔧 LATS Product Catalog: Loading data from database...');
      setDbStatus('connecting');
      
      try {
        await Promise.all([
          loadProducts({ page: 1, limit: 50 }),
          loadCategories(),
          loadBrands(),
          loadSuppliers()
        ]);
        
        console.log('📊 LATS Product Catalog: Data loaded successfully');
        console.log('📦 Products:', products.length);
        console.log('📂 Categories:', categories.length);
        console.log('🏷️ Brands:', brands.length);
        console.log('🏢 Suppliers:', suppliers.length);
        
        setCachedProducts(products || []);
        setDbStatus('connected');
        setIsInitialLoad(false);
        
      } catch (error) {
        console.error('❌ Error loading product catalog data:', error);
        toast.error('Failed to load data from database. Please check your connection.');
        setDbStatus('error');
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadBrands, loadSuppliers, products, categories, brands, suppliers]);

  // Load more products (pagination)
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      // For now, we'll load all products and handle pagination client-side
      // In a real implementation, you'd want server-side pagination
      await loadProducts({ page: 1, limit: 50 });
      setCachedProducts(products || []);
      setHasMore(false); // Disable pagination for now
    } catch (error) {
      console.error('Error loading more products:', error);
      toast.error('Failed to load more products');
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadProducts, products, isLoadingMore, hasMore]);

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('🔧 LATS Product Catalog: Loading data from database...');
      setDbStatus('connecting');
      
      try {
        await Promise.all([
          loadProducts({ page: 1, limit: 50 }),
          loadCategories(),
          loadBrands(),
          loadSuppliers()
        ]);
        
        console.log('📊 LATS Product Catalog: Data loaded successfully');
        console.log('📦 Products:', products.length);
        console.log('📂 Categories:', categories.length);
        console.log('🏷️ Brands:', brands.length);
        console.log('🏢 Suppliers:', suppliers.length);
        
        setCachedProducts(products || []);
        setDbStatus('connected');
        setIsInitialLoad(false);
        
      } catch (error) {
        console.error('❌ Error loading product catalog data:', error);
        toast.error('Failed to load data from database. Please check your connection.');
        setDbStatus('error');
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadBrands, loadSuppliers, products, categories, brands, suppliers]);

  // Handle escape key to close delete confirmation
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDeleteConfirmation) {
        setShowDeleteConfirmation(false);
      }
    };

    if (showDeleteConfirmation) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDeleteConfirmation]);

  // Listen for product creation events to refresh data
  useEffect(() => {
    const handleProductCreated = () => {
      console.log('🔄 [DEBUG] Product created event received, refreshing data...');
      // Clear cache and reload
      localStorage.removeItem(CACHE_KEY);
      loadProducts({ page: 1, limit: 50 });
      loadCategories();
      loadBrands();
      loadSuppliers();
    };

    const handleProductUpdated = () => {
      console.log('🔄 [DEBUG] Product updated event received, refreshing data...');
      // Clear cache and reload
      localStorage.removeItem(CACHE_KEY);
      loadProducts({ page: 1, limit: 50 });
      loadCategories();
      loadBrands();
      loadSuppliers();
    };

    const handleProductDeleted = () => {
      console.log('🔄 [DEBUG] Product deleted event received, refreshing data...');
      // Clear cache and reload
      localStorage.removeItem(CACHE_KEY);
      loadProducts({ page: 1, limit: 50 });
      loadCategories();
      loadBrands();
      loadSuppliers();
    };

    // Subscribe to product events
    const unsubscribeCreated = latsEventBus.subscribe('lats:product.created', handleProductCreated);
    const unsubscribeUpdated = latsEventBus.subscribe('lats:product.updated', handleProductUpdated);
    const unsubscribeDeleted = latsEventBus.subscribe('lats:product.deleted', handleProductDeleted);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [loadProducts, loadCategories, loadBrands, loadSuppliers]);

  // Persist preferences to localStorage on change
  React.useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        searchQuery,
        selectedCategory,
        selectedBrand,
        selectedStatus,
        showFeaturedOnly,
        viewMode,
        sortBy,
        showAdvancedFilters,
      })
    );
  }, [searchQuery, selectedCategory, selectedBrand, selectedStatus, showFeaturedOnly, viewMode, sortBy, showAdvancedFilters]);

  // Filter and sort products with memoization for performance
  const filteredProducts = useMemo(() => {
    let filtered = cachedProducts;

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Apply brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => product.brandId === selectedBrand);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.isActive === (selectedStatus === 'active'));
    }

    // Apply featured filter
    if (showFeaturedOnly) {
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
          return (b.totalQuantity || 0) - (a.totalQuantity || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [cachedProducts, debouncedSearchQuery, selectedCategory, selectedBrand, selectedStatus, showFeaturedOnly, sortBy]);

  // Calculate metrics with memoization
  const metrics = useMemo(() => {
    const totalProducts = cachedProducts.length;
    const activeProducts = cachedProducts.filter(p => p.isActive).length;
    const lowStockProducts = cachedProducts.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock <= 10;
    }).length;
    const outOfStockProducts = cachedProducts.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock === 0;
    }).length;

    return {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      featured: cachedProducts.filter(p => p.isFeatured).length
    };
  }, [cachedProducts]);

  // Show demo data when database is empty
  const showDemoData = dbStatus === 'connected' && cachedProducts.length === 0;

  // Filter products
  // const filteredProducts = useMemo(() => {
  //   return products.filter(product => {
  //     const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
  //                         (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
  //                         product.variants?.some(variant => variant.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      
  //     const category = categories.find(c => c.id === product.categoryId);
  //     const brand = brands.find(b => b.id === product.brandId);
      
  //     const matchesCategory = selectedCategory === 'all' || (category && category.name === selectedCategory);
  //     const matchesBrand = selectedBrand === 'all' || (brand && brand.name === selectedBrand);
  //     const matchesStatus = selectedStatus === 'all' || product.isActive === (selectedStatus === 'active');
  //     const matchesFeatured = !showFeaturedOnly || product.tags.includes('featured');

  //     return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesFeatured;
  //   }).sort((a, b) => {
  //     switch (sortBy) {
  //       case 'name':
  //         return a.name.localeCompare(b.name);
  //       case 'price':
  //         return (b.variants?.[0]?.sellingPrice || 0) - (a.variants?.[0]?.sellingPrice || 0);
  //       case 'recent':
  //         return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  //       case 'stock':
  //         return (b.totalQuantity || 0) - (a.totalQuantity || 0);
  //       case 'sales':
  //         // Sort by real sales data
  //         const aSold = a.variants?.reduce((sum, variant) => {
  //           const soldQuantity = getSoldQuantity(a.id, variant.id);
  //           return sum + soldQuantity;
  //         }, 0) || 0;
  //         const bSold = b.variants?.reduce((sum, variant) => {
  //           const soldQuantity = getSoldQuantity(b.id, variant.id);
  //           return sum + soldQuantity;
  //         }, 0) || 0;
  //         return bSold - aSold;
  //       default:
  //         return 0;
  //     }
  //   });
  // }, [products, categories, brands, searchQuery, selectedCategory, selectedBrand, selectedStatus, showFeaturedOnly, sortBy]);

  // Format currency
  const formatMoney = (amount: number) => {
    return format.money(amount);
  };

  // Calculate profit margin
  const calculateMargin = (price: number, cost: number) => {
    return ((price - cost) / price * 100).toFixed(1);
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
              const product = cachedProducts.find(p => p.id === productId);
              if (!product) return '';
              const category = categories.find(c => c.id === product.categoryId);
              const brand = brands.find(b => b.id === product.brandId);
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
            // Toggle featured status for selected products
            const updatePromises = selectedProducts.map(async (productId) => {
              const product = cachedProducts.find(p => p.id === productId);
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
        
        // Read file content
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            
            // Parse CSV content
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
                
                // Transform CSV data to product format
                const product = {
                  name: productData.name || productData.product_name,
                  description: productData.description || productData.desc,
                  categoryId: '', // Will need to be resolved
                  brandId: '', // Will need to be resolved
                  supplierId: '', // Will need to be resolved
                  images: [],
          
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
                
                // TODO: Resolve category, brand, and supplier IDs
                // For now, create with empty references
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
            
            // Reload data
            await Promise.all([
              loadProducts({ page: 1, limit: 50 }),
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
        "Name,SKU,Category,Brand,Price,Stock,Status,Description\n" +
        cachedProducts.map(product => {
          const category = categories.find(c => c.id === product.categoryId);
          const brand = brands.find(b => b.id === product.brandId);
          const mainVariant = product.variants?.[0];
          return `"${product.name}","${mainVariant?.sku || 'N/A'}","${category?.name || 'Uncategorized'}","${brand?.name || 'No Brand'}","${mainVariant?.sellingPrice || 0}","${product.totalQuantity || 0}","${product.isActive ? 'Active' : 'Inactive'}","${product.description || ''}"`;
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

  // Handle sample data functionality
  const handleAddSampleData = async () => {
    try {
      toast.loading('Adding sample data...');
      
      // Sample categories
      const sampleCategories = [
        { name: 'Smartphones', description: 'Mobile phones and accessories' },
        { name: 'Laptops', description: 'Portable computers and accessories' },
        { name: 'Accessories', description: 'Computer and phone accessories' },
        { name: 'Wearables', description: 'Smartwatches and fitness trackers' },
        { name: 'Tablets', description: 'Portable tablets and accessories' }
      ];

      // Sample brands
      const sampleBrands = [
        { name: 'Apple', description: 'Premium technology products' },
        { name: 'Samsung', description: 'Innovative electronics' },
        { name: 'Dell', description: 'Reliable computing solutions' },
        { name: 'Logitech', description: 'Computer peripherals' },
        { name: 'Sony', description: 'Entertainment electronics' }
      ];

      // Sample suppliers
      const sampleSuppliers = [
        { name: 'Tech Distributors Ltd', email: 'contact@techdist.com', phone: '+1234567890' },
        { name: 'Global Electronics', email: 'sales@globalelec.com', phone: '+1234567891' },
        { name: 'Premium Suppliers Co', email: 'info@premiumsuppliers.com', phone: '+1234567892' }
      ];

      // Create categories
      for (const category of sampleCategories) {
        await createCategory(category);
      }

      // Create brands
      for (const brand of sampleBrands) {
        await createBrand(brand);
      }

      // Create suppliers
      for (const supplier of sampleSuppliers) {
        await createSupplier(supplier);
      }

      // Sample products
      const sampleProducts = [
        {
          name: 'iPhone 14 Pro',
          description: 'Latest iPhone with advanced camera system and A16 Bionic chip',

          variants: [{
            sku: 'IPH14P-128',
            name: 'iPhone 14 Pro 128GB',
            attributes: { color: 'Space Black', storage: '128GB' },
            sellingPrice: 159999,
            costPrice: 120000,
            quantity: 15,
            minQuantity: 5,
            maxQuantity: 50,
            barcode: '1234567890123'
          }]
        },
        {
          name: 'Samsung Galaxy S23',
          description: 'Flagship Android smartphone with S Pen support',

          variants: [{
            sku: 'SAMS23-256',
            name: 'Samsung Galaxy S23 256GB',
            attributes: { color: 'Phantom Black', storage: '256GB' },
            sellingPrice: 129999,
            costPrice: 95000,
            quantity: 12,
            minQuantity: 3,
            maxQuantity: 30,
            barcode: '1234567890124'
          }]
        },
        {
          name: 'MacBook Pro 14"',
          description: 'Professional laptop with M2 Pro chip and Liquid Retina display',

          variants: [{
            sku: 'MBP14-512',
            name: 'MacBook Pro 14" 512GB',
            attributes: { color: 'Space Gray', storage: '512GB' },
            sellingPrice: 299999,
            costPrice: 250000,
            quantity: 8,
            minQuantity: 2,
            maxQuantity: 20,
            barcode: '1234567890125'
          }]
        },
        {
          name: 'Dell XPS 13',
          description: 'Ultrabook with InfinityEdge display and Intel processor',

          variants: [{
            sku: 'DLLXPS-256',
            name: 'Dell XPS 13 256GB',
            attributes: { color: 'Platinum Silver', storage: '256GB' },
            sellingPrice: 189999,
            costPrice: 140000,
            quantity: 10,
            minQuantity: 3,
            maxQuantity: 25,
            barcode: '1234567890126'
          }]
        },
        {
          name: 'AirPods Pro',
          description: 'Wireless earbuds with active noise cancellation',

          variants: [{
            sku: 'AIRPP-2',
            name: 'AirPods Pro 2nd Generation',
            attributes: { color: 'White' },
            sellingPrice: 45999,
            costPrice: 35000,
            quantity: 25,
            minQuantity: 10,
            maxQuantity: 100,
            barcode: '1234567890127'
          }]
        }
      ];

      // Create products with proper category and brand references
      const createdCategories = await Promise.all(sampleCategories.map(cat => createCategory(cat)));
      const createdBrands = await Promise.all(sampleBrands.map(brand => createBrand(brand)));
      
      // Get the created category and brand IDs
      const smartphoneCategory = createdCategories.find(cat => cat.data?.name === 'Smartphones')?.data;
      const laptopCategory = createdCategories.find(cat => cat.data?.name === 'Laptops')?.data;
      const accessoryCategory = createdCategories.find(cat => cat.data?.name === 'Accessories')?.data;
      
      const appleBrand = createdBrands.find(brand => brand.data?.name === 'Apple')?.data;
      const samsungBrand = createdBrands.find(brand => brand.data?.name === 'Samsung')?.data;
      const dellBrand = createdBrands.find(brand => brand.data?.name === 'Dell')?.data;
      
      // Create products with proper references
      const productsWithRefs = [
        {
          ...sampleProducts[0], // iPhone
          categoryId: smartphoneCategory?.id || '',
          brandId: appleBrand?.id || ''
        },
        {
          ...sampleProducts[1], // Samsung
          categoryId: smartphoneCategory?.id || '',
          brandId: samsungBrand?.id || ''
        },
        {
          ...sampleProducts[2], // MacBook
          categoryId: laptopCategory?.id || '',
          brandId: appleBrand?.id || ''
        },
        {
          ...sampleProducts[3], // Dell
          categoryId: laptopCategory?.id || '',
          brandId: dellBrand?.id || ''
        },
        {
          ...sampleProducts[4], // AirPods
          categoryId: accessoryCategory?.id || '',
          brandId: appleBrand?.id || ''
        }
      ];
      
      for (const product of productsWithRefs) {
        if (product.categoryId && product.brandId) {
          await createProduct(product);
        }
      }

      toast.dismiss();
      toast.success('Sample data added successfully!');
      
      // Reload data to show the new items
      await Promise.all([
        loadProducts({ page: 1, limit: 50 }),
        loadCategories(),
        loadBrands(),
        loadSuppliers()
      ]);
      
    } catch (error) {
      toast.dismiss();
      console.error('Error adding sample data:', error);
      toast.error('Failed to add sample data');
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
            <p className="text-gray-600 mt-1">Manage products, inventory, and stock levels</p>
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => navigate('/lats/add-product')}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            Add Product
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
                loadProducts({ page: 1, limit: 50 });
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

      {/* Quick Navigation Icons - HIDDEN */}
      {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          ... navigation icons ...
        </div>
      </div> */}

      {/* LATS Navigation - HIDDEN */}
      {/* <LATSNavigation variant="horizontal" className="mb-4" /> */}
      
      {/* Breadcrumb - HIDDEN */}
      {/* <LATSBreadcrumb className="mb-4" /> */}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.total}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {dbStatus === 'connected' ? 'From database' : 'Loading...'}
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Products</p>
              <p className="text-2xl font-bold text-green-900">{metrics.active}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Available for sale</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Inventory Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(metrics.total * (products.find(p => p.id === '1')?.variants?.[0]?.sellingPrice || 0))}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total retail value</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Total Profit</p>
              <p className="text-2xl font-bold text-amber-900">{formatMoney(metrics.total * (products.find(p => p.id === '1')?.variants?.[0]?.sellingPrice || 0) - metrics.total * (products.find(p => p.id === '1')?.variants?.[0]?.costPrice || 0))}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Potential profit</span>
          </div>
        </GlassCard>
      </div>

      {/* Product Catalog Forms Section */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900">Product Inventory Management</h3>
            <p className="text-sm text-purple-600">Add and manage products, inventory, and stock levels</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setShowProductForm(true)}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Product</span>
            </div>
            <p className="text-xs text-gray-600">Add product to inventory</p>
          </button>

          <button
            onClick={() => window.open('/brand-management', '_blank')}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Manage Brands</span>
            </div>
            <p className="text-xs text-gray-600">Open brand management</p>
          </button>

          <button
            onClick={() => setShowCategoryForm(true)}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Category</span>
            </div>
            <p className="text-xs text-gray-600">Add category</p>
          </button>

          <button
            onClick={() => setShowSupplierForm(true)}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">New Supplier</span>
            </div>
            <p className="text-xs text-gray-600">Add supplier</p>
          </button>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <LATSQuickActions 
          variant="compact" 
          category="inventory"
          maxItems={4}
          className="mb-4"
        />
        <div className="grid grid-cols-2 gap-3">
          <GlassButton
            variant="secondary"
            icon={<BarChart3 size={16} />}
            onClick={() => navigate('/lats/analytics')}
            className="text-sm"
          >
            View Analytics
          </GlassButton>
          <GlassButton
            variant="secondary"
            icon={<TrendingUp size={16} />}
            onClick={() => navigate('/lats/sales-analytics')}
            className="text-sm"
          >
            Sales Analytics
          </GlassButton>
        </div>
      </GlassCard>

      {/* Filters and Controls */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search products..."
              className="w-full"
              suggestions={[
                ...cachedProducts.map(p => p.name),
                ...cachedProducts.map(p => p.variants?.[0]?.sku || '').filter(Boolean),
                ...cachedProducts.map(p => brands.find(b => b.id === p.brandId)?.name || '').filter(Boolean),
                ...cachedProducts.map(p => categories.find(c => c.id === p.categoryId)?.name || '').filter(Boolean)
              ]}
              searchKey="product_catalog_search"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <GlassSelect
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category.name,
                  label: category.name
                }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select Category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <GlassSelect
              options={[
                { value: 'all', label: 'All Brands' },
                ...brands.map(brand => ({
                  value: brand.name,
                  label: brand.name
                }))
              ]}
              value={selectedBrand}
              onChange={setSelectedBrand}
              placeholder="Select Brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="name">Name</option>
              <option value="price">Price (High to Low)</option>
              <option value="recent">Recently Updated</option>
              <option value="stock">Stock Level</option>
              <option value="sales">Sales Volume</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Featured Only</span>
            </label>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'grid' ? <Grid size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <GlassCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                icon={<Download size={16} />}
                onClick={() => handleBulkAction('export')}
                className="text-sm"
              >
                Export
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Star size={16} />}
                onClick={() => handleBulkAction('feature')}
                className="text-sm"
              >
                Feature
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Trash2 size={16} />}
                onClick={() => setShowDeleteConfirmation(true)}
                className="text-sm text-red-600 hover:bg-red-50"
              >
                Delete All
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<XCircle size={16} />}
                onClick={() => setSelectedProducts([])}
                className="text-sm text-red-600"
              >
                Clear
              </GlassButton>
            </div>
          </div>
        </GlassCard>
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

      {/* Products Display */}
      {viewMode === 'list' ? (
        <>
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="text-left py-4 px-4 font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Product</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">SKU</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-700">Brand</th>
                    <th className="text-right py-4 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-right py-4 px-4 font-medium text-gray-700">Stock</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-center py-4 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const brand = brands.find(b => b.id === product.brandId);
                    const mainVariant = product.variants?.[0];
                    
                    return (
                      <tr key={product.id} className="border-b border-gray-200/30 hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={e => { e.stopPropagation(); toggleProductSelection(product.id); }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">
                                {product.description ? `${product.description.substring(0, 50)}...` : 'No description'}
                              </p>
                              {product.isFeatured && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-gray-600">{mainVariant?.sku || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{category?.name || 'Uncategorized'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{brand?.name || 'No Brand'}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-semibold text-gray-900">{formatMoney(mainVariant?.sellingPrice || 0)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm text-gray-600">{product.totalQuantity || 0} units</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/lats/products/${product.id}/edit`); }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/inventory/products/${product.id}`); }}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <GlassButton
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Products'
                )}
              </GlassButton>
            </div>
          )}
        </>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            const brand = brands.find(b => b.id === product.brandId);
            
            return (
              <VariantProductCard
                key={product.id}
                product={{
                  ...product,
                  categoryName: category?.name,
                  brandName: brand?.name
                }}
                onView={(product) => navigate(`/lats/products/${product.id}`)}
                onEdit={(product) => {
                  productModals.openEditModal(product.id);
                }}
                onDelete={(product) => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    deleteProduct(product.id);
                  }
                }}
                showActions={true}
                variant="default"
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showDemoData ? 'Database is Empty' : 'No products found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {showDemoData 
              ? 'The LATS database is connected but contains no data. Add some products to get started!'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlassButton
              onClick={() => navigate('/lats/add-product')}
              icon={<Plus size={18} />}
            >
              Add Your First Product
            </GlassButton>
            {showDemoData && (
              <GlassButton
                onClick={handleAddSampleData}
                icon={<Download size={18} />}
                variant="secondary"
              >
                Add Sample Data
              </GlassButton>
            )}
          </div>
        </GlassCard>
      )}

      {/* Results Summary */}
      {filteredProducts.length > 0 && (
        <GlassCard className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {cachedProducts.length} products
              {isLoading && <span className="ml-2 text-blue-600">Loading...</span>}
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  try {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Name,SKU,Category,Brand,Price,Stock,Status,Description\n" +
                      filteredProducts.map(p => {
                        const category = categories.find(c => c.id === p.categoryId);
                        const brand = brands.find(b => b.id === p.brandId);
                        const mainVariant = p.variants?.[0];
                        return `"${p.name}","${mainVariant?.sku || 'N/A'}","${category?.name || 'Uncategorized'}","${brand?.name || 'No Brand'}","${mainVariant?.sellingPrice || 0}","${p.totalQuantity || 0}","${p.isActive ? 'Active' : 'Inactive'}","${p.description || ''}"`;
                      }).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `filtered-products-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Filtered products exported successfully!');
                  } catch (error) {
                    console.error('Export error:', error);
                    toast.error('Failed to export products');
                  }
                }}
                icon={<Download size={16} />}
                className="text-sm"
              >
                Export
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={handleImport}
                icon={<Upload size={16} />}
                className="text-sm"
              >
                Import
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Loading State */}
      {isLoading && (
        <GlassCard className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading LATS data from database...</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </GlassCard>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="text-center py-12 bg-red-50 border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Database Connection Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-700">
            <p>• Check your internet connection</p>
            <p>• Verify Supabase configuration</p>
            <p>• Ensure database tables exist</p>
          </div>
          <GlassButton
            onClick={() => {
              setDbStatus('connecting');
              loadProducts({ page: 1, limit: 50 });
              loadCategories();
              loadBrands();
              loadSuppliers();
            }}
            icon={<RefreshCw size={16} />}
            variant="secondary"
            className="mt-4"
          >
            Retry Connection
          </GlassButton>
        </GlassCard>
      )}

      {/* Product Catalog Form Modals */}
      
      {/* Product Modals */}
      {/* AddProductModal removed - use AddProductPage instead */}

      <EditProductModal
        isOpen={productModals.showEditModal}
        onClose={productModals.closeEditModal}
        productId={productModals.editingProductId || ''}
        onProductUpdated={(product) => {
          toast.success('Product updated successfully!');
          // Clear cache and reload
          localStorage.removeItem(CACHE_KEY);
          loadProducts({ page: 1, limit: 50 });
          loadCategories();
          loadBrands();
          loadSuppliers();
        }}
      />



      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={async (category) => {
          try {
            const result = await createCategory(category);
            if (result.ok) {
              toast.success('Category created successfully!');
              setShowCategoryForm(false);
            } else {
              toast.error(result.message || 'Failed to create category');
            }
          } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to create category');
          }
        }}
        parentCategories={categories}
        loading={isLoading}
      />

      {/* Supplier Form */}
      {showSupplierForm && (
        <SupplierForm
          onSubmit={async (supplier) => {
            try {
              const result = await createSupplier(supplier);
              if (result.ok) {
                toast.success('Supplier created successfully!');
                setShowSupplierForm(false);
              } else {
                toast.error(result.message || 'Failed to create supplier');
              }
            } catch (error) {
              console.error('Error creating supplier:', error);
              toast.error('Failed to create supplier');
            }
          }}
          onCancel={() => setShowSupplierForm(false)}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default ProductCatalogPage;
