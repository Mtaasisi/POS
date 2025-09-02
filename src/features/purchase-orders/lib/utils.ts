// Purchase Order Utility Functions
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

// Supported currencies for international suppliers
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', flag: '🇷🇼' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' }
];

// Payment Terms
export const PAYMENT_TERMS = [
  { id: 'net_15', name: 'Net 15', description: 'Payment due in 15 days' },
  { id: 'net_30', name: 'Net 30', description: 'Payment due in 30 days' },
  { id: 'net_45', name: 'Net 45', description: 'Payment due in 45 days' },
  { id: 'net_60', name: 'Net 60', description: 'Payment due in 60 days' },
  { id: 'advance', name: 'Advance Payment', description: 'Payment before delivery' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Payment on delivery' },
  { id: '2_10_net_30', name: '2/10 Net 30', description: '2% discount if paid within 10 days, net 30' }
];

// Purchase Order Status Types
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'partial_received' | 'received' | 'cancelled';

// Centralized money formatting function
export const formatMoney = (amount: number, currency: Currency) => {
  if (currency.code === 'TZS') {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
  }
  
  return `${currency.symbol}${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Centralized date formatting
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Centralized time formatting
export const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Generate purchase order number
export const generatePONumber = () => {
  return `PO-${Date.now().toString().slice(-6)}`;
};

// Validation functions
export const validatePurchaseOrder = (
  supplier: any, 
  cartItems: any[], 
  expectedDelivery: string, 
  paymentTerms: string
) => {
  const errors: string[] = [];
  
  if (!supplier) errors.push('Please select a supplier');
  if (cartItems.length === 0) errors.push('Please add items to the purchase order');
  if (!expectedDelivery) errors.push('Please set expected delivery date');
  if (!paymentTerms) errors.push('Please select payment terms');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate purchase order totals
export const calculatePOTotals = (items: any[], taxRate: number = 0.18) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

// Format purchase order status for display
export const formatPOStatus = (status: PurchaseOrderStatus) => {
  const statusMap = {
    'draft': 'Draft',
    'pending_approval': 'Pending Approval',
    'approved': 'Approved',
    'sent': 'Sent',
    'confirmed': 'Confirmed',
    'partial_received': 'Partially Received',
    'received': 'Received',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
};

// Get status color for UI
export const getStatusColor = (status: PurchaseOrderStatus) => {
  const colorMap = {
    'draft': 'bg-gray-100 text-gray-800',
    'pending_approval': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-blue-100 text-blue-800',
    'sent': 'bg-indigo-100 text-indigo-800',
    'confirmed': 'bg-purple-100 text-purple-800',
    'partial_received': 'bg-orange-100 text-orange-800',
    'received': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Calculate days until delivery
export const getDaysUntilDelivery = (expectedDelivery: string) => {
  const today = new Date();
  const deliveryDate = new Date(expectedDelivery);
  const diffTime = deliveryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Check if delivery is overdue
export const isDeliveryOverdue = (expectedDelivery: string, status: PurchaseOrderStatus) => {
  if (status === 'received' || status === 'cancelled') return false;
  return getDaysUntilDelivery(expectedDelivery) < 0;
};

// Serialized Inventory Management Functions
export interface SerializedItem {
  serialNumber: string;
  barcode?: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'returned';
  location?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
}

// Generate unique serial numbers for a product variant
export const generateSerialNumbers = (
  baseSerial: string,
  quantity: number,
  prefix?: string
): string[] => {
  const serials: string[] = [];
  const base = prefix ? `${prefix}-${baseSerial}` : baseSerial;
  
  for (let i = 1; i <= quantity; i++) {
    const serial = `${base}-${i.toString().padStart(3, '0')}`;
    serials.push(serial);
  }
  
  return serials;
};

// Validate serial number format
export const validateSerialNumber = (serialNumber: string): boolean => {
  // Basic validation - can be customized based on your serial number format
  return serialNumber.length >= 8 && /^[A-Z0-9-]+$/i.test(serialNumber);
};