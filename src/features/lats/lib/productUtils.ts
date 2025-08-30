// Product Utility Functions for LATS Inventory System

import { generateSKU } from './skuUtils';
import { ProductSearchResult, ProductSearchVariant } from '../types/pos';
import { format } from './format';

export interface ProductData {
  name: string;
  sku: string;
  description?: string;
  specification?: string;
  categoryId: string;
  supplierId?: string;
  condition: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  storageRoomId?: string;
  shelfId?: string;
  images: any[];
  metadata: Record<string, any>;
  variants: any[];
}

export interface ProductVariant {
  name: string;
  sku: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  specification?: string;
  attributes?: Record<string, any>;
}

/**
 * Duplicate a product with new SKUs
 */
export const duplicateProduct = (
  productData: ProductData,
  variants: ProductVariant[]
): { productData: ProductData; variants: ProductVariant[] } => {
  // Generate new SKU for main product
  const newSku = generateSKU();
  
  // Duplicate product data
  const duplicatedProductData: ProductData = {
    ...productData,
    sku: newSku,
    name: `${productData.name} (Copy)`,
    id: undefined // Remove any existing ID
  };

  // Duplicate variants with new SKUs
  const duplicatedVariants: ProductVariant[] = variants.map((variant, index) => ({
    ...variant,
    sku: `${generateSKU()}-V${index + 1}`,
    name: `${variant.name} (Copy)`
  }));

  return {
    productData: duplicatedProductData,
    variants: duplicatedVariants
  };
};

/**
 * Export product data as JSON
 */
export const exportProductData = (productData: ProductData, variants: ProductVariant[]): string => {
  const exportData = {
    product: productData,
    variants: variants,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Generate product report data
 */
export const generateProductReport = (
  productData: ProductData,
  variants: ProductVariant[]
): string => {
  const totalValue = variants.length > 0 
    ? variants.reduce((sum, v) => sum + (v.stockQuantity * v.price), 0)
    : productData.stockQuantity * productData.price;

  const totalCost = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stockQuantity * v.costPrice), 0)
    : productData.stockQuantity * productData.costPrice;

  const profit = totalValue - totalCost;
  const profitMargin = totalValue > 0 ? (profit / totalValue) * 100 : 0;

  return `
PRODUCT REPORT
==============

Product Information:
- Name: ${productData.name}
- SKU: ${productData.sku}
- Category: ${productData.categoryId}
- Condition: ${productData.condition}
- Description: ${productData.description || 'N/A'}

Inventory Summary:
- Total Quantity: ${productData.stockQuantity}
- Total Value: $${totalValue.toFixed(2)}
- Total Cost: $${totalCost.toFixed(2)}
- Profit: $${profit.toFixed(2)}
- Profit Margin: ${profitMargin.toFixed(1)}%

Variants: ${variants.length}
${variants.map((v, i) => `
Variant ${i + 1}:
- Name: ${v.name}
- SKU: ${v.sku}
- Quantity: ${v.stockQuantity}
- Price: $${v.price}
- Cost: $${v.costPrice}
`).join('')}

Generated: ${new Date().toLocaleString()}
  `.trim();
};

/**
 * Validate product data before submission
 */
export const validateProductData = (productData: ProductData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!productData.name?.trim()) {
    errors.push('Product name is required');
  }

  if (!productData.sku?.trim()) {
    errors.push('SKU is required');
  }

  if (!productData.categoryId) {
    errors.push('Category is required');
  }

  if (productData.price < 0) {
    errors.push('Price cannot be negative');
  }

  if (productData.costPrice < 0) {
    errors.push('Cost price cannot be negative');
  }

  if (productData.stockQuantity < 0) {
    errors.push('Stock quantity cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format product data for display
 */
export const formatProductData = (productData: ProductData): Record<string, any> => {
  return {
    ...productData,
    name: productData.name?.trim(),
    sku: productData.sku?.toUpperCase().trim(),
    description: productData.description?.trim(),
    price: Number(productData.price) || 0,
    costPrice: Number(productData.costPrice) || 0,
    stockQuantity: Number(productData.stockQuantity) || 0,
    minStockLevel: Number(productData.minStockLevel) || 0
  };
};

// ===========================================
// POS Product Utility Functions
// ===========================================

/**
 * Get the primary variant for a product (first active variant or first variant)
 */
export const getPrimaryVariant = (product: ProductSearchResult): ProductSearchVariant | null => {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  
  // Return first variant (ProductSearchVariant doesn't have isActive property)
  return product.variants[0];
};

/**
 * Check if a product has only a single variant
 */
export const isSingleVariantProduct = (product: ProductSearchResult): boolean => {
  return product.variants && product.variants.length === 1;
};

/**
 * Check if a product has multiple variants
 */
export const isMultiVariantProduct = (product: ProductSearchResult): boolean => {
  return product.variants && product.variants.length > 1;
};

/**
 * Get display price for a product (single price or price range)
 */
export const getProductDisplayPrice = (product: ProductSearchResult): string => {
  if (!product.variants || product.variants.length === 0) {
    return 'No price set';
  }
  
  const prices = product.variants
    .map(v => v.sellingPrice)
    .filter(p => p > 0);
    
  if (prices.length === 0) {
    return 'No price set';
  }
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    return format.money(minPrice);
  }
  
  return `${format.money(minPrice)} - ${format.money(maxPrice)}`;
};

/**
 * Get total stock across all variants
 */
export const getProductTotalStock = (product: ProductSearchResult): number => {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }
  
  return product.variants.reduce((total, variant) => total + variant.quantity, 0);
};

/**
 * Get stock status for a product
 */
export const getProductStockStatus = (product: ProductSearchResult): 'out-of-stock' | 'low' | 'normal' => {
  const totalStock = getProductTotalStock(product);
  
  if (totalStock <= 0) {
    return 'out-of-stock';
  }
  
  // Check if any variant is low stock (assuming minQuantity of 5 as default)
  const hasLowStock = product.variants.some(v => v.quantity <= 5);
  
  if (hasLowStock) {
    return 'low';
  }
  
  return 'normal';
};

/**
 * Get the best variant (highest stock, or primary variant as fallback)
 */
export const getBestVariant = (product: ProductSearchResult): ProductSearchVariant | null => {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  
  // Find variant with highest stock
  const sortedByStock = [...product.variants].sort((a, b) => b.quantity - a.quantity);
  const highestStockVariant = sortedByStock[0];
  
  // Return highest stock variant if it has stock, otherwise return primary variant
  if (highestStockVariant && highestStockVariant.quantity > 0) {
    return highestStockVariant;
  }
  
  return getPrimaryVariant(product);
};
