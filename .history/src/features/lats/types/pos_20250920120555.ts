// POS Types

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableQuantity: number;
  image?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  soldBy: string;
  soldAt: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  profit: number;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  details?: {
    cardType?: string;
    last4?: string;
    mobileProvider?: string;
    reference?: string;
  };
  amount: number;
}

export interface ExternalProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

// QuickCash types removed - not using this functionality

export interface POSSettings {
  taxRate: number;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  enableBarcode: boolean;
  enableQuickCash: boolean; // Disabled - not using this functionality
  defaultPaymentMethod: PaymentMethod['type'];
}

export interface ProductSearchResult {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  variants: ProductSearchVariant[];
  images: string[];
  tags: string[];
  // Product specifications
  specification?: string;
  specifications?: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  attributes?: Record<string, any>;
  // Pricing information
  price?: number;
  costPrice?: number;
  // Product identifiers
  sku?: string;
  barcode?: string;
  // Supplier information
  supplier?: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  supplierId?: string;
  supplierName?: string;
  // Shelf information
  shelfName?: string;
  shelfCode?: string;
  storeLocationName?: string;
  storeLocationCity?: string;
  storageRoomName?: string;
  storageRoomCode?: string;
  isRefrigerated?: boolean;
  requiresLadder?: boolean;
  // Product status
  isActive?: boolean;
  isFeatured?: boolean;
  // Stock information
  stockQuantity?: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  // Additional metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface ProductSearchVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  sellingPrice: number;
  costPrice?: number;
  quantity: number;
  barcode?: string;
  isActive?: boolean;
  // Additional variant information
  description?: string;
  specifications?: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  // Stock status
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// Form types
export interface AddToCartData {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  itemId: string;
  quantity: number;
}

export interface ProcessSaleData {
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  discount?: number;
}

export interface ExternalProductData {
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Receipt types
export interface ReceiptData {
  sale: Sale;
  items: SaleItem[];
  storeInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  cashier: string;
  receiptNumber: string;
  date: string;
  time: string;
}

// Error types
export interface InsufficientStockError {
  code: 'INSUFFICIENT_STOCK';
  variantId: string;
  requestedQuantity: number;
  availableQuantity: number;
  productName: string;
  variantName: string;
}

// Event types
export interface POSEvent {
  type: 'cart.updated' | 'sale.completed' | 'stock.updated';
  data: any;
  timestamp: string;
}
