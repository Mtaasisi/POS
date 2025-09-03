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
  paymentTerms?: string;
  leadTimeDays: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  name: string;

  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  attributes: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;

  categoryId: string;
  category?: Category; // Embedded category data from join
  supplierId?: string;
  condition: string;
  internalNotes?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  images: ProductImage[];
  variants: ProductVariant[];
  // Product-level specifications
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  status: 'draft' | 'sent' | 'confirmed' | 'processing' | 'shipping' | 'shipped' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  shippedDate?: string;
  trackingNumber?: string;
  carrier?: string;
  shippingNotes?: string;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  receivedQuantity: number;
  status?: 'pending' | 'processing' | 'shipping' | 'shipped' | 'delivered' | 'cancelled';
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

  categoryId: string;
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
