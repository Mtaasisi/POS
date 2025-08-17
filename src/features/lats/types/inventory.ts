// LATS Inventory Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  color?: string;
  website?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  id: string;
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  attributes: Record<string, any>;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  images?: string[];
  tags: string[];
  isActive: boolean;
  totalQuantity: number;
  totalValue: number;
  variants: ProductVariant[];
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
  // Add new fields from database
  condition?: string;
  storeShelf?: string;
  // Debut information
  debutDate?: string;
  debutNotes?: string;
  debutFeatures?: string[];
  metadata?: Record<string, any>;
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
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
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
  product?: Product;
  variant?: ProductVariant;
}

export interface SparePart {
  id: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  location?: string;
  isActive: boolean;
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

// Form Data Types
export interface ProductFormData {
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  images?: Array<{
    image_url: string;
    thumbnail_url?: string;
    file_name: string;
    file_size: number;
    is_primary: boolean;
  }>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  taxRate: number;
  // Debut information
  debutDate?: string;
  debutNotes?: string;
  debutFeatures?: string[];
  variants: Array<{
    sku: string;
    name: string;
    barcode?: string;
    price: number;
    costPrice: number;
    stockQuantity: number;
    minStockLevel: number;
    maxStockLevel?: number;
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    attributes?: Record<string, any>;
    isActive: boolean;
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

export interface BrandFormData {
  name: string;
  description?: string;
  logo?: string;
  color?: string;
  website?: string;
  isActive: boolean;
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
  brandId?: string;
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
  selectedBrands: string[];
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
