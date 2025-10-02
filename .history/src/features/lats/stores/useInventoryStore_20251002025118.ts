// Inventory store for LATS module using Zustand
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  Category, 
  Supplier, 
  Product, 
  ProductVariant,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  ApiResponse,
  PaginatedResponse 
} from '../types/inventory';
import { SparePart, SparePartUsage } from '../types/spareParts';
import { getLatsProvider } from '../lib/data/provider';
import { latsEventBus, LatsEventType } from '../lib/data/eventBus';
import { latsAnalyticsService as latsAnalytics } from '../lib/analytics';
import { supabase } from '../../../lib/supabaseClient';
import { processLatsData, processCategoriesOnly, processProductsOnly, processSuppliersOnly, validateDataIntegrity, emergencyDataCleanup } from '../lib/dataProcessor';
import { categoryService } from '../lib/categoryService';
import { 
  getActiveSuppliers as getActiveSuppliersApi, 
  getAllSuppliers as getAllSuppliersApi,
  createSupplier as createSupplierApi, 
  updateSupplier as updateSupplierApi 
} from '../../../lib/supplierApi';
import { 
  createSparePart as createSparePartApi, 
  createOrUpdateSparePart as createOrUpdateSparePartApi,
  updateSparePartWithVariants as updateSparePartWithVariantsApi,
  deleteSparePart as deleteSparePartApi,
  recordSparePartUsage as recordSparePartUsageApi
} from '../lib/sparePartsApi';

