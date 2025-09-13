// Purchase Orders Store - Dedicated store for PO module
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  ShippedItem, 
  Supplier, 
  Product, 
  Category,
  PurchaseCartItem,
  POFilters,
  Currency,
  ApiResponse 
} from '../types';
import { purchaseOrderDraftService, PurchaseOrderDraft } from '../lib/draftService';

interface PurchaseOrderState {
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Purchase Orders data
  purchaseOrders: PurchaseOrder[];
  currentPO: PurchaseOrder | null;
  shippedItems: ShippedItem[];
  
  // Current cart state
  cartItems: PurchaseCartItem[];
  selectedSupplier: Supplier | null;
  selectedCurrency: Currency;
  expectedDelivery: string;
  paymentTerms: string;
  notes: string;

  // Filters and UI state
  filters: POFilters;
  selectedOrders: string[];

  // Actions - Purchase Orders
  loadPurchaseOrders: () => Promise<void>;
  getPurchaseOrder: (id: string) => Promise<void>;
  createPurchaseOrder: (orderData: any) => Promise<ApiResponse<PurchaseOrder>>;
  updatePurchaseOrder: (id: string, orderData: any) => Promise<ApiResponse<PurchaseOrder>>;
  deletePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;
  receivePurchaseOrder: (id: string) => Promise<ApiResponse<void>>;

  // Actions - Shipped Items
  loadShippedItems: (purchaseOrderId: string) => Promise<void>;
  updateShippedItem: (id: string, data: Partial<ShippedItem>) => Promise<void>;
  markItemAsReceived: (shippedItemId: string, receivedQuantity: number, notes?: string) => Promise<void>;
  reportDamage: (shippedItemId: string, damageReport: string) => Promise<void>;

  // Cart management
  addToCart: (product: Product, variant: any, quantity: number) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  updateCartItemCostPrice: (itemId: string, costPrice: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Supplier management
  setSupplier: (supplier: Supplier | null) => void;
  
  // UI state management
  updateFilters: (filters: Partial<POFilters>) => void;
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: () => void;
  deselectAllOrders: () => void;

  // Draft management
  saveDraft: (name: string, notes?: string) => string | null;
  loadDraft: (draft: PurchaseOrderDraft) => void;
  autoSaveDraft: () => string | null;
  clearDrafts: () => void;

  // Computed values
  getFilteredPurchaseOrders: () => PurchaseOrder[];
  getCartTotal: () => { subtotal: number; tax: number; total: number };
}

export const usePurchaseOrderStore = create<PurchaseOrderState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,

      purchaseOrders: [],
      currentPO: null,
      shippedItems: [],
      
      cartItems: [],
      selectedSupplier: null,
      selectedCurrency: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
      expectedDelivery: '',
      paymentTerms: 'net_30',
      notes: '',

