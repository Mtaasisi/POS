// POS store for LATS module using Zustand
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  Cart, 
  CartItem, 
  Sale, 
  SaleItem, 
  PaymentMethod, 
  ExternalProduct,
  POSSettings,
  ProductSearchResult,
  ReceiptData,
  InsufficientStockError,
  POSEvent,
  ApiResponse 
} from '../types/pos';
import { getLatsProvider } from '../lib/data/provider';
import { latsEventBus, LatsEventType } from '../lib/data/eventBus';
import { latsAnalyticsService as latsAnalytics } from '../lib/analytics';
import { format } from '../lib/format';

interface POSState {
  // Loading states
  isLoading: boolean;
  isProcessing: boolean;
  isSearching: boolean;

  // Cart state
  cart: Cart;
  cartItems: CartItem[];

  // Sales history
  sales: Sale[];
  recentSales: Sale[];

  // Search and products
  searchResults: ProductSearchResult[];
  searchTerm: string;
  isSearchingProducts: boolean;

  // Payment methods
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: string | null;

  // QuickCash feature removed - not using this functionality

  // POS Settings
  settings: POSSettings;

  // Receipt
  currentReceipt: ReceiptData | null;
  showReceipt: boolean;

  // Error handling
  error: string | null;
  insufficientStockError: InsufficientStockError | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setInsufficientStockError: (error: InsufficientStockError | null) => void;

  // Cart actions
  addToCart: (product: any, quantity: number, variantId?: string) => Promise<ApiResponse<void>>;
  updateCartItem: (itemId: string, quantity: number) => Promise<ApiResponse<void>>;
  removeFromCart: (itemId: string) => Promise<ApiResponse<void>>;
  clearCart: () => Promise<ApiResponse<void>>;
  updateCartTotals: () => void;

  // Product search
  searchProducts: (query: string) => Promise<ApiResponse<ProductSearchResult[]>>;
  clearSearchResults: () => void;
  setSearchTerm: (term: string) => void;

  // Payment
  setPaymentMethod: (methodId: string) => void;
  processPayment: (amount: number, methodId: string, change?: number) => Promise<ApiResponse<void>>;
  processSale: (saleData: any) => Promise<ApiResponse<Sale>>;
  voidSale: (saleId: string, reason: string) => Promise<ApiResponse<void>>;
  refundSale: (saleId: string, items: string[], reason: string) => Promise<ApiResponse<void>>;

  // Sales history
  loadSales: () => Promise<void>;
  loadRecentSales: () => Promise<void>;
  getSale: (id: string) => Promise<ApiResponse<Sale>>;

  // Settings
  loadPOSSettings: () => Promise<void>;
  updatePOSSettings: (settings: Partial<POSSettings>) => Promise<ApiResponse<void>>;

  // Receipt
  generateReceipt: (sale: Sale) => void;
  printReceipt: () => void;
  hideReceipt: () => void;

  // External products
  addExternalProduct: (product: ExternalProduct) => Promise<ApiResponse<void>>;
  removeExternalProduct: (itemId: string) => Promise<ApiResponse<void>>;

  // QuickCash methods removed - not using this functionality

  // Computed values
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getCartTax: () => number;
  getCartDiscount: () => number;
  getCartItemCount: () => number;
  getCartItemById: (itemId: string) => CartItem | undefined;
  getPaymentMethodById: (methodId: string) => PaymentMethod | undefined;
  getSaleById: (saleId: string) => Sale | undefined;
  getDailySales: () => Sale[];
  getWeeklySales: () => Sale[];
  getMonthlySales: () => Sale[];
  getSalesStats: () => {
    totalSales: number;
    totalRevenue: number;
    averageSale: number;
    totalItems: number;
  };
}