interface InventoryState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Prevent multiple simultaneous loads
  isDataLoading: boolean;
  isCategoriesLoading: boolean;
  lastDataLoadTime: number;
  // Supplier-specific loading to avoid global guard skipping
  isSuppliersLoading?: boolean;

  // Cache management
  dataCache: {
    categories: Category[] | null;
    suppliers: Supplier[] | null;
    products: Product[] | null;
    stockMovements: StockMovement[] | null;
    sales: any[] | null;
    spareParts: SparePart[] | null;
  };
  cacheTimestamp: number;
  CACHE_DURATION: number; // 5 minutes

  // Data
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  sales: any[];
  stockMovements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  spareParts: SparePart[];
  sparePartUsage: SparePartUsage[];

  // Filters and search
  searchTerm: string;
  selectedCategory: string | null;
  selectedSupplier: string | null;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;

  // Selected items
  selectedProducts: string[];
  selectedPurchaseOrders: string[];

  // Error handling
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Search and filters
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;

  setSelectedSupplier: (supplierId: string | null) => void;
  setStockFilter: (filter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') => void;
  clearFilters: () => void;

  // Pagination
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;

  // Selection
  toggleProductSelection: (productId: string) => void;
  selectAllProducts: () => void;
  deselectAllProducts: () => void;
  togglePurchaseOrderSelection: (orderId: string) => void;
  selectAllPurchaseOrders: () => void;
  deselectAllPurchaseOrders: () => void;

  // Categories
  loadCategories: () => Promise<void>;
  loadSparePartCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Category>>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<ApiResponse<Category>>;
  deleteCategory: (id: string) => Promise<ApiResponse<void>>;

  // Suppliers
  loadSuppliers: () => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Supplier>>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<ApiResponse<Supplier>>;
  deleteSupplier: (id: string) => Promise<ApiResponse<void>>;

  // Products
  loadProducts: (filters?: any) => Promise<void>;
  loadProductVariants: (productId: string) => Promise<{ ok: boolean; data: ProductVariant[] }>;
  getProduct: (id: string) => Promise<ApiResponse<Product>>;
  createProduct: (product: any) => Promise<ApiResponse<Product>>;
  updateProduct: (id: string, product: any) => Promise<ApiResponse<Product>>;
  deleteProduct: (id: string) => Promise<ApiResponse<void>>;
  searchProducts: (query: string) => Promise<ApiResponse<Product[]>>;

  // Stock Management
  loadStockMovements: () => Promise<void>;
  adjustStock: (productId: string, variantId: string, quantity: number, reason: string) => Promise<ApiResponse<void>>;

  // Sales Data
  loadSales: () => Promise<void>;
  getProductSales: (productId: string) => Promise<ApiResponse<any[]>>;
  getSoldQuantity: (productId: string, variantId?: string) => number;

  // Purchase Orders
  loadPurchaseOrders: () => Promise<void>;
  getPurchaseOrder: (id: string) => Promise<ApiResponse<PurchaseOrder>>;
  createPurchaseOrder: (order: any) => Promise<ApiResponse<PurchaseOrder>>;
  updatePurchaseOrder: (id: string, order: any) => Promise<ApiResponse<PurchaseOrder>>;
  updatePurchaseOrderStatus: (id: string, status: string) => Promise<ApiResponse<PurchaseOrder>>;
  approvePurchaseOrder: (id: string) => Promise<ApiResponse<PurchaseOrder>>;
  receivePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;
  deletePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;


  // Spare Parts
  loadSpareParts: () => Promise<void>;
  getSparePart: (id: string) => Promise<ApiResponse<SparePart>>;
  createSparePart: (sparePart: any) => Promise<ApiResponse<SparePart>>;
  createOrUpdateSparePart: (sparePart: any) => Promise<ApiResponse<SparePart>>;
  updateSparePart: (id: string, sparePart: any) => Promise<ApiResponse<SparePart>>;
  deleteSparePart: (id: string) => Promise<ApiResponse<void>>;
  useSparePart: (id: string, quantity: number, reason: string, notes?: string) => Promise<ApiResponse<void>>;
  loadSparePartUsage: () => Promise<void>;

  // Computed values
  getFilteredProducts: () => Product[];
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isDataLoading: false,
      isCategoriesLoading: false,
      isSuppliersLoading: false,
      lastDataLoadTime: 0,

      // Cache management
      dataCache: {
        categories: null,
        suppliers: null,
        products: null,
        stockMovements: null,
        sales: null,
        spareParts: null,
      },
      cacheTimestamp: 0,
      CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

      categories: [],
      suppliers: [],
      products: [],
      sales: [],
      stockMovements: [],
      purchaseOrders: [],
      spareParts: [],
      sparePartUsage: [],

      searchTerm: '',
      selectedCategory: null,
      selectedSupplier: null,
      stockFilter: 'all',

      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,

      selectedProducts: [],
      selectedPurchaseOrders: [],

      error: null,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Search and filters
      setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId, currentPage: 1 }),

      setSelectedSupplier: (supplierId) => set({ selectedSupplier: supplierId, currentPage: 1 }),
      setStockFilter: (filter) => set({ stockFilter: filter, currentPage: 1 }),
      clearFilters: () => set({
        searchTerm: '',
        selectedCategory: null,
        selectedSupplier: null,
        stockFilter: 'all',
        currentPage: 1
      }),

      // Pagination
      setCurrentPage: (page) => set({ currentPage: page }),
      setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),

      // Selection
      toggleProductSelection: (productId) => {
        const { selectedProducts } = get();
        const newSelection = selectedProducts.includes(productId)
          ? selectedProducts.filter(id => id !== productId)
          : [...selectedProducts, productId];
        set({ selectedProducts: newSelection });
      },

      selectAllProducts: () => {
        const { getFilteredProducts } = get();
        const productIds = getFilteredProducts().map(p => p.id);
        set({ selectedProducts: productIds });
      },

      deselectAllProducts: () => set({ selectedProducts: [] }),
      
      // Force refresh products (useful when new products are added)
      forceRefreshProducts: async () => {
        console.log('🔄 [useInventoryStore] Force refreshing products...');
        const state = get();
        
        // Clear all caches to ensure fresh data
        set({
          dataCache: { ...state.dataCache, products: null },
          cacheTimestamp: 0,
          products: [] // Clear current products to show loading state
        });
        
        // Load fresh data
        await state.loadProducts({ page: 1, limit: 100 });
        console.log('✅ [useInventoryStore] Products force refreshed');
      },

      togglePurchaseOrderSelection: (orderId) => {
        const { selectedPurchaseOrders } = get();
        const newSelection = selectedPurchaseOrders.includes(orderId)
          ? selectedPurchaseOrders.filter(id => id !== orderId)
          : [...selectedPurchaseOrders, orderId];
        set({ selectedPurchaseOrders: newSelection });
      },

      selectAllPurchaseOrders: () => {
        const { purchaseOrders } = get();
        const orderIds = purchaseOrders.map(o => o.id);
        set({ selectedPurchaseOrders: orderIds });
      },

      deselectAllPurchaseOrders: () => set({ selectedPurchaseOrders: [] }),

      // Cache management
      isCacheValid: (dataType: keyof InventoryState['dataCache']) => {
        const state = get();
        const cacheAge = Date.now() - state.cacheTimestamp;
        const isValid = state.dataCache[dataType] !== null && cacheAge < state.CACHE_DURATION;

        return isValid;
      },

      updateCache: (dataType: keyof InventoryState['dataCache'], data: any) => {
        const state = get();

        set({
          dataCache: {
            ...state.dataCache,
            [dataType]: data
          },
          cacheTimestamp: Date.now()
        });
      },

      clearCache: (dataType?: keyof InventoryState['dataCache']) => {
        const state = get();

        if (dataType) {
          // Clear specific cache
          set({
            dataCache: {
              ...state.dataCache,
              [dataType]: null
            }
          });
        } else {
          // Clear all cache
          set({
            dataCache: {
              categories: null,
              suppliers: null,
              products: null,
              stockMovements: null,
              sales: null,
            },
            cacheTimestamp: 0
          });
        }
      },

      invalidateCache: (dataType: keyof InventoryState['dataCache']) => {
        const state = get();
        set({
          dataCache: {
            ...state.dataCache,
            [dataType]: null
          }
        });
      },

      // Categories
      loadCategories: async () => {
        const state = get();
        
        // Check cache first (but force refresh for now to test)
        if (state.isCacheValid('categories') && false) { // Temporarily disabled to force refresh
          set({ categories: state.dataCache.categories || [] });
          return;
        }

        // Prevent multiple simultaneous category loads (use separate flag)
        if (state.isCategoriesLoading) {
          return;
        }

        set({ isLoading: true, isCategoriesLoading: true, error: null });
        try {
          // Use optimized category service
          const categories = await categoryService.getCategories();
          
          // Validate and process categories
          if (categories.length > 0) {
            validateDataIntegrity(categories, 'Categories');
          }
          const processedCategories = processCategoriesOnly(categories);
          
          // Only update if categories have actually changed
          const currentCategories = get().categories;
          const hasChanged = !currentCategories || 
            currentCategories.length !== processedCategories.length ||
            currentCategories.some((cat, index) => 
              !processedCategories[index] || 
              cat.id !== processedCategories[index].id ||
              cat.name !== processedCategories[index].name
            );
          
          if (hasChanged) {

            set({ 
              categories: processedCategories, 
              lastDataLoadTime: Date.now(),
              error: null // Clear any previous errors
            });
            get().updateCache('categories', processedCategories);
            latsAnalytics.track('categories_loaded', { count: processedCategories.length });
          } else {

          }
        } catch (error) {
          console.error('Categories exception:', error);
          
          // Create fallback categories if database fails

          const fallbackCategories = [
            {
              id: 'sample-category',
              name: 'Electronics',
              description: 'Electronic devices and accessories',
              color: '#3B82F6',
              icon: '📱',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 1,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-category-2',
              name: 'Accessories',
              description: 'Phone and device accessories',
              color: '#10B981',
              icon: '🎧',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 2,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-category-3',
              name: 'Repair Parts',
              description: 'Repair and replacement parts',
              color: '#F59E0B',
              icon: '🔧',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 3,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          set({ 
            categories: fallbackCategories,
            error: 'Using sample categories due to database connection issue'
          });
        } finally {
          set({ isLoading: false, isCategoriesLoading: false });
        }
      },

      loadSparePartCategories: async () => {
        const state = get();
        
        // Prevent multiple simultaneous loads
        if (state.isDataLoading) {
          return;
        }

        set({ isLoading: true, isDataLoading: true, error: null });
        try {
          // Use optimized category service to get spare part categories
          const sparePartCategories = await categoryService.getSparePartCategories();
          
          // Validate and process categories
          if (sparePartCategories.length > 0) {
            validateDataIntegrity(sparePartCategories, 'Spare Part Categories');
          }
          const processedCategories = processCategoriesOnly(sparePartCategories);
          
          // Only update if categories have actually changed
          const currentCategories = get().categories;
          const hasChanged = !currentCategories || 
            currentCategories.length !== processedCategories.length ||
            currentCategories.some((cat, index) => 
              !processedCategories[index] || 
              cat.id !== processedCategories[index].id ||
              cat.name !== processedCategories[index].name
            );
          
          if (hasChanged) {

            set({ 
              categories: processedCategories, 
              lastDataLoadTime: Date.now(),
              error: null // Clear any previous errors
            });
            latsAnalytics.track('spare_part_categories_loaded', { count: processedCategories.length });
          } else {

          }
        } catch (error) {
          console.error('Spare part categories exception:', error);
          set({ error: 'Failed to load spare part categories' });
        } finally {
          set({ isLoading: false, isDataLoading: false });
        }
      },

      createCategory: async (category) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createCategory(category);
          if (response.ok) {
            // Invalidate both local and service cache
            get().invalidateCache('categories');
            categoryService.invalidateCache();
            latsAnalytics.track('category_created', { categoryId: response.data?.id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create category';
          set({ error: errorMsg });
          console.error('Error creating category:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateCategory: async (id, category) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updateCategory(id, category);
          if (response.ok) {
            // Invalidate both local and service cache
            get().invalidateCache('categories');
            categoryService.invalidateCache();
            latsAnalytics.track('category_updated', { categoryId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update category';
          set({ error: errorMsg });
          console.error('Error updating category:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteCategory: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.deleteCategory(id);
          if (response.ok) {
            // Invalidate both local and service cache
            get().invalidateCache('categories');
            categoryService.invalidateCache();
            latsAnalytics.track('category_deleted', { categoryId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete category';
          set({ error: errorMsg });
          console.error('Error deleting category:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },

      // Suppliers
      loadSuppliers: async () => {
        const state = get();
        
        // Check cache first with shorter cache duration for suppliers
        if (state.isCacheValid('suppliers')) {
          set({ suppliers: state.dataCache.suppliers || [] });
          return;
        }

        // Use a supplier-specific loading flag to avoid conflicts with other loads
        if (state.isSuppliersLoading) {
          return;
        }

        set({ isSuppliersLoading: true, error: null });
        
        // Use Promise.race for timeout protection with shorter timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supplier fetch timeout')), 5000)
        );

        try {
          // Race between actual fetch and timeout - loading only active suppliers
          const suppliers = await Promise.race([
            getActiveSuppliersApi(),
            timeoutPromise
          ]);
          
          // Use data processor for consistent processing
          const processedSuppliers = processSuppliersOnly(suppliers);
          
          set({ 
            suppliers: processedSuppliers, 
            lastDataLoadTime: Date.now() 
          });
          
          // Update cache with longer duration for suppliers (5 minutes)
          get().updateCache('suppliers', processedSuppliers);
          latsAnalytics.track('suppliers_loaded', { count: processedSuppliers.length });
        } catch (error) {
          console.error('Suppliers exception:', error);
          set({ error: 'Failed to load suppliers' });
        } finally {
          set({ isSuppliersLoading: false });
        }
      },

      createSupplier: async (supplier) => {
        set({ isCreating: true, error: null });
        try {
          const createdSupplier = await createSupplierApi(supplier);
          await get().loadSuppliers();
          latsAnalytics.track('supplier_created', { supplierId: createdSupplier.id });
          return { ok: true, data: createdSupplier };
        } catch (error) {
          const errorMsg = 'Failed to create supplier';
          set({ error: errorMsg });
          console.error('Error creating supplier:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateSupplier: async (id, supplier) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedSupplier = await updateSupplierApi(id, supplier);
          await get().loadSuppliers();
          latsAnalytics.track('supplier_updated', { supplierId: id });
          return { ok: true, data: updatedSupplier };
        } catch (error) {
          const errorMsg = 'Failed to update supplier';
          set({ error: errorMsg });
          console.error('Error updating supplier:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteSupplier: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.deleteSupplier(id);
          if (response.ok) {
            await get().loadSuppliers();
            latsAnalytics.track('supplier_deleted', { supplierId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete supplier';
          set({ error: errorMsg });
          console.error('Error deleting supplier:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },

      // Products
      loadProducts: async (filters?: any) => {
        const state = get();

        // Prevent multiple simultaneous loads
        if (state.isDataLoading) {
          console.log('🔍 [useInventoryStore] Products already loading, skipping...');
          return;
        }
        
        console.log('🔍 [useInventoryStore] Starting products load...', { filters });

        // Ensure filters has default pagination values
        const safeFilters = {
          page: 1,
          limit: 100, // Increased from 50 to 100 to show more products
          ...filters
        };

        // Check cache if no filters applied and cache is valid
        // Temporarily disabled to test supplier data loading and ensure fresh data
        if (false && !filters && state.isCacheValid('products')) {
          console.log('🔍 [useInventoryStore] Using cached products (supplier data may be outdated)');

          set({ products: state.dataCache.products || [] });
          return;
        }
        
        // Force clear cache when loading products to ensure fresh data
        console.log('🔄 [useInventoryStore] Clearing product cache to ensure fresh data');
        set({ 
          dataCache: { ...state.dataCache, products: null },
          cacheTimestamp: 0 
        });
        
        console.log('🔍 [useInventoryStore] Cache check result:', {
          hasFilters: !!filters,
          isCacheValid: state.isCacheValid('products'),
          cacheDisabled: true,
          willLoadFromProvider: true
        });

        console.log('🔍 [useInventoryStore] Cache status:', {
          isCacheValid: state.isCacheValid('products'),
          cacheTimestamp: state.cacheTimestamp,
          currentTime: Date.now(),
          cacheAge: Date.now() - state.cacheTimestamp
        });
        set({ isLoading: true, error: null, isDataLoading: true });
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Products loading timeout after 30 seconds')), 30000);
        });
        
        try {
          const provider = getLatsProvider();

          // Race between the actual request and timeout
          const response = await Promise.race([
            provider.getProducts(safeFilters),
            timeoutPromise
          ]);

          if (response.ok) {
            // Handle paginated response structure
            const rawProducts = response.data?.data || response.data || [];

            // Validate data integrity before processing
            if (rawProducts.length > 0) {

              validateDataIntegrity(rawProducts, 'Products');
            }
            
            // Process and clean up product data to prevent HTTP 431 errors

            const processedProducts = processProductsOnly(rawProducts);

            // Update pagination info
            const paginationInfo = {
              currentPage: response.data?.page || 1,
              totalItems: response.data?.total || processedProducts.length,
              totalPages: response.data?.totalPages || 1,
              itemsPerPage: response.data?.limit || 100 // Increased from 50 to 100
            };

            // DEBUG: Log detailed product information from store
            console.log('🔍 [InventoryStore] DEBUG - Products loaded in store:', processedProducts.map(product => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              category: product.category,
              supplier: product.supplier,
              totalQuantity: product.totalQuantity,
              variants: product.variants,
              price: product.price,
              costPrice: product.costPrice,
              hasSupplier: !!product.supplier,
              hasCategory: !!product.category,
              hasVariants: product.variants && product.variants.length > 0
            })));
            
            // DEBUG: Check for missing information in store data
            const missingInfoCount = {
              supplier: 0,
              category: 0,
              variants: 0,
              price: 0,
              stock: 0
            };
            
            processedProducts.forEach(product => {
              if (!product.supplier) missingInfoCount.supplier++;
              if (!product.category) missingInfoCount.category++;
              if (!product.variants || product.variants.length === 0) missingInfoCount.variants++;
              if (!product.price || product.price === 0) missingInfoCount.price++;
              if (!product.totalQuantity || product.totalQuantity === 0) missingInfoCount.stock++;
            });
            
            console.log('🔍 [InventoryStore] DEBUG - Missing information in store:', {
              totalProducts: processedProducts.length,
              missingInfoCount,
              percentageMissing: {
                supplier: Math.round((missingInfoCount.supplier / processedProducts.length) * 100),
                category: Math.round((missingInfoCount.category / processedProducts.length) * 100),
                variants: Math.round((missingInfoCount.variants / processedProducts.length) * 100),
                price: Math.round((missingInfoCount.price / processedProducts.length) * 100),
                stock: Math.round((missingInfoCount.stock / processedProducts.length) * 100)
              }
            });

            set({ 
              products: processedProducts,
              ...paginationInfo,
              error: null // Clear any previous errors
            });
            
            // Only cache if no filters applied
            if (!filters) {
              get().updateCache('products', processedProducts);
            }
            
            latsAnalytics.track('products_loaded', { 
              count: processedProducts.length,
              page: paginationInfo.currentPage,
              total: paginationInfo.totalItems
            });
          } else {
            console.error('Provider returned error:', response.message);

            set({ error: response.message || 'Failed to load products' });
          }
        } catch (error) {
          console.error('Exception in loadProducts:', error);

          // Create fallback sample categories and products so the interface works

          // Create sample categories
          const fallbackCategories = [
            {
              id: 'sample-category',
              name: 'Electronics',
              description: 'Electronic devices and accessories',
              color: '#3B82F6',
              icon: '📱',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 1,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-category-2',
              name: 'Accessories',
              description: 'Phone and device accessories',
              color: '#10B981',
              icon: '🎧',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 2,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-category-3',
              name: 'Repair Parts',
              description: 'Repair and replacement parts',
              color: '#F59E0B',
              icon: '🔧',
              parent_id: null,
              isActive: true,
              is_active: true,
              sortOrder: 3,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          const fallbackProducts = [
            {
              id: 'sample-1',
              name: 'Sample iPhone 13',
              shortDescription: 'Sample iPhone 13 for testing',
              sku: 'IPH13-SAMPLE',
              categoryId: 'sample-category',
              supplierId: 'sample-supplier',
              images: [],
              isActive: true,
              totalQuantity: 10,
              totalValue: 50000,
              price: 50000,
              costPrice: 40000,
              priceRange: '50000',
              condition: 'new',
              internalNotes: 'Sample product for testing',
              attributes: { color: 'Black', storage: '128GB' },
              variants: [
                {
                  id: 'sample-variant-1',
                  productId: 'sample-1',
                  sku: 'IPH13-SAMPLE-BLK-128',
                  name: 'Black 128GB',
                  attributes: { color: 'Black', storage: '128GB' },
                  costPrice: 40000,
                  sellingPrice: 50000,
                  quantity: 10,
                  min_quantity: 1,
                  max_quantity: null,
                  weight: null,
                  dimensions: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-2',
              name: 'Sample Samsung Galaxy',
              shortDescription: 'Sample Samsung Galaxy for testing',
              sku: 'SAMSUNG-SAMPLE',
              categoryId: 'sample-category-2',
              supplierId: 'sample-supplier',
              images: [],
              isActive: true,
              totalQuantity: 15,
              totalValue: 45000,
              price: 45000,
              costPrice: 35000,
              priceRange: '45000',
              condition: 'new',
              internalNotes: 'Sample product for testing',
              attributes: { color: 'Blue', storage: '256GB' },
              variants: [
                {
                  id: 'sample-variant-2',
                  productId: 'sample-2',
                  sku: 'SAMSUNG-SAMPLE-BLU-256',
                  name: 'Blue 256GB',
                  attributes: { color: 'Blue', storage: '256GB' },
                  costPrice: 35000,
                  sellingPrice: 45000,
                  quantity: 15,
                  min_quantity: 1,
                  max_quantity: null,
                  weight: null,
                  dimensions: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'sample-3',
              name: 'Sample iPhone Screen',
              shortDescription: 'Sample iPhone screen replacement',
              sku: 'IPH-SCREEN-SAMPLE',
              categoryId: 'sample-category-3',
              supplierId: 'sample-supplier',
              images: [],
              isActive: true,
              totalQuantity: 5,
              totalValue: 25000,
              price: 25000,
              costPrice: 20000,
              priceRange: '25000',
              condition: 'new',
              internalNotes: 'Sample repair part for testing',
              attributes: { model: 'iPhone 13', color: 'Black' },
              variants: [
                {
                  id: 'sample-variant-3',
                  productId: 'sample-3',
                  sku: 'IPH-SCREEN-SAMPLE-BLK',
                  name: 'Black Screen',
                  attributes: { model: 'iPhone 13', color: 'Black' },
                  costPrice: 20000,
                  sellingPrice: 25000,
                  quantity: 5,
                  min_quantity: 1,
                  max_quantity: null,
                  weight: null,
                  dimensions: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          set({ 
            products: fallbackProducts,
            categories: fallbackCategories,
            error: 'Using sample products and categories due to database connection issue',
            isLoading: false,
            isDataLoading: false
          });

        } finally {

          set({ isLoading: false, isDataLoading: false });
        }
      },

      // Load product variants separately when needed
      loadProductVariants: async (productId: string) => {
        try {
          const provider = getLatsProvider();
          
          const response = await provider.getProductVariants(productId);
          
          if (response.ok) {
            return { ok: true, data: response.data };
          } else {
            console.error('Failed to load product variants:', response.message);
            return { ok: false, message: response.message };
          }
        } catch (error) {
          console.error('Exception in loadProductVariants:', error);
          return { ok: false, message: 'Failed to load product variants' };
        }
      },

      getProduct: async (id) => {
        try {
          const provider = getLatsProvider();
          return await provider.getProduct(id);
        } catch (error) {
          console.error('Error getting product:', error);
          return { ok: false, message: 'Failed to get product' };
        }
      },

      createProduct: async (product) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createProduct(product);
          
          if (response.ok) {
            // Clear products cache to force reload
            get().clearCache('products');
            await get().loadProducts();
            latsAnalytics.track('product_created', { productId: response.data?.id });
          } else {
            set({ error: response.message || 'Failed to create product' });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create product';
          console.error('Exception in createProduct:', error);
          set({ error: errorMsg });
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateProduct: async (id, product) => {
        set({ isUpdating: true, error: null });
        
        try {
          const provider = getLatsProvider();
          const response = await provider.updateProduct(id, product);
          
          if (response.ok) {
            await get().loadProducts();
            latsAnalytics.track('product_updated', { productId: id });
          } else {
            set({ error: response.message || 'Failed to update product' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update product';
          console.error('Error updating product:', error);
          set({ error: errorMsg });
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteProduct: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.deleteProduct(id);
          if (response.ok) {
            await get().loadProducts();
            latsAnalytics.track('product_deleted', { productId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete product';
          set({ error: errorMsg });
          console.error('Error deleting product:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },

      searchProducts: async (query) => {
        try {
          const provider = getLatsProvider();
          return await provider.searchProducts(query);
        } catch (error) {
          console.error('Error searching products:', error);
          return { ok: false, message: 'Failed to search products', data: [] };
        }
      },

      // Stock Management
      loadStockMovements: async () => {
        const state = get();
        
        // Check cache first
        if (state.isCacheValid('stockMovements')) {
          set({ stockMovements: state.dataCache.stockMovements || [] });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getStockMovements();
          if (response.ok) {
            const stockMovements = response.data || [];
            set({ stockMovements });
            get().updateCache('stockMovements', stockMovements);
            latsAnalytics.track('stock_movements_loaded', { count: stockMovements.length });
          } else {
            set({ error: response.message || 'Failed to load stock movements' });
          }
        } catch (error) {
          set({ error: 'Failed to load stock movements' });
          console.error('Error loading stock movements:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      adjustStock: async (productId, variantId, quantity, reason) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.adjustStock(productId, variantId, quantity, reason);
          if (response.ok) {
            await get().loadProducts();
            await get().loadStockMovements();
            latsAnalytics.track('stock_adjusted', { productId, variantId, quantity, reason });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to adjust stock';
          set({ error: errorMsg });
          console.error('Error adjusting stock:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      // Sales Data
      loadSales: async () => {
        const state = get();
        
        // Check cache first
        if (state.isCacheValid('sales')) {
          set({ sales: state.dataCache.sales || [] });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getSales();
          if (response.ok) {
            const sales = response.data || [];
            set({ sales });
            get().updateCache('sales', sales);
            latsAnalytics.track('sales_loaded', { count: sales.length });
          } else {
            set({ error: response.message || 'Failed to load sales' });
          }
        } catch (error) {
          set({ error: 'Failed to load sales' });
          console.error('Error loading sales:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      getProductSales: async (productId) => {
        try {
          const provider = getLatsProvider();
          return await provider.getProductSales(productId);
        } catch (error) {
          console.error('Error getting product sales:', error);
          return { ok: false, message: 'Failed to get product sales', data: [] };
        }
      },

      getSoldQuantity: (productId, variantId) => {
        const sales = get().sales;
        return sales.filter(sale => sale.product_id === productId && sale.variant_id === variantId).reduce((sum, sale) => sum + sale.quantity, 0);
      },

      // Purchase Orders
      loadPurchaseOrders: async () => {
        const state = get();
        // Prevent multiple simultaneous loads
        if (state.isLoading || state.isDataLoading) {
          return;
        }
        
        set({ isLoading: true, isDataLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getPurchaseOrders();
          if (response.ok) {
            set({ purchaseOrders: response.data || [] });
            latsAnalytics.track('purchase_orders_loaded', { count: response.data?.length || 0 });
          } else {
            set({ error: response.message || 'Failed to load purchase orders' });
          }
        } catch (error) {
          set({ error: 'Failed to load purchase orders' });
          console.error('Error loading purchase orders:', error);
        } finally {
          set({ isLoading: false, isDataLoading: false });
        }
      },

      getPurchaseOrder: async (id) => {
        try {
          if (!id) {
            console.error('❌ No purchase order ID provided');
            return { ok: false, message: 'Purchase order ID is required' };
          }

          const provider = getLatsProvider();
          const result = await provider.getPurchaseOrder(id);
          
          if (!result.ok) {
            console.error('❌ Provider error getting purchase order:', result.message);
          }
          
          return result;
        } catch (error) {
          console.error('❌ Store error getting purchase order:', error);
          
          // Provide more specific error messages
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              return { ok: false, message: 'Network error: Please check your internet connection' };
            } else if (error.message.includes('timeout')) {
              return { ok: false, message: 'Request timeout: Please try again' };
            } else {
              return { ok: false, message: `Error: ${error.message}` };
            }
          }
          
          return { ok: false, message: 'Failed to get purchase order: Unknown error occurred' };
        }
      },

      createPurchaseOrder: async (order) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createPurchaseOrder(order);
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_created', { orderId: response.data?.id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create purchase order';
          set({ error: errorMsg });
          console.error('Error creating purchase order:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updatePurchaseOrder: async (id, order) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updatePurchaseOrder(id, order);
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_updated', { orderId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update purchase order';
          set({ error: errorMsg });
          console.error('Error updating purchase order:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },


      receivePurchaseOrder: async (id) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.receivePurchaseOrder(id);
          if (response.ok) {
            await get().loadPurchaseOrders();
            await get().loadProducts();
            latsAnalytics.track('purchase_order_received', { orderId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to receive purchase order';
          set({ error: errorMsg });
          console.error('Error receiving purchase order:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      updatePurchaseOrderStatus: async (id, status) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updatePurchaseOrder(id, { status });
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_status_updated', { orderId: id, status });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update purchase order status';
          set({ error: errorMsg });
          console.error('Error updating purchase order status:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      approvePurchaseOrder: async (id: string) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updatePurchaseOrder(id, { 
            status: 'sent',
            approvedAt: new Date().toISOString(),
            approvedBy: get().currentUser?.id
          });
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_approved', { orderId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to approve purchase order';
          set({ error: errorMsg });
          console.error('Error approving purchase order:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deletePurchaseOrder: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.deletePurchaseOrder(id);
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_deleted', { orderId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete purchase order';
          set({ error: errorMsg });
          console.error('Error deleting purchase order:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },



      // Spare Parts
      loadSpareParts: async () => {

        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();

          const response = await provider.getSpareParts();

          if (response.ok) {
            const sparePartsData = response.data || [];

            set({ spareParts: sparePartsData });
            // Update cache
            get().updateCache('spareParts', sparePartsData);
            latsAnalytics.track('spare_parts_loaded', { count: sparePartsData.length });

          } else {
            console.error('❌ [DEBUG] loadSpareParts: Failed to load spare parts:', response.message);
            set({ error: response.message || 'Failed to load spare parts' });
          }
        } catch (error) {
          console.error('❌ [DEBUG] loadSpareParts: Error loading spare parts:', error);
          set({ error: 'Failed to load spare parts' });
        } finally {
          set({ isLoading: false });

        }
      },

      getSparePart: async (id) => {
        try {
          const provider = getLatsProvider();
          return await provider.getSparePart(id);
        } catch (error) {
          console.error('Error getting spare part:', error);
          return { ok: false, message: 'Failed to get spare part' };
        }
      },

      createSparePart: async (sparePart) => {
        set({ isCreating: true, error: null });
        try {
          const response = await createSparePartApi(sparePart);
          if (response.ok) {
            // Clear cache to force fresh data load
            get().clearCache('spareParts');
            await get().loadSpareParts();
            latsAnalytics.track('spare_part_created', { sparePartId: response.data?.id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create spare part';
          set({ error: errorMsg });
          console.error('Error creating spare part:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      createOrUpdateSparePart: async (sparePart) => {
        set({ isCreating: true, error: null });
        try {
          const response = await createOrUpdateSparePartApi(sparePart);
          if (response.ok) {

            // Clear cache to force fresh data load
            get().clearCache('spareParts');

            await get().loadSpareParts();

            latsAnalytics.track('spare_part_created_or_updated', { sparePartId: response.data?.id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create or update spare part';
          set({ error: errorMsg });
          console.error('Error creating or updating spare part:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateSparePart: async (id, sparePart) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await updateSparePartWithVariantsApi(id, sparePart);
          if (response.ok) {
            // Clear cache to force fresh data load
            get().clearCache('spareParts');
            await get().loadSpareParts();
            latsAnalytics.track('spare_part_updated', { sparePartId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update spare part';
          set({ error: errorMsg });
          console.error('Error updating spare part:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteSparePart: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const response = await deleteSparePartApi(id);
          if (response.ok) {
            await get().loadSpareParts();
            latsAnalytics.track('spare_part_deleted', { sparePartId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete spare part';
          set({ error: errorMsg });
          console.error('Error deleting spare part:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },

      useSparePart: async (id, quantity, reason, notes) => {
        set({ isUpdating: true, error: null });
        try {
          const usageData = {
            spare_part_id: id,
            quantity_used: quantity,
            reason,
            notes
          };
          const response = await recordSparePartUsageApi(usageData);
          if (response.ok) {
            await get().loadSpareParts();
            await get().loadSparePartUsage();
            latsAnalytics.track('spare_part_used', { sparePartId: id, quantity, reason });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to use spare part';
          set({ error: errorMsg });
          console.error('Error using spare part:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      loadSparePartUsage: async () => {
        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getSparePartUsage();
          if (response.ok) {
            set({ sparePartUsage: response.data || [] });
            latsAnalytics.track('spare_part_usage_loaded', { count: response.data?.length || 0 });
          } else {
            set({ error: response.message || 'Failed to load spare part usage' });
          }
        } catch (error) {
          set({ error: 'Failed to load spare part usage' });
          console.error('Error loading spare part usage:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Computed values
      getFilteredProducts: () => {
        const { products, searchTerm, selectedCategory, selectedSupplier, stockFilter } = get();
        
        return products.filter(product => {
          // Search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
              product.name.toLowerCase().includes(searchLower) ||
              product.description.toLowerCase().includes(searchLower) ||
              product.variants?.some(variant => 
                variant.sku?.toLowerCase().includes(searchLower)
              ) ||
              false;
            if (!matchesSearch) return false;
          }

          // Category filter
          if (selectedCategory && product.categoryId !== selectedCategory) {
            return false;
          }



          // Supplier filter
          if (selectedSupplier && product.supplierId !== selectedSupplier) {
            return false;
          }

          // Stock filter
          if (stockFilter !== 'all') {
            const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
            switch (stockFilter) {
              case 'in-stock':
                if (totalStock <= 0) return false;
                break;
              case 'low-stock':
                if (totalStock > 10) return false;
                break;
              case 'out-of-stock':
                if (totalStock > 0) return false;
                break;
            }
          }

          return true;
        });
      },

      getLowStockProducts: () => {
        const { products } = get();
        return products.filter(product => {
          const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return totalStock > 0 && totalStock <= 10;
        });
      },

      getOutOfStockProducts: () => {
        const { products } = get();
        return products.filter(product => {
          const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
          return totalStock <= 0;
        });
      },

      getProductById: (id) => {
        const { products } = get();
        
        // Validate and sanitize the ID parameter
        if (!id) {
          console.error('❌ getProductById: No ID provided');
          return undefined;
        }

        // Handle case where an object might be passed instead of a string
        if (typeof id === 'object') {
          console.error('❌ getProductById: Object passed instead of string ID:', id);
          return undefined;
        }

        // Convert to string and trim whitespace
        const sanitizedId = String(id).trim();
        
        if (!sanitizedId) {
          console.error('❌ getProductById: Empty ID after sanitization');
          return undefined;
        }

        return products.find(p => p.id === sanitizedId);
      },

      getCategoryById: (id) => {
        const { categories } = get();
        
        // Validate and sanitize the ID parameter
        if (!id || typeof id === 'object') {
          console.error('❌ getCategoryById: Invalid ID provided:', id);
          return undefined;
        }
        
        const sanitizedId = String(id).trim();
        return categories.find(c => c.id === sanitizedId);
      },



      getSupplierById: (id) => {
        const { suppliers } = get();
        
        // Validate and sanitize the ID parameter
        if (!id || typeof id === 'object') {
          console.error('❌ getSupplierById: Invalid ID provided:', id);
          return undefined;
        }
        
        const sanitizedId = String(id).trim();
        return suppliers.find(s => s.id === sanitizedId);
      }
    })),
    {
      name: 'lats-inventory-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Subscribe to events for real-time updates
latsEventBus.subscribeToAll((event) => {
  const store = useInventoryStore.getState();
  
  // Prevent infinite loops by checking if data is already loading
  if (store.isDataLoading) {
    return;
  }
  
  switch (event.type) {
    case 'lats:category.created':
    case 'lats:category.updated':
    case 'lats:category.deleted':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('categories')) {
        store.loadCategories();
      }
      break;
      
    case 'lats:supplier.created':
    case 'lats:supplier.updated':
    case 'lats:supplier.deleted':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('suppliers')) {
        store.loadSuppliers();
      }
      break;
      
    case 'lats:product.created':
    case 'lats:product.updated':
    case 'lats:product.deleted':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('products')) {
        store.loadProducts();
      }
      break;
      
    case 'lats:stock.updated':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('products')) {
        store.loadProducts();
      }
      if (!store.isCacheValid('stockMovements')) {
        store.loadStockMovements();
      }
      break;
      
    case 'lats:purchase-order.created':
    case 'lats:purchase-order.updated':
    case 'lats:purchase-order.received':
    case 'lats:purchase-order.deleted':
      // Temporarily disable purchase orders loading to prevent 400 errors
      // TODO: Re-enable when purchase orders tables are properly set up
      // store.loadPurchaseOrders();
      break;
      
    case 'lats:spare-part.created':
    case 'lats:spare-part.updated':
    case 'lats:spare-part.deleted':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('spareParts')) {
        store.loadSpareParts();
      }
      break;
      
    case 'lats:spare-part.used':
      // Only reload if not already loading and cache is stale
      if (!store.isCacheValid('spareParts')) {
        store.loadSpareParts();
      }
      if (!store.isCacheValid('sparePartUsage')) {
        store.loadSparePartUsage();
      }
      break;
      
    case 'lats:sale.completed':
      // Reload products and stock movements when a sale is completed
      if (!store.isCacheValid('products')) {
        store.loadProducts();
      }
      if (!store.isCacheValid('stockMovements')) {
        store.loadStockMovements();
      }
      if (!store.isCacheValid('sales')) {
        store.loadSales();
      }
      break;
  }
});
