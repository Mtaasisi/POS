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
  
  // New shipping cost fields
  defaultShippingCost?: number;
  shippingCostPerKg?: number;
  shippingCostPerCbm?: number;
  minimumShippingCost?: number;
  freeShippingThreshold?: number;
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
  supplier?: Supplier; // Embedded supplier data from join
  condition: string;
  internalNotes?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  status: 'draft' | 'active' | 'inactive'; // New status field for workflow
  images: ProductImage[];
  variants: ProductVariant[];
  // Product-level specifications
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // New shipping fields
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  cbm?: number;
  shippingClass?: 'standard' | 'fragile' | 'hazardous' | 'oversized';
  requiresSpecialHandling?: boolean;
  
  // New multi-currency fields
  usdPrice?: number;
  eurPrice?: number;
  exchangeRate?: number;
  baseCurrency?: string;
  
  // New purchase order fields
  lastOrderDate?: string;
  lastOrderQuantity?: number;
  pendingQuantity?: number;
  orderStatus?: 'draft' | 'sent' | 'confirmed' | 'processing' | 'shipping' | 'shipped' | 'received' | 'cancelled';
  
  // New shipping status fields
  shippingStatus?: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  trackingNumber?: string;
  expectedDelivery?: string;
  shippingAgent?: string;
  shippingCarrier?: string;
  
  // New storage fields
  storageRoomName?: string;
  shelfName?: string;
  storeLocationName?: string;
  isRefrigerated?: boolean;
  requiresLadder?: boolean;
  
  // New shipping cost fields
  shippingCost?: number;
  freightCost?: number;
  deliveryCost?: number;
  insuranceCost?: number;
  customsCost?: number;
  handlingCost?: number;
  totalShippingCost?: number;
  shippingCostCurrency?: string;
  shippingCostPerUnit?: number;
  shippingCostPerKg?: number;
  shippingCostPerCbm?: number;

  // Shipping info from lats_shipping_info table
  shippingInfo?: ShippingInfo[];
}

export interface ShippingInfo {
  id: string;
  trackingNumber?: string;
  carrierName?: string;
  shippingAgent?: string;
  shippingManager?: string;
  originAddress?: string;
  originCity?: string;
  originCountry?: string;
  destinationAddress?: string;
  destinationCity?: string;
  destinationCountry?: string;
  shippingStatus?: string;
  shippedDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingCost?: number;
  freightCost?: number;
  deliveryCost?: number;
  insuranceCost?: number;
  customsCost?: number;
  handlingCost?: number;
  totalShippingCost?: number;
  shippingCostCurrency?: string;
  packageWeight?: number;
  packageLength?: number;
  packageWidth?: number;
  packageHeight?: number;
  packageCbm?: number;
  packageCount?: number;
  requiresSpecialHandling?: boolean;
  isFragile?: boolean;
  isHazardous?: boolean;
  temperatureControlled?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  status: 'draft' | 'sent' | 'confirmed' | 'processing' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalAmount: number;
  currency?: string; // Currency used for the purchase order
  notes?: string;
  items: PurchaseOrderItem[];
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
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
  receivedQuantity: number;
  status?: 'pending' | 'processing' | 'received' | 'cancelled';
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
  shippingInfo?: {
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    contact?: string;
    method?: string;
    notes?: string;
    trackingNumber?: string;
    estimatedCost?: number;
    carrier?: string;
    requireSignature?: boolean;
    enableInsurance?: boolean;
    insuranceValue?: number;
    // Internal shipping fields
    internalRef?: string;
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
    internalStatus?: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered';
    agent?: string;
    assignedDate?: string;
    pickupDate?: string;
    deliveryAttempts?: number;
    actualCost?: number;
    internalNotes?: string;
    shippingType?: string;
    // Air shipping fields
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    departureTime?: string;
    arrivalTime?: string;
    // Sea shipping fields
    vesselName?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    departureDate?: string;
    arrivalDate?: string;
    containerNumber?: string;
  };
}

export interface PurchaseOrderItemFormData {
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  notes?: string;
}
