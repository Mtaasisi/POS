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

// Shipping Agents Types
export interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  role: 'manager' | 'sales' | 'support' | 'operations' | 'other';
  isPrimary: boolean;
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  officeType: 'office' | 'warehouse' | 'branch' | 'headquarters';
  isMainOffice: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ShippingAgent {
  id: string;
  name: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
  // Contact information
  phone?: string;
  whatsapp?: string;
  // Shipping capabilities
  supportedShippingTypes: string[]; // ['air', 'sea', 'local']
  // Business info
  address?: string;
  city?: string;
  country?: string;
  // Contacts
  contacts: Contact[];
  // Office locations
  offices: OfficeLocation[];
  // Service details
  serviceAreas: string[]; // ['domestic', 'international', 'regional']
  specializations: string[]; // ['electronics', 'fragile', 'bulk', 'express']
  // Pricing and terms
  pricePerCBM?: number;
  pricePerKg?: number;
  averageDeliveryTime?: string;
  // Additional info
  notes?: string;
  rating?: number;
  totalShipments?: number;
}

export interface ShippingManager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  isActive: boolean;
}

export interface ContactFormData {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  role: 'manager' | 'sales' | 'support' | 'operations' | 'other';
  isPrimary: boolean;
}

export interface OfficeFormData {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  officeType: 'office' | 'warehouse' | 'branch' | 'headquarters';
  isMainOffice: boolean;
}

export interface AgentFormData {
  name: string;
  company: string;
  isActive: boolean;
  // Contact information
  phone: string;
  whatsapp: string;
  // Shipping capabilities
  supportedShippingTypes: string[];
  // Business info
  address: string;
  city: string;
  country: string;
  // Contacts
  contacts: ContactFormData[];
  // Office locations
  offices: OfficeFormData[];
  // Service details
  serviceAreas: string[];
  specializations: string[];
  // Pricing and terms
  pricePerCBM: string;
  pricePerKg: string;
  averageDeliveryTime: string;
  // Additional info
  notes: string;
}

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
  updateProductVariantCostPrice(variantId: string, costPrice: number): Promise<ApiResponse<any>>;
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
  getAllSaleItems(): Promise<ApiResponse<any[]>>;

  // Shipping Agents
  getShippingAgents(): Promise<ApiResponse<ShippingAgent[]>>;
  getShippingAgent(id: string): Promise<ApiResponse<ShippingAgent>>;
  createShippingAgent(data: AgentFormData): Promise<ApiResponse<ShippingAgent>>;
  updateShippingAgent(id: string, data: AgentFormData): Promise<ApiResponse<ShippingAgent>>;
  deleteShippingAgent(id: string): Promise<ApiResponse<void>>;
  toggleShippingAgentStatus(id: string): Promise<ApiResponse<ShippingAgent>>;
  getShippingManagers(): Promise<ApiResponse<ShippingManager[]>>;
}

// Provider factory
export const getLatsProvider = (): LatsDataProvider => {
  const mode = import.meta.env.VITE_LATS_DATA_MODE || 'supabase';
  
  console.log('🔧 LATS Data Provider Mode:', mode);
  
  console.log('📊 Using Supabase provider for real database');
  return supabaseProvider;
};
