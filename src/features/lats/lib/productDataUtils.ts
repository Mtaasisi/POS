/**
 * Product Data Utilities
 * Helper functions to ensure product data is properly formatted for UI display
 */

import { Product, ProductVariant } from '../types/inventory';

/**
 * Ensure a product has all required fields for UI display
 */
export function ensureProductDataIntegrity(product: Product): Product {
  if (!product) {
    throw new Error('Product is required');
  }

  // Ensure basic fields
  const enhancedProduct = {
    ...product,
    name: product.name || 'Unnamed Product',
    description: product.description || '',
    shortDescription: product.shortDescription || (product.description ? product.description.substring(0, 100) : ''),
    sku: product.sku || `SKU-${product.id.substring(0, 8).toUpperCase()}`,
    isActive: product.isActive ?? true,
    totalQuantity: product.totalQuantity || 0,
    totalValue: product.totalValue || 0,
    price: product.price || 0,
    costPrice: product.costPrice || 0,
    priceRange: product.priceRange || '0',
    condition: product.condition || 'new',
    internalNotes: product.internalNotes || '',
    attributes: product.attributes || {},
    images: product.images || [],
    variants: product.variants || [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  };

  // Ensure category
  if (!enhancedProduct.category) {
    enhancedProduct.category = {
      id: 'uncategorized',
      name: 'Uncategorized',
      description: 'Products without a category',
      color: '#6B7280',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Ensure supplier
  if (!enhancedProduct.supplier) {
    enhancedProduct.supplier = {
      id: 'no-supplier',
      name: 'No Supplier',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: 'Product without supplier information',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Ensure at least one variant
  if (enhancedProduct.variants.length === 0) {
    enhancedProduct.variants = [createDefaultVariant(product.id, product.name)];
  }

  // Ensure variants have all required fields
  enhancedProduct.variants = enhancedProduct.variants.map(variant => ensureVariantDataIntegrity(variant));

  return enhancedProduct;
}

/**
 * Ensure a variant has all required fields for UI display
 */
export function ensureVariantDataIntegrity(variant: ProductVariant): ProductVariant {
  if (!variant) {
    throw new Error('Variant is required');
  }

  return {
    ...variant,
    sku: variant.sku || `SKU-${variant.id.substring(0, 8).toUpperCase()}`,
    name: variant.name || 'Default Variant',
    attributes: variant.attributes || {},
    costPrice: variant.costPrice || 0,
    sellingPrice: variant.sellingPrice || 0,
    quantity: variant.quantity || 0,
    minQuantity: variant.minQuantity || 0,
    isActive: variant.isActive ?? true,
    images: variant.images || [],
    createdAt: variant.createdAt || new Date().toISOString(),
    updatedAt: variant.updatedAt || new Date().toISOString()
  };
}

/**
 * Create a default variant for a product
 */
export function createDefaultVariant(productId: string, productName?: string): ProductVariant {
  return {
    id: `default-${productId}`,
    productId: productId,
    sku: productName ? `SKU-${productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}` : `SKU-${productId.substring(0, 8).toUpperCase()}`,
    name: productName || 'Default Variant',
    attributes: {},
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minQuantity: 1,
    isActive: true,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Get the primary variant from a product
 */
export function getPrimaryVariant(product: Product): ProductVariant | null {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  // Try to find a variant marked as primary
  const primaryVariant = product.variants.find(v => v.isPrimary);
  if (primaryVariant) {
    return primaryVariant;
  }

  // Fall back to the first variant
  return product.variants[0];
}

/**
 * Calculate product statistics
 */
export function calculateProductStats(product: Product) {
  const variants = product.variants || [];
  
  const totalStock = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
  const totalCostValue = variants.reduce((sum, v) => sum + ((v.costPrice || 0) * (v.quantity || 0)), 0);
  const totalRetailValue = variants.reduce((sum, v) => sum + ((v.sellingPrice || 0) * (v.quantity || 0)), 0);
  const potentialProfit = totalRetailValue - totalCostValue;
  const profitMargin = totalCostValue > 0 ? (potentialProfit / totalCostValue) * 100 : 0;

  return {
    totalStock,
    totalCostValue,
    totalRetailValue,
    potentialProfit,
    profitMargin,
    variantCount: variants.length,
    activeVariants: variants.filter(v => v.isActive).length,
    lowStockVariants: variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length
  };
}

/**
 * Validate product data completeness
 */
export function validateProductCompleteness(product: Product): {
  completeness: number;
  missingFields: string[];
  recommendations: string[];
} {
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  // Check required fields
  if (!product.name || product.name.trim() === '') {
    missingFields.push('name');
    recommendations.push('Add a product name');
  }

  if (!product.description || product.description.trim() === '') {
    missingFields.push('description');
    recommendations.push('Add a product description');
  }

  if (!product.category || product.category.id === 'uncategorized') {
    missingFields.push('category');
    recommendations.push('Assign a category to the product');
  }

  if (!product.supplier || product.supplier.id === 'no-supplier') {
    missingFields.push('supplier');
    recommendations.push('Assign a supplier to the product');
  }

  if (!product.variants || product.variants.length === 0) {
    missingFields.push('variants');
    recommendations.push('Add at least one product variant');
  } else {
    const primaryVariant = getPrimaryVariant(product);
    if (primaryVariant) {
      if (!primaryVariant.sku || primaryVariant.sku.trim() === '') {
        missingFields.push('sku');
        recommendations.push('Add a SKU to the primary variant');
      }
      if (!primaryVariant.sellingPrice || primaryVariant.sellingPrice <= 0) {
        missingFields.push('price');
        recommendations.push('Set a selling price for the primary variant');
      }
    }
  }

  if (!product.images || product.images.length === 0) {
    missingFields.push('images');
    recommendations.push('Add product images');
  }

  // Calculate completeness percentage
  const totalFields = 7; // name, description, category, supplier, variants, sku, price, images
  const completedFields = totalFields - missingFields.length;
  const completeness = Math.round((completedFields / totalFields) * 100);

  return {
    completeness,
    missingFields,
    recommendations
  };
}