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
  id?: string;
  sku: string;
  name: string;
  barcode?: string;
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
  barcode?: string;
  categoryId: string;
  brandId?: string;
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
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
  shipping?: ShippingInfo;
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

// Form Data Types
export interface ProductFormData {
  name: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
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
    barcode?: string;
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

// Form Data Types for Purchase Orders
export interface PurchaseOrderFormData {
  supplierId: string;
  expectedDelivery: string;
  notes: string;
  items: PurchaseOrderItemFormData[];
  shipping?: ShippingFormData;
}

export interface PurchaseOrderItemFormData {
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  notes: string;
}

// Shipping and Tracking Types
export interface ShippingAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  isActive: boolean;
  managerId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  agents: string[]; // Agent IDs under this manager
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  logo?: string;
  trackingUrl: string;
  isActive: boolean;
  supportedServices: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ShippingInfo {
  id: string;
  purchaseOrderId: string;
  carrierId: string;
  trackingNumber: string;
  agentId: string;
  managerId: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery: string;
  actualDelivery?: string;
  cost: number;
  notes?: string;
  trackingEvents: ShippingEvent[];
  carrier?: ShippingCarrier;
  agent?: ShippingAgent;
  manager?: ShippingManager;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingEvent {
  id: string;
  shippingId: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  notes?: string;
  createdBy?: string;
}

export interface ShippingSettings {
  id: string;
  autoAssignAgents: boolean;
  defaultCarrierId: string;
  enableTracking: boolean;
  enableNotifications: boolean;
  notificationChannels: ('email' | 'sms' | 'whatsapp')[];
  trackingUpdateInterval: number; // minutes
  defaultShippingCost: number;
  autoUpdateStatus: boolean;
  requireSignature: boolean;
  enableInsurance: boolean;
  maxShippingCost: number;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types for Shipping
export interface ShippingFormData {
  carrierId: string;
  agentId: string;
  managerId: string;
  trackingNumber: string;
  estimatedDelivery: string;
  cost: number;
  notes?: string;
  requireSignature: boolean;
  enableInsurance: boolean;
}

export interface ShippingAgentFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  managerId?: string;
  isActive: boolean;
}

export interface ShippingManagerFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  isActive: boolean;
}

export interface ShippingCarrierFormData {
  name: string;
  code: string;
  trackingUrl: string;
  supportedServices: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isActive: boolean;
}
