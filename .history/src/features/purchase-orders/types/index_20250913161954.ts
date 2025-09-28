// Purchase Orders Module Types
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  totalPaid?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  expectedDelivery: string;
  actualDelivery?: string;
  paymentTerms: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  shippedItems?: ShippedItem[];
  payments?: PurchaseOrderPayment[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
  notes?: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface ShippedItem {
  id: string;
  purchaseOrderId: string;
  purchaseOrderItemId: string;
  quantity: number;
  shippedDate: string;
  trackingNumber?: string;
  notes?: string;
  receivedDate?: string;
  receivedQuantity?: number;
  damageReport?: string;
  status: ShippedItemStatus;
}

export interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  currency?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  images?: string[];
  variants?: ProductVariant[];
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name?: string;
  sku: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseCartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  currentStock?: number;
  category?: string;
  images?: string[];
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
export type ShippedItemStatus = 'shipped' | 'in_transit' | 'delivered' | 'damaged' | 'lost';

export interface POFilters {
  searchQuery: string;
  statusFilter: PurchaseOrderStatus | 'all';
  supplierFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'createdAt' | 'orderNumber' | 'totalAmount' | 'expectedDelivery';
  sortOrder: 'asc' | 'desc';
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  description?: string;
}

export interface PurchaseOrderPayment {
  id: string;
  purchaseOrderId: string;
  paymentAccountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId: string;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}
