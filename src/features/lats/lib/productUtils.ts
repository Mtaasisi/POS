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

// ===========================================
// Product Data Validation and Cleanup Utilities
// ===========================================

export interface ProductValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  recommendations: string[];
  completenessScore: number; // 0-100
}

/**
 * Validate product completeness and identify missing information
 */
export const validateProductCompleteness = (product: any): ProductValidationResult => {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check required fields
  if (!product.name?.trim()) missingFields.push('Product name');
  if (!product.sku?.trim()) missingFields.push('SKU');
  if (!product.categoryId && !product.category) missingFields.push('Category');
  if (!product.supplierId && !product.supplier) missingFields.push('Supplier');

  // Check variants
  if (!product.variants || product.variants.length === 0) {
    missingFields.push('Product variants');
  } else {
    // Check variant completeness
    product.variants.forEach((variant: any, index: number) => {
      if (!variant.sku?.trim()) {
        warnings.push(`Variant ${index + 1} missing SKU`);
      }
      if (!variant.sellingPrice || variant.sellingPrice <= 0) {
        warnings.push(`Variant ${index + 1} missing or invalid selling price`);
      }
      if (variant.quantity === undefined || variant.quantity === null) {
        warnings.push(`Variant ${index + 1} missing stock quantity`);
      }
    });
  }

  // Check images
  if (!product.images || product.images.length === 0) {
    warnings.push('No product images');
    recommendations.push('Add product images for better customer experience');
  }

  // Check stock levels
  const totalStock = product.variants?.reduce((sum: number, variant: any) => sum + (variant.quantity || 0), 0) || 0;
  if (totalStock === 0) {
    warnings.push('No stock available');
    recommendations.push('Add stock quantities to make products available for sale');
  }

  // Generate recommendations based on missing fields
  if (missingFields.includes('Category')) {
    recommendations.push('Assign a category to help with product organization and filtering');
  }
  if (missingFields.includes('Supplier')) {
    recommendations.push('Add supplier information for purchase order management');
  }
  if (missingFields.includes('Product variants')) {
    recommendations.push('Create product variants with different sizes, colors, or specifications');
  }

  // Calculate completeness score (0-100)
  const totalChecks = 8; // name, sku, category, supplier, variants, images, stock, prices
  const passedChecks = totalChecks - missingFields.length - (warnings.length * 0.5);
  const completenessScore = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
    recommendations,
    completenessScore
  };
};

/**
 * Validate multiple products and return summary statistics
 */
export const validateProductsBatch = (products: any[]): {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  averageCompleteness: number;
  commonMissingFields: Record<string, number>;
  recommendations: string[];
} => {
  if (!products || products.length === 0) {
    return {
      totalProducts: 0,
      validProducts: 0,
      invalidProducts: 0,
      averageCompleteness: 0,
      commonMissingFields: {},
      recommendations: []
    };
  }

  const validationResults = products.map(validateProductCompleteness);
  const validProducts = validationResults.filter(r => r.isValid).length;
  const invalidProducts = products.length - validProducts;
  const averageCompleteness = Math.round(
    validationResults.reduce((sum, r) => sum + r.completenessScore, 0) / products.length
  );

  // Count common missing fields
  const commonMissingFields: Record<string, number> = {};
  validationResults.forEach(result => {
    result.missingFields.forEach(field => {
      commonMissingFields[field] = (commonMissingFields[field] || 0) + 1;
    });
  });

  // Generate recommendations based on most common issues
  const recommendations: string[] = [];
  const sortedMissingFields = Object.entries(commonMissingFields)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  sortedMissingFields.forEach(([field, count]) => {
    const percentage = Math.round((count / products.length) * 100);
    if (percentage > 30) {
      switch (field) {
        case 'Category':
          recommendations.push(`Add categories to ${count} products (${percentage}%) to improve organization`);
          break;
        case 'Supplier':
          recommendations.push(`Add supplier information to ${count} products (${percentage}%) for purchase management`);
          break;
        case 'Product variants':
          recommendations.push(`Create variants for ${count} products (${percentage}%) to enable different options`);
          break;
        case 'SKU':
          recommendations.push(`Add SKU codes to ${count} products (${percentage}%) for better tracking`);
          break;
        default:
          recommendations.push(`Complete ${field} for ${count} products (${percentage}%)`);
      }
    }
  });

  return {
    totalProducts: products.length,
    validProducts,
    invalidProducts,
    averageCompleteness,
    commonMissingFields,
    recommendations
  };
};

/**
 * Clean and normalize product data
 */
export const cleanProductData = (product: any): any => {
  const cleaned = { ...product };

  // Clean strings
  if (cleaned.name) cleaned.name = cleaned.name.trim();
  if (cleaned.sku) cleaned.sku = cleaned.sku.trim().toUpperCase();
  if (cleaned.description) cleaned.description = cleaned.description.trim();

  // Clean variants
  if (cleaned.variants && Array.isArray(cleaned.variants)) {
    cleaned.variants = cleaned.variants.map((variant: any) => ({
      ...variant,
      sku: variant.sku?.trim().toUpperCase() || '',
      name: variant.name?.trim() || '',
      sellingPrice: Number(variant.sellingPrice) || 0,
      costPrice: Number(variant.costPrice) || 0,
      quantity: Number(variant.quantity) || 0,
      minQuantity: Number(variant.minQuantity) || 0
    }));
  }

  // Ensure numeric fields are numbers
  cleaned.totalQuantity = Number(cleaned.totalQuantity) || 0;
  cleaned.totalValue = Number(cleaned.totalValue) || 0;

  return cleaned;
};