      filters: {
        searchQuery: '',
        statusFilter: 'all',
        supplierFilter: '',
        dateRange: { start: '', end: '' },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      selectedOrders: [],

      // Purchase Orders actions
      loadPurchaseOrders: async () => {
        set({ isLoading: true, error: null });
        try {
          // Use the existing inventory store method
          const inventoryStore = useInventoryStore.getState();
          await inventoryStore.loadPurchaseOrders();
          
          // Get the purchase orders from the inventory store
          const { purchaseOrders } = inventoryStore;
          set({ purchaseOrders, isLoading: false });
        } catch (error) {
          console.error('Error loading purchase orders:', error);
          set({ error: 'Failed to load purchase orders', isLoading: false });
        }
      },

      getPurchaseOrder: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          if (!id) {
            const errorMsg = 'Purchase order ID is required';
            set({ error: errorMsg, isLoading: false });
            return;
          }

          console.log('🔍 DEBUG: Getting purchase order with ID:', id);
          
          const inventoryStore = useInventoryStore.getState();
          const response = await inventoryStore.getPurchaseOrder(id);
          
          if (response.ok && response.data) {
            console.log('✅ DEBUG: Purchase order loaded successfully:', response.data.id);
            set({ currentPO: response.data, isLoading: false });
          } else {
            const errorMsg = response.message || 'Failed to get purchase order';
            console.error('❌ DEBUG: Failed to get purchase order:', errorMsg);
            set({ error: errorMsg, isLoading: false });
          }
        } catch (error) {
          console.error('❌ DEBUG: Exception getting purchase order:', error);
          
          let errorMsg = 'Failed to get purchase order';
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              errorMsg = 'Network error: Please check your internet connection';
            } else if (error.message.includes('timeout')) {
              errorMsg = 'Request timeout: Please try again';
            } else {
              errorMsg = `Error: ${error.message}`;
            }
          }
          
          set({ error: errorMsg, isLoading: false });
        }
      },

      createPurchaseOrder: async (orderData: any) => {
        set({ isCreating: true, error: null });
        try {
          const inventoryStore = useInventoryStore.getState();
          const response = await inventoryStore.createPurchaseOrder(orderData);
          
          if (response.ok) {
            // Reload purchase orders
            await get().loadPurchaseOrders();
            // Clear cart after successful creation
            get().clearCart();
          }
          
          set({ isCreating: false });
          return response;
        } catch (error) {
          console.error('Error creating purchase order:', error);
          set({ error: 'Failed to create purchase order', isCreating: false });
          return { ok: false, message: 'Failed to create purchase order' };
        }
      },

      updatePurchaseOrder: async (id: string, orderData: any) => {
        set({ isUpdating: true, error: null });
        try {
          const inventoryStore = useInventoryStore.getState();
          const response = await inventoryStore.updatePurchaseOrder(id, orderData);
          
          if (response.ok) {
            await get().loadPurchaseOrders();
          }
          
          set({ isUpdating: false });
          return response;
        } catch (error) {
          console.error('Error updating purchase order:', error);
          set({ error: 'Failed to update purchase order', isUpdating: false });
          return { ok: false, message: 'Failed to update purchase order' };
        }
      },

      deletePurchaseOrder: async (id: string) => {
        set({ isDeleting: true, error: null });
        try {
          const inventoryStore = useInventoryStore.getState();
          const response = await inventoryStore.deletePurchaseOrder(id);
          
          if (response.ok) {
            await get().loadPurchaseOrders();
          }
          
          set({ isDeleting: false });
          return response;
        } catch (error) {
          console.error('Error deleting purchase order:', error);
          set({ error: 'Failed to delete purchase order', isDeleting: false });
          return { ok: false, message: 'Failed to delete purchase order' };
        }
      },

      receivePurchaseOrder: async (id: string) => {
        set({ isUpdating: true, error: null });
        try {
          const inventoryStore = useInventoryStore.getState();
          const response = await inventoryStore.receivePurchaseOrder(id);
          
          if (response.ok) {
            await get().loadPurchaseOrders();
          }
          
          set({ isUpdating: false });
          return response;
        } catch (error) {
          console.error('Error receiving purchase order:', error);
          set({ error: 'Failed to receive purchase order', isUpdating: false });
          return { ok: false, message: 'Failed to receive purchase order' };
        }
      },

      // Shipped Items actions (placeholder for future implementation)
      loadShippedItems: async (purchaseOrderId: string) => {
        // TODO: Implement shipped items loading
        console.log('Loading shipped items for PO:', purchaseOrderId);
      },

      updateShippedItem: async (id: string, data: Partial<ShippedItem>) => {
        // TODO: Implement shipped item update
        console.log('Updating shipped item:', id, data);
      },

      markItemAsReceived: async (shippedItemId: string, receivedQuantity: number, notes?: string) => {
        // TODO: Implement mark as received
        console.log('Marking item as received:', shippedItemId, receivedQuantity, notes);
      },

      reportDamage: async (shippedItemId: string, damageReport: string) => {
        // TODO: Implement damage reporting
        console.log('Reporting damage:', shippedItemId, damageReport);
      },

      // Cart management
      addToCart: (product: Product, variant: any, quantity: number = 1) => {
        const costPrice = variant.costPrice || product.price * 0.7;
        
        set(state => {
          const existingItem = state.cartItems.find(item => 
            item.productId === product.id && item.variantId === variant.id
          );
          
          if (existingItem) {
            return {
              cartItems: state.cartItems.map(item =>
                item.id === existingItem.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      totalPrice: (item.quantity + quantity) * costPrice
                    }
                  : item
              )
            };
          } else {
            const newItem: PurchaseCartItem = {
              id: `${product.id}-${variant.id}-${Date.now()}`,
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              variantName: variant.name,
              sku: variant.sku,
              costPrice,
              quantity,
              totalPrice: costPrice * quantity,
              currentStock: variant.stockQuantity,
              category: product.categoryName,
              images: product.images || []
            };
            return { cartItems: [...state.cartItems, newItem] };
          }
        });
      },

      updateCartItemQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        set(state => ({
          cartItems: state.cartItems.map(item =>
            item.id === itemId
              ? { ...item, quantity, totalPrice: quantity * item.costPrice }
              : item
          )
        }));
      },

      updateCartItemCostPrice: (itemId: string, costPrice: number) => {
        set(state => ({
          cartItems: state.cartItems.map(item =>
            item.id === itemId
              ? { ...item, costPrice, totalPrice: item.quantity * costPrice }
              : item
          )
        }));
      },

      removeFromCart: (itemId: string) => {
        set(state => ({
          cartItems: state.cartItems.filter(item => item.id !== itemId)
        }));
      },

      clearCart: () => {
        set({ 
          cartItems: [], 
          selectedSupplier: null,
          expectedDelivery: '',
          notes: ''
        });
      },

      // Supplier management
      setSupplier: (supplier: Supplier | null) => {
        set({ selectedSupplier: supplier });
      },

      // UI state management
      updateFilters: (newFilters: Partial<POFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      toggleOrderSelection: (orderId: string) => {
        set(state => ({
          selectedOrders: state.selectedOrders.includes(orderId)
            ? state.selectedOrders.filter(id => id !== orderId)
            : [...state.selectedOrders, orderId]
        }));
      },

      selectAllOrders: () => {
        set(state => ({
          selectedOrders: state.purchaseOrders.map(po => po.id)
        }));
      },

      deselectAllOrders: () => {
        set({ selectedOrders: [] });
      },

      // Computed values
      getFilteredPurchaseOrders: () => {
        const { purchaseOrders, filters } = get();
        let filtered = [...purchaseOrders];

        // Search filter
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(po =>
            po.orderNumber.toLowerCase().includes(query) ||
            po.supplier?.name.toLowerCase().includes(query) ||
            po.notes?.toLowerCase().includes(query)
          );
        }

        // Status filter
        if (filters.statusFilter !== 'all') {
          filtered = filtered.filter(po => po.status === filters.statusFilter);
        }

        // Supplier filter
        if (filters.supplierFilter) {
          filtered = filtered.filter(po => po.supplierId === filters.supplierFilter);
        }

        // Date range filter
        if (filters.dateRange.start || filters.dateRange.end) {
          filtered = filtered.filter(po => {
            const poDate = new Date(po.createdAt);
            const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
            const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
            
            if (start && poDate < start) return false;
            if (end && poDate > end) return false;
            return true;
          });
        }

        // Sorting
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'orderNumber':
              aValue = a.orderNumber;
              bValue = b.orderNumber;
              break;
            case 'totalAmount':
              aValue = a.totalAmount;
              bValue = b.totalAmount;
              break;
            case 'expectedDelivery':
              aValue = new Date(a.expectedDelivery).getTime();
              bValue = new Date(b.expectedDelivery).getTime();
              break;
            default:
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
          }
          
          if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        return filtered;
      },

      getCartTotal: () => {
        const { cartItems } = get();
        const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.18; // 18% tax rate
        const total = subtotal + tax;
        
        return { subtotal, tax, total };
      },

      // Draft management functions
      saveDraft: (name: string, notes?: string) => {
        const { cartItems, selectedSupplier, selectedCurrency, expectedDelivery, paymentTerms } = get();
        
        try {
          const draftId = purchaseOrderDraftService.saveDraft(
            name,
            cartItems,
            selectedSupplier,
            selectedCurrency,
            expectedDelivery,
            paymentTerms,
            notes || get().notes
          );
          return draftId;
        } catch (error) {
          console.error('Failed to save draft:', error);
          return null;
        }
      },

      loadDraft: (draft: PurchaseOrderDraft) => {
        set({
          cartItems: draft.cartItems || [],
          selectedSupplier: draft.supplier,
          selectedCurrency: draft.currency || { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
          expectedDelivery: draft.expectedDelivery || '',
          paymentTerms: draft.paymentTerms || 'net_30',
          notes: draft.notes || ''
        });
      },

      autoSaveDraft: () => {
        const { cartItems, selectedSupplier, selectedCurrency, expectedDelivery, paymentTerms, notes } = get();
        
        // Only auto-save if there are items in cart
        if (cartItems.length === 0) {
          return null;
        }

        try {
          return purchaseOrderDraftService.autoSave(
            cartItems,
            selectedSupplier,
            selectedCurrency,
            expectedDelivery,
            paymentTerms,
            notes
          );
        } catch (error) {
          console.error('Auto-save failed:', error);
          return null;
        }
      },

      clearDrafts: () => {
        purchaseOrderDraftService.clearAllDrafts();
      }
    })),
    {
      name: 'purchase-order-store'
    }
  )
);
