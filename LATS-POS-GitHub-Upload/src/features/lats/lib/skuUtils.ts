// SKU Utility Functions for LATS Inventory System

/**
 * Generate a unique SKU based on timestamp and random string
 */
export const generateSKU = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

/**
 * Generate a SKU based on product name and category
 */
export const generateProductBasedSKU = (
  productName: string,
  categoryCode?: string,
  brandCode?: string
): string => {
  const timestamp = Date.now();
  const nameCode = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const category = categoryCode?.substring(0, 2).toUpperCase() || 'PR';
  const brand = brandCode?.substring(0, 2).toUpperCase() || 'BR';
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  
  return `${brand}-${category}-${nameCode}-${timestamp}-${random}`;
};

/**
 * Generate a SKU for serialized products
 */
export const generateSerializedSKU = (
  baseProductCode: string,
  serialNumber: string
): string => {
  return `${baseProductCode}-${serialNumber}`;
};

/**
 * Validate SKU format
 */
export const validateSKU = (sku: string): { isValid: boolean; error?: string } => {
  if (!sku || sku.trim().length === 0) {
    return { isValid: false, error: 'SKU cannot be empty' };
  }
  
  if (sku.length > 50) {
    return { isValid: false, error: 'SKU must be 50 characters or less' };
  }
  
  // Allow alphanumeric characters, hyphens, and underscores
  if (!/^[A-Z0-9_-]+$/i.test(sku)) {
    return { isValid: false, error: 'SKU can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

/**
 * Check if SKU is unique (placeholder - implement with your database)
 */
export const isSKUUnique = async (sku: string, excludeId?: string): Promise<boolean> => {
  // This should be implemented with your database
  // For now, returning true as placeholder
  return true;
};

/**
 * Format SKU for display
 */
export const formatSKU = (sku: string): string => {
  return sku.toUpperCase().trim();
};

/**
 * Generate SKU suggestions based on product info
 */
export const generateSKUSuggestions = (
  productName: string,
  categoryName?: string,
  brandName?: string
): string[] => {
  const suggestions: string[] = [];
  
  // Basic timestamp-based SKU
  suggestions.push(generateSKU());
  
  // Product-based SKU
  if (productName) {
    suggestions.push(generateProductBasedSKU(productName, categoryName, brandName));
  }
  
  // Simple product code
  if (productName) {
    const code = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();
    suggestions.push(`${code}-${Date.now().toString().slice(-4)}`);
  }
  
  return suggestions;
};
