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
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', flag: '🇷🇼' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' }
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
  
  if (currency.code === 'AED') {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
  _expectedDelivery: string, // Optional parameter, prefixed with _ to indicate unused
  paymentTerms: string
) => {
  const errors: string[] = [];
  
  if (!supplier) errors.push('Please select a supplier');
  if (cartItems.length === 0) errors.push('Please add items to the purchase order');
  // Expected delivery is now optional - can be set later
  // if (!expectedDelivery) errors.push('Please set expected delivery date');
  if (!paymentTerms) errors.push('Please select payment terms');
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

// Check if serial number is unique
export const isSerialNumberUnique = async (
  serialNumber: string,
  excludeId?: string
): Promise<boolean> => {
  // This would need to be implemented with your database
  // For now, returning true as placeholder
  return true;
};

// Create individual inventory items for serialized products
export const createSerializedItems = (
  variantId: string,
  serialNumbers: string[],
  baseData: Partial<SerializedItem> = {}
): any[] => {
  return serialNumbers.map(serialNumber => ({
    variant_id: variantId,
    serial_number: serialNumber,
    status: 'available',
    ...baseData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};
