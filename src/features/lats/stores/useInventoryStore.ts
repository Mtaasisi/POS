// Inventory store for LATS module using Zustand
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  Category, 
  Brand, 
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

interface InventoryState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Data
  categories: Category[];
  brands: Brand[];
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
  selectedBrand: string | null;
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
  setSelectedBrand: (brandId: string | null) => void;
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

  // Brands
  loadBrands: () => Promise<void>;
  createBrand: (brand: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Brand>>;
  updateBrand: (id: string, brand: Partial<Brand>) => Promise<ApiResponse<Brand>>;
  deleteBrand: (id: string) => Promise<ApiResponse<void>>;

  // Suppliers
  loadSuppliers: () => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Supplier>>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<ApiResponse<Supplier>>;
  deleteSupplier: (id: string) => Promise<ApiResponse<void>>;

  // Products
  loadProducts: () => Promise<void>;
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
  getBrandById: (id: string) => Brand | undefined;
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

      categories: [],
      brands: [],
      suppliers: [],
      products: [],
      sales: [],
      stockMovements: [],
      purchaseOrders: [],
      spareParts: [],
      sparePartUsage: [],

      searchTerm: '',
      selectedCategory: null,
      selectedBrand: null,
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
      setSelectedBrand: (brandId) => set({ selectedBrand: brandId, currentPage: 1 }),
      setSelectedSupplier: (supplierId) => set({ selectedSupplier: supplierId, currentPage: 1 }),
      setStockFilter: (filter) => set({ stockFilter: filter, currentPage: 1 }),
      clearFilters: () => set({
        searchTerm: '',
        selectedCategory: null,
        selectedBrand: null,
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

      // Categories
      loadCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔧 [DEBUG] Loading categories from LATS provider...');
          const provider = getLatsProvider();
          const response = await provider.getCategories();
          console.log('📊 [DEBUG] Categories response:', response);
          
          if (response.ok) {
            set({ categories: response.data || [] });
            latsAnalytics.track('categories_loaded', { count: response.data?.length || 0 });
            console.log('✅ [DEBUG] Categories loaded:', response.data?.length || 0);
          } else {
            console.error('❌ [DEBUG] Categories error:', response.message);
            set({ error: response.message || 'Failed to load categories' });
          }
        } catch (error) {
          console.error('💥 [DEBUG] Categories exception:', error);
          set({ error: 'Failed to load categories' });
        } finally {
          set({ isLoading: false });
        }
      },

      createCategory: async (category) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createCategory(category);
          if (response.ok) {
            // Reload categories to get the updated list
            await get().loadCategories();
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
            // Reload categories to get the updated list
            await get().loadCategories();
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
            // Reload categories to get the updated list
            await get().loadCategories();
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

      // Brands
      loadBrands: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔧 [DEBUG] Loading brands from LATS provider...');
          const provider = getLatsProvider();
          const response = await provider.getBrands();
          console.log('📊 [DEBUG] Brands response:', response);
          
          if (response.ok) {
            set({ brands: response.data || [] });
            latsAnalytics.track('brands_loaded', { count: response.data?.length || 0 });
            console.log('✅ [DEBUG] Brands loaded:', response.data?.length || 0);
          } else {
            console.error('❌ [DEBUG] Brands error:', response.message);
            set({ error: response.message || 'Failed to load brands' });
          }
        } catch (error) {
          console.error('💥 [DEBUG] Brands exception:', error);
          set({ error: 'Failed to load brands' });
        } finally {
          set({ isLoading: false });
        }
      },

      createBrand: async (brand) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createBrand(brand);
          if (response.ok) {
            await get().loadBrands();
            latsAnalytics.track('brand_created', { brandId: response.data?.id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create brand';
          set({ error: errorMsg });
          console.error('Error creating brand:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateBrand: async (id, brand) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updateBrand(id, brand);
          if (response.ok) {
            await get().loadBrands();
            latsAnalytics.track('brand_updated', { brandId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update brand';
          set({ error: errorMsg });
          console.error('Error updating brand:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteBrand: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.deleteBrand(id);
          if (response.ok) {
            await get().loadBrands();
            latsAnalytics.track('brand_deleted', { brandId: id });
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to delete brand';
          set({ error: errorMsg });
          console.error('Error deleting brand:', error);
          return { ok: false, message: errorMsg };
        } finally {
          set({ isDeleting: false });
        }
      },

      // Suppliers
      loadSuppliers: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔧 [DEBUG] Loading suppliers from LATS provider...');
          const provider = getLatsProvider();
          const response = await provider.getSuppliers();
          console.log('📊 [DEBUG] Suppliers response:', response);
          
          if (response.ok) {
            set({ suppliers: response.data || [] });
            latsAnalytics.track('suppliers_loaded', { count: response.data?.length || 0 });
            console.log('✅ [DEBUG] Suppliers loaded:', response.data?.length || 0);
          } else {
            console.error('❌ [DEBUG] Suppliers error:', response.message);
            set({ error: response.message || 'Failed to load suppliers' });
          }
        } catch (error) {
          console.error('💥 [DEBUG] Suppliers exception:', error);
          set({ error: 'Failed to load suppliers' });
        } finally {
          set({ isLoading: false });
        }
      },

      createSupplier: async (supplier) => {
        set({ isCreating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.createSupplier(supplier);
          if (response.ok) {
            await get().loadSuppliers();
            latsAnalytics.track('supplier_created', { supplierId: response.data?.id });
          }
          return response;
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
          const provider = getLatsProvider();
          const response = await provider.updateSupplier(id, supplier);
          if (response.ok) {
            await get().loadSuppliers();
            latsAnalytics.track('supplier_updated', { supplierId: id });
          }
          return response;
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
      loadProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔧 [DEBUG] Loading products from LATS provider...');
          const provider = getLatsProvider();
          console.log('✅ [DEBUG] Provider obtained');
          
          const response = await provider.getProducts();
          console.log('📊 [DEBUG] Provider response:', response);
          
          if (response.ok) {
            // Handle paginated response structure
            const products = response.data?.data || [];
            console.log('📦 [DEBUG] Products extracted:', products.length);
            console.log('📋 [DEBUG] Sample product:', products[0]);
            
            set({ products });
            latsAnalytics.track('products_loaded', { count: products.length });
            console.log('✅ [DEBUG] Products set in store');
          } else {
            console.error('❌ [DEBUG] Provider returned error:', response.message);
            set({ error: response.message || 'Failed to load products' });
          }
        } catch (error) {
          console.error('💥 [DEBUG] Exception in loadProducts:', error);
          set({ error: 'Failed to load products' });
        } finally {
          set({ isLoading: false });
          console.log('🔄 [DEBUG] Loading completed');
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
        console.log('🚀 [DEBUG] useInventoryStore.createProduct called');
        console.log('📦 [DEBUG] Product data:', product);
        
        set({ isCreating: true, error: null });
        try {
          console.log('🔧 [DEBUG] Getting LATS provider...');
          const provider = getLatsProvider();
          console.log('✅ [DEBUG] Provider obtained');
          
          console.log('📤 [DEBUG] Calling provider.createProduct...');
          const response = await provider.createProduct(product);
          console.log('📥 [DEBUG] Provider response:', response);
          
          if (response.ok) {
            console.log('✅ [DEBUG] Product created successfully');
            await get().loadProducts();
            latsAnalytics.track('product_created', { productId: response.data?.id });
          } else {
            console.log('❌ [DEBUG] Product creation failed:', response.message);
          }
          return response;
        } catch (error) {
          const errorMsg = 'Failed to create product';
          console.error('💥 [DEBUG] Exception in createProduct:', error);
          set({ error: errorMsg });
          return { ok: false, message: errorMsg };
        } finally {
          set({ isCreating: false });
        }
      },

      updateProduct: async (id, product) => {
        console.log('🔄 [DEBUG] useInventoryStore.updateProduct called');
        console.log('📋 [DEBUG] Product ID:', id);
        console.log('📦 [DEBUG] Product data:', product);
        
        set({ isUpdating: true, error: null });
        console.log('🔄 [DEBUG] Set isUpdating to true');
        
        try {
          console.log('🚀 [DEBUG] Getting LATS provider...');
          const provider = getLatsProvider();
          console.log('✅ [DEBUG] Provider obtained');
          
          console.log('🚀 [DEBUG] Calling provider.updateProduct...');
          const response = await provider.updateProduct(id, product);
          console.log('📊 [DEBUG] Provider response:', response);
          
          if (response.ok) {
            console.log('✅ [DEBUG] Update successful, reloading products...');
            await get().loadProducts();
            console.log('✅ [DEBUG] Products reloaded');
            latsAnalytics.track('product_updated', { productId: id });
            console.log('📊 [DEBUG] Analytics tracked');
          } else {
            console.log('❌ [DEBUG] Update failed:', response.message);
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update product';
          console.error('💥 [DEBUG] Exception in updateProduct:', error);
          set({ error: errorMsg });
          return { ok: false, message: errorMsg };
        } finally {
          console.log('🔄 [DEBUG] Setting isUpdating to false');
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
        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getStockMovements();
          if (response.ok) {
            set({ stockMovements: response.data || [] });
            latsAnalytics.track('stock_movements_loaded', { count: response.data?.length || 0 });
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
        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getSales();
          if (response.ok) {
            set({ sales: response.data || [] });
            latsAnalytics.track('sales_loaded', { count: response.data?.length || 0 });
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
        const { products, searchTerm, selectedCategory, selectedBrand, selectedSupplier, stockFilter } = get();
        
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

          // Brand filter
          if (selectedBrand && product.brandId !== selectedBrand) {
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

      getBrandById: (id) => {
        const { brands } = get();
        
        // Validate and sanitize the ID parameter
        if (!id || typeof id === 'object') {
          console.error('❌ getBrandById: Invalid ID provided:', id);
          return undefined;
        }
        
        const sanitizedId = String(id).trim();
        return brands.find(b => b.id === sanitizedId);
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
  
  switch (event.type) {
    case 'lats:category.created':
    case 'lats:category.updated':
    case 'lats:category.deleted':
      store.loadCategories();
      break;
      
    case 'lats:brand.created':
    case 'lats:brand.updated':
    case 'lats:brand.deleted':
      store.loadBrands();
      break;
      
    case 'lats:supplier.created':
    case 'lats:supplier.updated':
    case 'lats:supplier.deleted':
      store.loadSuppliers();
      break;
      
    case 'lats:product.created':
    case 'lats:product.updated':
    case 'lats:product.deleted':
      store.loadProducts();
      break;
      
    case 'lats:stock.updated':
      store.loadProducts();
      store.loadStockMovements();
      break;
      
    case 'lats:purchase-order.created':
    case 'lats:purchase-order.updated':
    case 'lats:purchase-order.received':
    case 'lats:purchase-order.deleted':
      store.loadPurchaseOrders();
      break;
      
    case 'lats:spare-part.created':
    case 'lats:spare-part.updated':
    case 'lats:spare-part.deleted':
      store.loadSpareParts();
      break;
      
    case 'lats:spare-part.used':
      store.loadSpareParts();
      store.loadSparePartUsage();
      break;
  }
});
