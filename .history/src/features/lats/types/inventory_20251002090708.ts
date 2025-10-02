// LATS Inventory Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}



export interface Supplier {
  id: string;
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  currency?: string; // Add currency field
  paymentTerms?: string;
  leadTimeDays: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // New performance fields
  leadTime?: number; // in days
  rating?: number; // 0-5
  totalOrders?: number;
  onTimeDeliveryRate?: number; // percentage
  qualityRating?: number; // 0-5
  
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string; // Make id required instead of optional
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  quantity: number; // Add missing quantity property
  minQuantity: number; // Add missing minQuantity property
  sellingPrice: number; // Add missing sellingPrice property
  condition?: string; // Add missing condition property
  isPrimary?: boolean; // Add missing isPrimary property
  attributes: Record<string, any>;
  images?: ProductImage[]; // Variant-specific images
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string; // Add missing description property

  categoryId: string;
  category?: Category; // Embedded category data from join
  supplierId?: string;
  supplier?: Supplier; // Embedded supplier data from join
  condition: string;
  internalNotes?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  status: 'draft' | 'active' | 'inactive'; // New status field for workflow
  isActive: boolean; // Add missing isActive property
  isFeatured: boolean; // Add missing isFeatured property
  totalQuantity: number; // Add missing totalQuantity property
  images: ProductImage[];
  variants: ProductVariant[];
  // Product-level specifications
  attributes?: Record<string, any>;
  metadata?: Record<string, any>; // Add missing metadata property
  weight?: number; // Add missing weight property
  length?: number; // Add missing length property
  width?: number; // Add missing width property
  height?: number; // Add missing height property
  shippingClass?: string; // Add missing shippingClass property
  requiresSpecialHandling?: boolean; // Add missing requiresSpecialHandling property
  shippingStatus?: string; // Add missing shippingStatus property
  trackingNumber?: string; // Add missing trackingNumber property
  expectedDelivery?: string; // Add missing expectedDelivery property
  shippingAgent?: string; // Add missing shippingAgent property
  createdAt: string;
  updatedAt: string;
  
  
  // New multi-currency fields
  usdPrice?: number;
  eurPrice?: number;
  exchangeRate?: number;
  baseCurrency?: string;
  
  // New purchase order fields
  lastOrderDate?: string;
  lastOrderQuantity?: number;
  pendingQuantity?: number;
  orderStatus?: 'sent' | 'received';
  
  
  // New storage fields
  storageRoomName?: string;
  shelfName?: string;
  storeLocationName?: string;
  isRefrigerated?: boolean;
  requiresLadder?: boolean;
  

}


export interface StockMovement {
  id: string;
  productId: string;
  variantId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'shipped' | 'partial_received' | 'received' | 'completed' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalAmount: number;
  currency?: string; // Currency used for the purchase order
  paymentTerms?: string; // Add missing paymentTerms property
  notes?: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
  // Payment tracking fields
  totalPaid?: number; // Total amount paid for this purchase order
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid'; // Payment status
  // Exchange rate tracking fields
  exchangeRate?: number; // Exchange rate from purchase currency to base currency
  baseCurrency?: string; // Base currency for the business (typically TZS)
  exchangeRateSource?: string; // Source of the exchange rate (manual, api, bank, etc.)
  exchangeRateDate?: string; // Date when the exchange rate was applied
  totalAmountBaseCurrency?: number; // Total amount converted to base currency
}


export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  totalPrice: number; // Add missing totalPrice property
  receivedQuantity: number;
  status?: 'pending' | 'processing' | 'shipped' | 'received' | 'cancelled';
  product?: Product;
  variant?: ProductVariant;
}

export interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  location?: string;
  compatibleDevices?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface SparePartUsage {
  id: string;
  sparePartId: string;
  quantity: number;
  reason: string;
  deviceId?: string;
  technicianId?: string;
  notes?: string;
  sparePart?: SparePart;
  createdAt: string;
}

// Individual item tracking for serialized inventory
export interface InventoryItem {
  id: string;
  variantId: string;
  serialNumber: string;

  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'returned';
  location?: string;
  shelf?: string;
  bin?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
export interface ProductFormData {
  name: string;
  shortDescription?: string;
  sku: string;

  categoryId: string | null; // Allow null for UUID fields
  supplierId?: string;
  internalNotes?: string;
  images?: Array<{
    image_url: string;
    thumbnail_url?: string;
    file_name: string;
    file_size: number;
    is_primary: boolean;
  }>;
  isActive: boolean;
  // Debut information
  debutDate?: string;
  debutNotes?: string;
  debutFeatures?: string[];
  // Product-level specifications
  attributes?: Record<string, any>;
  variants: Array<{
    sku: string;
    name: string;
  
    price: number;
    costPrice: number;
    stockQuantity: number;
    minStockLevel: number;
    attributes?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
}



export interface SupplierFormData {
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  currency?: string; // Add currency field
  paymentTerms?: string;
  leadTimeDays: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and Search Types
export interface InventoryFilters {
  searchTerm: string;
  categoryId?: string;
  supplierId?: string;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  statusFilter: 'all' | 'active' | 'inactive';
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Loading States
export interface LoadingStates {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isExporting: boolean;
  isImporting: boolean;
}

// Selection States
export interface SelectionState {
  selectedProducts: string[];
  selectedCategories: string[];

  selectedSuppliers: string[];
}

// Analytics Types
export interface InventoryMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalStock: number;
  totalSold: number;
  averagePrice: number;
  averageMargin: number;
}

export interface ProductAnalytics {
  productId: string;
  totalSold: number;
  totalRevenue: number;
  averageRating: number;
  views: number;
  conversionRate: number;
  stockTurnover: number;
}

// Purchase Order Form Data Types
export interface PurchaseOrderFormData {
  supplierId: string;
  expectedDelivery: string;
  notes?: string;
  currency?: string;
  paymentTerms?: string;
  status?: string;
  items: PurchaseOrderItemFormData[];
  // Exchange rate tracking fields
  exchangeRate?: number;
  baseCurrency?: string;
  exchangeRateSource?: string;
  exchangeRateDate?: string;
}

export interface PurchaseOrderItemFormData {
  id?: string; // Optional for new items, required for updates
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  notes?: string;
}
