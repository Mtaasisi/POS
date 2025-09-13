import { ProductVariant } from '../types/inventory';

/**
 * Calculate total stock quantity from product variants
 */
export const calculateTotalStock = (variants: ProductVariant[]): number => {
  return variants.reduce((sum, variant) => sum + (Number(variant.quantity) || 0), 0);
};

/**
 * Calculate total cost value from product variants
 */
export const calculateTotalCostValue = (variants: ProductVariant[]): number => {
  return variants.reduce((sum, variant) => {
    const costPrice = Number(variant.costPrice) || 0;
    const quantity = Number(variant.quantity) || 0;
    return sum + (costPrice * quantity);
  }, 0);
};

/**
 * Calculate total retail value from product variants
 */
export const calculateTotalRetailValue = (variants: ProductVariant[]): number => {
  return variants.reduce((sum, variant) => {
    const sellingPrice = Number(variant.sellingPrice) || 0;
    const quantity = Number(variant.quantity) || 0;
    return sum + (sellingPrice * quantity);
  }, 0);
};

/**
 * Calculate potential profit from product variants
 */
export const calculatePotentialProfit = (variants: ProductVariant[]): number => {
  const retailValue = calculateTotalRetailValue(variants);
  const costValue = calculateTotalCostValue(variants);
  return retailValue - costValue;
};

/**
 * Calculate profit margin percentage
 */
export const calculateProfitMargin = (variants: ProductVariant[]): number => {
  const retailValue = calculateTotalRetailValue(variants);
  const profit = calculatePotentialProfit(variants);
  return retailValue > 0 ? (profit / retailValue) * 100 : 0;
};

/**
 * Get stock status for a product
 */
export const getStockStatus = (variants: ProductVariant[]): 'out-of-stock' | 'low' | 'normal' => {
  const totalStock = calculateTotalStock(variants);
  
  if (totalStock <= 0) return 'out-of-stock';
  
  // Check if any variant has low stock (quantity <= minQuantity)
  const hasLowStock = variants.some(variant => 
    (variant.quantity ?? 0) > 0 && (variant.quantity ?? 0) <= (variant.minQuantity ?? 0)
  );
  
  if (hasLowStock || totalStock <= 10) return 'low';
  return 'normal';
};

/**
 * Get low stock variants
 */
export const getLowStockVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return variants.filter(variant => 
    (variant.quantity ?? 0) > 0 && (variant.quantity ?? 0) <= (variant.minQuantity ?? 0)
  );
};

/**
 * Get out of stock variants
 */
export const getOutOfStockVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return variants.filter(variant => (variant.quantity ?? 0) <= 0);
};

/**
 * Get active variants
 */
export const getActiveVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return variants.filter(variant => variant.isActive !== false);
};

/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with proper locale
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Get price range for variants
 */
export const getPriceRange = (variants: ProductVariant[]): { min: number; max: number; range: string } => {
  const prices = variants
    .map(v => v.sellingPrice)
    .filter(p => p !== null && p !== undefined && p > 0);
  
  if (prices.length === 0) {
    return { min: 0, max: 0, range: 'No price set' };
  }
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  const range = min === max 
    ? formatCurrency(min)
    : `${formatCurrency(min)} - ${formatCurrency(max)}`;
  
  return { min, max, range };
};

/**
 * Get cost price range for variants
 */
export const getCostPriceRange = (variants: ProductVariant[]): { min: number; max: number; range: string } => {
  const prices = variants
    .map(v => v.costPrice)
    .filter(p => p !== null && p !== undefined && p > 0);
  
  if (prices.length === 0) {
    return { min: 0, max: 0, range: 'No cost set' };
  }
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  const range = min === max 
    ? formatCurrency(min)
    : `${formatCurrency(min)} - ${formatCurrency(max)}`;
  
  return { min, max, range };
};
