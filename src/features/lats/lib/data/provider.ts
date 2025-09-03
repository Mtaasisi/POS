import { 
  Category, Supplier, Product, ProductVariant, StockMovement,
  PurchaseOrder, SparePart, SparePartUsage,
  CategoryFormData, SupplierFormData, ProductFormData,
  PurchaseOrderFormData, ApiResponse, PaginatedResponse
} from '../../types/inventory';
import { 
  Cart, Sale, CartItem, ProcessSaleData, ProductSearchResult,
  InsufficientStockError, POSSettings
} from '../../types/pos';

import supabaseProvider from './provider.supabase';

// Data Provider Interface
export interface LatsDataProvider {
  // Categories
  getCategories(): Promise<ApiResponse<Category[]>>;
  createCategory(data: CategoryFormData): Promise<ApiResponse<Category>>;
  updateCategory(id: string, data: CategoryFormData): Promise<ApiResponse<Category>>;
  deleteCategory(id: string): Promise<ApiResponse<void>>;



  // Suppliers
  getSuppliers(): Promise<ApiResponse<Supplier[]>>;
  createSupplier(data: SupplierFormData): Promise<ApiResponse<Supplier>>;
  updateSupplier(id: string, data: SupplierFormData): Promise<ApiResponse<Supplier>>;
  deleteSupplier(id: string): Promise<ApiResponse<void>>;

  // Products
  getProducts(filters?: any): Promise<ApiResponse<PaginatedResponse<Product>>>;
  getProduct(id: string): Promise<ApiResponse<Product>>;
  getProductVariants(productId: string): Promise<ApiResponse<ProductVariant[]>>;
  createProduct(data: ProductFormData): Promise<ApiResponse<Product>>;
  updateProduct(id: string, data: ProductFormData): Promise<ApiResponse<Product>>;
  deleteProduct(id: string): Promise<ApiResponse<void>>;
  searchProducts(query: string): Promise<ApiResponse<ProductSearchResult[]>>;

  // Stock Management
  adjustStock(
    productId: string, 
    variantId: string, 
    quantity: number, 
    reason: string,
    reference?: string
  ): Promise<ApiResponse<StockMovement>>;
  getStockMovements(productId?: string): Promise<ApiResponse<StockMovement[]>>;

  // Purchase Orders
  getPurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>>;
  getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>>;
  createPurchaseOrder(data: PurchaseOrderFormData): Promise<ApiResponse<PurchaseOrder>>;
  updatePurchaseOrder(id: string, data: Partial<PurchaseOrderFormData & {
    status?: string;
    trackingNumber?: string;
    shippingStatus?: string;
    estimatedDelivery?: string;
    shippingNotes?: string;
    shippedDate?: string;
    deliveredDate?: string;
  }>): Promise<ApiResponse<PurchaseOrder>>;
  receivePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>>;
  deletePurchaseOrder(id: string): Promise<ApiResponse<void>>;

  // Spare Parts
  getSpareParts(): Promise<ApiResponse<SparePart[]>>;
  getSparePart(id: string): Promise<ApiResponse<SparePart>>;
  createSparePart(data: any): Promise<ApiResponse<SparePart>>;
  updateSparePart(id: string, data: any): Promise<ApiResponse<SparePart>>;
  deleteSparePart(id: string): Promise<ApiResponse<void>>;
  useSparePart(data: {
    spare_part_id: string;
    quantity: number;
    reason: string;
    notes?: string;
    used_by?: string;
  }): Promise<ApiResponse<SparePartUsage>>;
  getSparePartUsage(): Promise<ApiResponse<SparePartUsage[]>>;

  // POS
  getCart(): Promise<ApiResponse<Cart>>;
  addToCart(data: any): Promise<ApiResponse<Cart>>;
  updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>>;
  removeFromCart(itemId: string): Promise<ApiResponse<Cart>>;
  clearCart(): Promise<ApiResponse<Cart>>;
  processSale(data: ProcessSaleData): Promise<ApiResponse<Sale | InsufficientStockError>>;
  getSales(): Promise<ApiResponse<Sale[]>>;
  getSale(id: string): Promise<ApiResponse<Sale>>;
  getPOSSettings(): Promise<ApiResponse<POSSettings>>;
  updatePOSSettings(settings: Partial<POSSettings>): Promise<ApiResponse<POSSettings>>;

  // Analytics
  getInventoryStats(): Promise<ApiResponse<any>>;
  getSalesStats(): Promise<ApiResponse<any>>;
  getLowStockItems(): Promise<ApiResponse<Product[]>>;
  getSaleItems(): Promise<ApiResponse<any[]>>;
}

// Provider factory
export const getLatsProvider = (): LatsDataProvider => {
  const mode = import.meta.env.VITE_LATS_DATA_MODE || 'supabase';
  
  console.log('🔧 LATS Data Provider Mode:', mode);
  
  console.log('📊 Using Supabase provider for real database');
  return supabaseProvider;
};
