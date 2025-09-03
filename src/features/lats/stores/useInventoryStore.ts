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
  SparePart,
  SparePartUsage,
  ApiResponse,
  PaginatedResponse 
} from '../types/inventory';
import { getLatsProvider } from '../lib/data/provider';
import { latsEventBus, LatsEventType } from '../lib/data/eventBus';
import { latsAnalyticsService as latsAnalytics } from '../lib/analytics';
import { supabase } from '../../../lib/supabaseClient';
import { processLatsData, validateDataIntegrity, emergencyDataCleanup } from '../lib/dataProcessor';
import { categoryService } from '../lib/categoryService';
import { 
  getActiveSuppliers as getActiveSuppliersApi, 
  createSupplier as createSupplierApi, 
  updateSupplier as updateSupplierApi 
} from '../../../lib/supplierApi';

interface InventoryState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Prevent multiple simultaneous loads
  isDataLoading: boolean;
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
  updatePurchaseOrderShipping: (id: string, shippingInfo: any) => Promise<ApiResponse<PurchaseOrder>>;
  receivePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;
  deletePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;

  // Spare Parts
  loadSpareParts: () => Promise<void>;
  getSparePart: (id: string) => Promise<ApiResponse<SparePart>>;
  createSparePart: (sparePart: any) => Promise<ApiResponse<SparePart>>;
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
      isSuppliersLoading: false,
      lastDataLoadTime: 0,

      // Cache management
      dataCache: {
        categories: null,
        suppliers: null,
        products: null,
        stockMovements: null,
        sales: null,
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
        return state.dataCache[dataType] !== null && cacheAge < state.CACHE_DURATION;
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
        console.log('📂 Inventory Store: loadCategories called');
        const state = get();
        
        // Check cache first
        if (state.isCacheValid('categories')) {
          console.log('📂 Inventory Store: Using cached categories');
          set({ categories: state.dataCache.categories || [] });
          return;
        }

        // Prevent multiple simultaneous loads
        if (state.isDataLoading) {
          console.log('📂 Inventory Store: Data already loading, skipping');
          return;
        }

        console.log('📂 Inventory Store: Loading categories from service');
        set({ isLoading: true, isDataLoading: true, error: null });
        try {
          // Use optimized category service
          const categories = await categoryService.getCategories();
          console.log('📂 Inventory Store: Categories received from service:', categories.length);
          
          // Validate and process categories
          if (categories.length > 0) {
            validateDataIntegrity(categories, 'Categories');
          }
          const processedCategories = processLatsData({ categories }).categories;
          console.log('📂 Inventory Store: Processed categories:', processedCategories.length);
          
          set({ 
            categories: processedCategories, 
            lastDataLoadTime: Date.now(),
            error: null // Clear any previous errors
          });
          get().updateCache('categories', processedCategories);
          latsAnalytics.track('categories_loaded', { count: processedCategories.length });
          console.log('📂 Inventory Store: Categories loaded successfully');
        } catch (error) {
          console.error('Categories exception:', error);
          set({ error: 'Failed to load categories' });
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
          // Race between actual fetch and timeout
          const suppliers = await Promise.race([
            getActiveSuppliersApi(),
            timeoutPromise
          ]);
          
          // Optimized processing - minimal validation for suppliers
          const processedSuppliers = suppliers.map(supplier => ({
            ...supplier,
            name: supplier.name || 'Unnamed Supplier'
          }));
          
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
        console.log('🔍 DEBUG: loadProducts called with filters:', filters);
        const state = get();

        // Prevent multiple simultaneous loads
        if (state.isDataLoading) {
          console.log('🔍 DEBUG: Data already loading, skipping...');
          return;
        }

        // Ensure filters has default pagination values
        const safeFilters = {
          page: 1,
          limit: 50,
          ...filters
        };
        console.log('🔍 DEBUG: Safe filters:', safeFilters);

        // Check cache if no filters applied and cache is valid
        if (!filters && state.isCacheValid('products')) {
          console.log('🔍 DEBUG: Using cached products');
          set({ products: state.dataCache.products || [] });
          return;
        }

        console.log('🔍 DEBUG: Loading products from provider...');
        set({ isLoading: true, error: null, isDataLoading: true });
        try {
          const provider = getLatsProvider();
          
          console.log('🔍 DEBUG: Calling provider.getProducts...');
          const response = await provider.getProducts(safeFilters);
          console.log('🔍 DEBUG: Provider response:', {
            ok: response.ok,
            message: response.message,
            dataLength: response.data?.data?.length || response.data?.length || 0
          });
          
          if (response.ok) {
            // Handle paginated response structure
            const rawProducts = response.data?.data || response.data || [];
            console.log('🔍 DEBUG: Raw products from response:', rawProducts.length);
            
            // Validate data integrity before processing
            if (rawProducts.length > 0) {
              console.log('🔍 DEBUG: Validating data integrity...');
              validateDataIntegrity(rawProducts, 'Products');
            }
            
            // Process and clean up product data to prevent HTTP 431 errors
            console.log('🔍 DEBUG: Processing products...');
            const processedProducts = processLatsData({ products: rawProducts }).products;
            console.log('🔍 DEBUG: Processed products:', processedProducts.length);
            
            // Update pagination info
            const paginationInfo = {
              currentPage: response.data?.page || 1,
              totalItems: response.data?.total || processedProducts.length,
              totalPages: response.data?.totalPages || 1,
              itemsPerPage: response.data?.limit || 50
            };
            
            console.log('🔍 DEBUG: Setting store state with products:', {
              productsCount: processedProducts.length,
              paginationInfo
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
            console.log('🔍 DEBUG: Setting error state:', response.message);
            set({ error: response.message || 'Failed to load products' });
          }
        } catch (error) {
          console.error('Exception in loadProducts:', error);
          console.log('🔍 DEBUG: Setting error state due to exception');
          set({ error: 'Failed to load products' });
        } finally {
          console.log('🔍 DEBUG: Finishing loadProducts, setting loading to false');
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
        set({ isLoading: true, error: null });
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
          set({ isLoading: false });
        }
      },

      getPurchaseOrder: async (id) => {
        try {
          const provider = getLatsProvider();
          return await provider.getPurchaseOrder(id);
        } catch (error) {
          console.error('Error getting purchase order:', error);
          return { ok: false, message: 'Failed to get purchase order' };
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

      updatePurchaseOrderShipping: async (id, shippingInfo) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updatePurchaseOrder(id, {
            status: 'shipped',
            shippingInfo,
            shippingDate: new Date().toISOString()
          });
          if (response.ok) {
            await get().loadPurchaseOrders();
            latsAnalytics.track('purchase_order_shipped', { 
              orderId: id, 
              carrier: shippingInfo.carrier,
              trackingNumber: shippingInfo.trackingNumber 
            });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update shipping information';
          set({ error: errorMsg });
          console.error('Error updating shipping info:', error);
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
            set({ spareParts: response.data || [] });
            latsAnalytics.track('spare_parts_loaded', { count: response.data?.length || 0 });
          } else {
            set({ error: response.message || 'Failed to load spare parts' });
          }
        } catch (error) {
          set({ error: 'Failed to load spare parts' });
          console.error('Error loading spare parts:', error);
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
          const provider = getLatsProvider();
          const response = await provider.createSparePart(sparePart);
          if (response.ok) {
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

      updateSparePart: async (id, sparePart) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updateSparePart(id, sparePart);
          if (response.ok) {
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
          const provider = getLatsProvider();
          const response = await provider.deleteSparePart(id);
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
          const provider = getLatsProvider();
          const usageData = {
            spare_part_id: id,
            quantity,
            reason,
            notes,
            used_by: (await supabase.auth.getUser()).data.user?.id
          };
          const response = await provider.useSparePart(usageData);
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
  }
});
