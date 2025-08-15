import { LatsProduct } from '@/features/lats/types/inventory';

/**
 * Check if a product has only one variant (single product)
 * @param product - The product to check
 * @returns true if the product has only one variant
 */
export function isSingleVariantProduct(product: LatsProduct): boolean {
  return product.variants && product.variants.length === 1;
}

/**
 * Check if a product has multiple variants
 * @param product - The product to check
 * @returns true if the product has multiple variants
 */
export function isMultiVariantProduct(product: LatsProduct): boolean {
  return product.variants && product.variants.length > 1;
}

/**
 * Get the primary variant for a product
 * For single-variant products, returns the only variant
 * For multi-variant products, returns the first variant
 * @param product - The product to get the primary variant for
 * @returns The primary variant or null if no variants exist
 */
export function getPrimaryVariant(product: LatsProduct) {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  return product.variants[0];
}

/**
 * Get the display price for a product
 * For single-variant products, shows the single price
 * For multi-variant products, shows price range
 * @param product - The product to get the price for
 * @returns Formatted price string
 */
export function getProductDisplayPrice(product: LatsProduct): string {
  if (!product.variants || product.variants.length === 0) {
    return 'No price set';
  }

  if (isSingleVariantProduct(product)) {
    const variant = product.variants[0];
    return variant.sellingPrice ? `$${variant.sellingPrice.toFixed(2)}` : 'No price set';
  }

  // Multi-variant product - show price range
  const prices = product.variants
    .map(v => v.sellingPrice)
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return 'No price set';
  }

  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  if (minPrice === maxPrice) {
    return `$${minPrice.toFixed(2)}`;
  }

  return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
}

/**
 * Get the total stock for a product
 * @param product - The product to get stock for
 * @returns Total stock across all variants
 */
export function getProductTotalStock(product: LatsProduct): number {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }

  return product.variants.reduce((total, variant) => total + (variant.quantity || 0), 0);
}

/**
 * Check if a product is in stock
 * @param product - The product to check
 * @returns true if the product has stock available
 */
export function isProductInStock(product: LatsProduct): boolean {
  return getProductTotalStock(product) > 0;
}

/**
 * Get the stock status for a product
 * @param product - The product to check
 * @returns 'in-stock', 'low-stock', or 'out-of-stock'
 */
export function getProductStockStatus(product: LatsProduct): 'in-stock' | 'low-stock' | 'out-of-stock' {
  const totalStock = getProductTotalStock(product);
  
  if (totalStock === 0) {
    return 'out-of-stock';
  }
  
  if (totalStock <= 5) {
    return 'low-stock';
  }
  
  return 'in-stock';
}

/**
 * Get the best variant for a product (for single-variant products)
 * @param product - The product to get the best variant for
 * @returns The best variant or null
 */
export function getBestVariant(product: LatsProduct) {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  if (isSingleVariantProduct(product)) {
    return product.variants[0];
  }

  // For multi-variant products, return the variant with the most stock
  return product.variants.reduce((best, current) => {
    const bestStock = best.quantity || 0;
    const currentStock = current.quantity || 0;
    return currentStock > bestStock ? current : best;
  });
}

/**
 * Format product name with variant information
 * @param product - The product to format
 * @param variant - Optional specific variant
 * @returns Formatted product name
 */
export function formatProductName(product: LatsProduct, variant?: any): string {
  if (!variant || isSingleVariantProduct(product)) {
    return product.name;
  }

  return `${product.name} - ${variant.name}`;
}

/**
 * Get product attributes for display
 * @param product - The product to get attributes for
 * @returns Array of attribute strings
 */
export function getProductAttributes(product: LatsProduct): string[] {
  if (!product.variants || product.variants.length === 0) {
    return [];
  }

  const attributes: string[] = [];
  
  product.variants.forEach(variant => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        const attrString = `${key}: ${value}`;
        if (!attributes.includes(attrString)) {
          attributes.push(attrString);
        }
      });
    }
  });

  return attributes;
}