export const usePOSStore = create<POSState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isLoading: false,
      isProcessing: false,
      isSearching: false,

      cart: {
        id: 'current-cart',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      cartItems: [],

      sales: [],
      recentSales: [],

      searchResults: [],
      searchTerm: '',
      isSearchingProducts: false,

      paymentMethods: [],
      selectedPaymentMethod: null,

      // QuickCash amounts removed - not using this functionality

      settings: {
        taxRate: 0.16,
        currency: 'TZS',
        receiptHeader: 'LATS POS System',
        receiptFooter: 'Thank you for your business!',
        enableBarcodeScanning: true,
        enableQuickCash: false, // Disabled - not using this functionality
        enableDiscounts: true,
        enableTax: true,
        defaultPaymentMethod: 'cash',
        receiptPrinter: 'default',
        language: 'en'
      },

      currentReceipt: null,
      showReceipt: false,

      error: null,
      insufficientStockError: null,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setInsufficientStockError: (error) => set({ insufficientStockError: error }),

      // Cart actions
      addToCart: async (product, quantity, variantId) => {
        try {
          const provider = getLatsProvider();
          const response = await provider.addToCart({ productId: product.id, variantId, quantity });
          
          if (response.ok) {
            // Update cart state
            const { cart } = response.data;
            set({ 
              cart: cart || get().cart,
              cartItems: cart?.items || [],
              error: null 
            });
            
            latsAnalytics.track('item_added_to_cart', { 
              productId: product.id, 
              quantity, 
              variantId 
            });
          } else {
            set({ error: response.message || 'Failed to add item to cart' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to add item to cart';
          set({ error: errorMsg });
          console.error('Error adding to cart:', error);
          return { ok: false, message: errorMsg };
        }
      },

      updateCartItem: async (itemId, quantity) => {
        try {
          const provider = getLatsProvider();
          const response = await provider.updateCartItem(itemId, quantity);
          
          if (response.ok) {
            const { cart } = response.data;
            set({ 
              cart: cart || get().cart,
              cartItems: cart?.items || [],
              error: null 
            });
            
            latsAnalytics.track('cart_item_updated', { itemId, quantity });
          } else {
            set({ error: response.message || 'Failed to update cart item' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update cart item';
          set({ error: errorMsg });
          console.error('Error updating cart item:', error);
          return { ok: false, message: errorMsg };
        }
      },

      removeFromCart: async (itemId) => {
        try {
          const provider = getLatsProvider();
          const response = await provider.removeFromCart(itemId);
          
          if (response.ok) {
            const { cart } = response.data;
            set({ 
              cart: cart || get().cart,
              cartItems: cart?.items || [],
              error: null 
            });
            
            latsAnalytics.track('item_removed_from_cart', { itemId });
          } else {
            set({ error: response.message || 'Failed to remove item from cart' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to remove item from cart';
          set({ error: errorMsg });
          console.error('Error removing from cart:', error);
          return { ok: false, message: errorMsg };
        }
      },

      clearCart: async () => {
        try {
          const provider = getLatsProvider();
          const response = await provider.clearCart();
          
          if (response.ok) {
            const { cart } = response.data;
            set({ 
              cart: cart || get().cart,
              cartItems: cart?.items || [],
              error: null 
            });
            
            latsAnalytics.track('cart_cleared');
          } else {
            set({ error: response.message || 'Failed to clear cart' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to clear cart';
          set({ error: errorMsg });
          console.error('Error clearing cart:', error);
          return { ok: false, message: errorMsg };
        }
      },

      updateCartTotals: () => {
        const { cartItems, settings } = get();
        const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const tax = settings.enableTax ? subtotal * settings.taxRate : 0;
        const discount = 0; // TODO: Implement discount logic
        const total = subtotal + tax - discount;

        set(state => ({
          cart: {
            ...state.cart,
            subtotal,
            tax,
            discount,
            total,
            updatedAt: new Date().toISOString()
          }
        }));
      },

      // Product search
      searchProducts: async (query) => {
        set({ isSearchingProducts: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.searchProducts(query);
          
          if (response.ok) {
            set({ 
              searchResults: response.data || [],
              isSearchingProducts: false 
            });
            
            latsAnalytics.track('products_searched', { 
              query, 
              resultsCount: response.data?.length || 0 
            });
          } else {
            set({ 
              error: response.message || 'Failed to search products',
              isSearchingProducts: false 
            });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to search products';
          set({ 
            error: errorMsg,
            isSearchingProducts: false 
          });
          console.error('Error searching products:', error);
          return { ok: false, message: errorMsg, data: [] };
        }
      },

      clearSearchResults: () => set({ searchResults: [], searchTerm: '' }),
      setSearchTerm: (term) => set({ searchTerm: term }),

      // Payment
      setPaymentMethod: (methodId) => set({ selectedPaymentMethod: methodId }),

      processPayment: async (amount, methodId, change = 0) => {
        set({ isProcessing: true, error: null });
        try {
          // In a real implementation, you would integrate with a payment processor

          // Process payment immediately
          
          latsAnalytics.track('payment_processed', { amount, methodId, change });
          
          set({ isProcessing: false });
          return { ok: true, message: 'Payment processed successfully' };
        } catch (error) {
          const errorMsg = 'Failed to process payment';
          set({ error: errorMsg, isProcessing: false });
          console.error('Error processing payment:', error);
          return { ok: false, message: errorMsg };
        }
      },

      processSale: async (saleData) => {
        set({ isProcessing: true, error: null, insufficientStockError: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.processSale(saleData);
          
          if (response.ok) {
            const sale = response.data;
            
            // Clear cart after successful sale
            await get().clearCart();
            
            // Generate receipt
            get().generateReceipt(sale);
            
            // Reload sales
            await get().loadRecentSales();
            
            latsAnalytics.track('sale_completed', { 
              saleId: sale.id,
              total: sale.total,
              itemCount: sale.items.length 
            });
          } else {
            if (response.code === 'INSUFFICIENT_STOCK') {
              set({ insufficientStockError: response.data });
            } else {
              set({ error: response.message || 'Failed to process sale' });
            }
          }
          
          set({ isProcessing: false });
          return response;
        } catch (error) {
          const errorMsg = 'Failed to process sale';
          set({ error: errorMsg, isProcessing: false });
          console.error('Error processing sale:', error);
          return { ok: false, message: errorMsg };
        }
      },

      voidSale: async (saleId, reason) => {
        set({ isProcessing: true, error: null });
        try {
          // In a real implementation, you would call the provider

          // Simulate voiding
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Reload sales
          await get().loadRecentSales();
          
          latsAnalytics.track('sale_voided', { saleId, reason });
          
          set({ isProcessing: false });
          return { ok: true, message: 'Sale voided successfully' };
        } catch (error) {
          const errorMsg = 'Failed to void sale';
          set({ error: errorMsg, isProcessing: false });
          console.error('Error voiding sale:', error);
          return { ok: false, message: errorMsg };
        }
      },

      refundSale: async (saleId, items, reason) => {
        set({ isProcessing: true, error: null });
        try {
          // In a real implementation, you would call the provider

          // Process refund immediately
          
          // Reload sales
          await get().loadRecentSales();
          
          latsAnalytics.track('sale_refunded', { saleId, items, reason });
          
          set({ isProcessing: false });
          return { ok: true, message: 'Sale refunded successfully' };
        } catch (error) {
          const errorMsg = 'Failed to refund sale';
          set({ error: errorMsg, isProcessing: false });
          console.error('Error refunding sale:', error);
          return { ok: false, message: errorMsg };
        }
      },

      // Sales history
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

      loadRecentSales: async () => {
        try {
          const provider = getLatsProvider();
          const response = await provider.getSales();
          
          if (response.ok) {
            // Get recent sales (last 10)
            const recentSales = (response.data || []).slice(0, 10);
            set({ recentSales });
          }
        } catch (error) {
          console.error('Error loading recent sales:', error);
        }
      },

      getSale: async (id) => {
        try {
          const provider = getLatsProvider();
          return await provider.getSale(id);
        } catch (error) {
          console.error('Error getting sale:', error);
          return { ok: false, message: 'Failed to get sale' };
        }
      },

      // Settings
      loadPOSSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.getPOSSettings();
          
          if (response.ok) {
            set({ settings: response.data || get().settings });
          } else {
            set({ error: response.message || 'Failed to load POS settings' });
          }
        } catch (error) {
          set({ error: 'Failed to load POS settings' });
          console.error('Error loading POS settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updatePOSSettings: async (settings) => {
        set({ isUpdating: true, error: null });
        try {
          const provider = getLatsProvider();
          const response = await provider.updatePOSSettings(settings);
          
          if (response.ok) {
            set(state => ({ 
              settings: { ...state.settings, ...settings },
              isUpdating: false 
            }));
            
            latsAnalytics.track('pos_settings_updated', { settings });
          } else {
            set({ error: response.message || 'Failed to update POS settings' });
          }
          
          return response;
        } catch (error) {
          const errorMsg = 'Failed to update POS settings';
          set({ error: errorMsg, isUpdating: false });
          console.error('Error updating POS settings:', error);
          return { ok: false, message: errorMsg };
        }
      },

      // Receipt
      generateReceipt: (sale) => {
        const receipt: ReceiptData = {
          saleId: sale.id,
          date: sale.createdAt,
          items: sale.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.total
          })),
          subtotal: sale.subtotal,
          tax: sale.tax,
          discount: sale.discount,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          cashier: sale.cashier || 'System',
          header: get().settings.receiptHeader,
          footer: get().settings.receiptFooter
        };
        
        set({ currentReceipt: receipt, showReceipt: true });
      },

      printReceipt: () => {
        const { currentReceipt } = get();
        if (currentReceipt) {
          // In a real implementation, you would send to printer

          window.print();
          
          latsAnalytics.track('receipt_printed', { saleId: currentReceipt.saleId });
        }
      },

      hideReceipt: () => set({ showReceipt: false, currentReceipt: null }),

      // External products
      addExternalProduct: async (product) => {
        try {
          // Handle external products locally since provider doesn't support them yet
          const { cart, cartItems } = get();
          const externalItem = {
            id: `external-${Date.now()}`,
            productId: 'external',
            variantId: 'external',
            productName: product.name,
            variantName: 'External Product',
            sku: 'EXT-001',
            quantity: 1,
            unitPrice: product.price,
            totalPrice: product.price,
            availableQuantity: 999,
            image: product.image || '/images/external-product.jpg'
          };
          
          const newCart = {
            ...cart,
            items: [...cartItems, externalItem],
            updatedAt: new Date().toISOString()
          };
          
          set({ 
            cart: newCart,
            cartItems: newCart.items,
            error: null 
          });
          
          get().updateCartTotals();
          
          latsAnalytics.track('external_product_added', { product });
          return { ok: true, data: newCart };
        } catch (error) {
          const errorMsg = 'Failed to add external product';
          set({ error: errorMsg });
          console.error('Error adding external product:', error);
          return { ok: false, message: errorMsg };
        }
      },

      removeExternalProduct: async (itemId) => {
        return get().removeFromCart(itemId);
      },

      // QuickCash methods removed - not using this functionality

      // Computed values
      getCartTotal: () => get().cart.total,
      getCartSubtotal: () => get().cart.subtotal,
      getCartTax: () => get().cart.tax,
      getCartDiscount: () => get().cart.discount,
      getCartItemCount: () => get().cartItems.length,

      getCartItemById: (itemId) => {
        const { cartItems } = get();
        return cartItems.find(item => item.id === itemId);
      },

      getPaymentMethodById: (methodId) => {
        const { paymentMethods } = get();
        return paymentMethods.find(method => method.id === methodId);
      },

      getSaleById: (saleId) => {
        const { sales } = get();
        return sales.find(sale => sale.id === saleId);
      },

      getDailySales: () => {
        const { sales } = get();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        return sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= startOfDay;
        });
      },

      getWeeklySales: () => {
        const { sales } = get();
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        
        return sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= startOfWeek;
        });
      },

      getMonthlySales: () => {
        const { sales } = get();
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        return sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= startOfMonth;
        });
      },

      getSalesStats: () => {
        const { sales } = get();
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
        
        return {
          totalSales,
          totalRevenue,
          averageSale,
          totalItems
        };
      }
    })),
    {
      name: 'lats-pos-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Subscribe to events for real-time updates
latsEventBus.subscribeToAll((event) => {
  const store = usePOSStore.getState();
  
  switch (event.type) {
    case 'lats:cart.updated':
      // Cart is already updated by the provider
      break;
      
    case 'lats:sale.completed':
      store.loadRecentSales();
      break;
      
    case 'lats:stock.updated':
      // Refresh search results if needed when stock is updated
      if (store.searchTerm) {
        store.searchProducts(store.searchTerm);
      }
      break;
      
    case 'lats:pos.inventory.updated':
      // Refresh search results if needed
      if (store.searchTerm) {
        store.searchProducts(store.searchTerm);
      }
      break;
  }
});
