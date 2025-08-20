import { Product, ProductVariant } from '../../types/inventory';

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: {
    product: string[];
    variants: Array<{
      variantId: string;
      sku: string;
      missingFields: string[];
    }>;
  };
}

export interface ProductCompletenessCheck {
  isComplete: boolean;
  completionPercentage: number;
  missingCriticalFields: string[];
  missingOptionalFields: string[];
}

/**
 * Validates product data completeness
 */
export function validateProductCompleteness(product: Product): ProductValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingProductFields: string[] = [];
  const missingVariantFields: Array<{
    variantId: string;
    sku: string;
    missingFields: string[];
  }> = [];

  // Validate product-level fields
  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required');
    missingProductFields.push('name');
  }

  if (!product.description || product.description.trim() === '') {
    warnings.push('Product description is missing');
    missingProductFields.push('description');
  }

  if (!product.categoryId) {
    warnings.push('Product category is not assigned');
    missingProductFields.push('categoryId');
  }

  if (!product.brandId) {
    warnings.push('Product brand is not assigned');
    missingProductFields.push('brandId');
  }

  if (!product.supplierId) {
    warnings.push('Product supplier is not assigned');
    missingProductFields.push('supplierId');
  }

  // Validate variants
  if (!product.variants || product.variants.length === 0) {
    errors.push('Product must have at least one variant');
  } else {
    product.variants.forEach((variant, index) => {
      const variantErrors: string[] = [];
      const variantMissingFields: string[] = [];

      // Required fields
      if (!variant.sku || variant.sku.trim() === '') {
        variantErrors.push(`Variant ${index + 1}: SKU is required`);
        variantMissingFields.push('sku');
      }

      if (!variant.sellingPrice || variant.sellingPrice <= 0) {
        variantErrors.push(`Variant ${index + 1}: Selling price must be greater than 0`);
        variantMissingFields.push('sellingPrice');
      }

      if (variant.costPrice === null || variant.costPrice === undefined || variant.costPrice < 0) {
        variantErrors.push(`Variant ${index + 1}: Cost price cannot be negative`);
        variantMissingFields.push('costPrice');
      }

      if (variant.quantity === null || variant.quantity === undefined || variant.quantity < 0) {
        variantErrors.push(`Variant ${index + 1}: Quantity cannot be negative`);
        variantMissingFields.push('quantity');
      }

      // Optional but recommended fields
      if (!variant.minQuantity || variant.minQuantity < 0) {
        warnings.push(`Variant ${index + 1}: Minimum quantity should be set`);
        variantMissingFields.push('minQuantity');
      }

      if (!variant.barcode) {
        warnings.push(`Variant ${index + 1}: Barcode is recommended`);
        variantMissingFields.push('barcode');
      }

      

      errors.push(...variantErrors);

      if (variantMissingFields.length > 0) {
        missingVariantFields.push({
          variantId: variant.id,
          sku: variant.sku || `Variant ${index + 1}`,
          missingFields: variantMissingFields
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields: {
      product: missingProductFields,
      variants: missingVariantFields
    }
  };
}

/**
 * Calculates product data completeness percentage
 */
export function calculateProductCompleteness(product: Product): ProductCompletenessCheck {
  const criticalFields = [
    'name',
    'variants',
    'sellingPrice',
    'costPrice',
    'quantity'
  ];

  const optionalFields = [
    'description',
    'categoryId',
    'brandId',
    'supplierId',
    'minQuantity',
    'maxQuantity',
    'barcode',

    'attributes'
  ];

  let totalFields = 0;
  let completedFields = 0;
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  // Check product-level fields
  if (product.name && product.name.trim() !== '') {
    completedFields++;
  } else {
    missingCritical.push('name');
  }
  totalFields++;

  if (product.description && product.description.trim() !== '') {
    completedFields++;
  } else {
    missingOptional.push('description');
  }
  totalFields++;

  if (product.categoryId) {
    completedFields++;
  } else {
    missingOptional.push('categoryId');
  }
  totalFields++;

  if (product.brandId) {
    completedFields++;
  } else {
    missingOptional.push('brandId');
  }
  totalFields++;

  if (product.supplierId) {
    completedFields++;
  } else {
    missingOptional.push('supplierId');
  }
  totalFields++;

  // Check variants
  if (product.variants && product.variants.length > 0) {
    completedFields++;
    totalFields++;

    product.variants.forEach(variant => {
      // Critical variant fields
      if (variant.sku && variant.sku.trim() !== '') {
        completedFields++;
      } else {
        missingCritical.push(`variant-${variant.id}-sku`);
      }
      totalFields++;

      if (variant.sellingPrice && variant.sellingPrice > 0) {
        completedFields++;
      } else {
        missingCritical.push(`variant-${variant.id}-sellingPrice`);
      }
      totalFields++;

      if (variant.costPrice !== null && variant.costPrice !== undefined && variant.costPrice >= 0) {
        completedFields++;
      } else {
        missingCritical.push(`variant-${variant.id}-costPrice`);
      }
      totalFields++;

      if (variant.quantity !== null && variant.quantity !== undefined && variant.quantity >= 0) {
        completedFields++;
      } else {
        missingCritical.push(`variant-${variant.id}-quantity`);
      }
      totalFields++;

      // Optional variant fields
      if (variant.minQuantity !== null && variant.minQuantity !== undefined && variant.minQuantity >= 0) {
        completedFields++;
      } else {
        missingOptional.push(`variant-${variant.id}-minQuantity`);
      }
      totalFields++;

      if (variant.barcode) {
        completedFields++;
      } else {
        missingOptional.push(`variant-${variant.id}-barcode`);
      }
      totalFields++;


    });
  } else {
    missingCritical.push('variants');
    totalFields++;
  }

  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return {
    isComplete: missingCritical.length === 0 && completionPercentage >= 80,
    completionPercentage,
    missingCriticalFields: missingCritical,
    missingOptionalFields: missingOptional
  };
}

/**
 * Provides default values for missing product fields
 */
export function getDefaultProductValues(): Partial<Product> {
  return {
    description: 'Product description needed',
    isActive: true,

  };
}

/**
 * Provides default values for missing variant fields
 */
export function getDefaultVariantValues(): Partial<ProductVariant> {
  return {
    minQuantity: 5,
    maxQuantity: 100,
    costPrice: 0,
    quantity: 0,

    barcode: '',
    attributes: {},
    isActive: true
  };
}

/**
 * Auto-fixes common product data issues
 */
export function autoFixProductData(product: Product): Product {
  const fixedProduct = { ...product };

  // Fix product-level issues
  if (!fixedProduct.description || fixedProduct.description.trim() === '') {
    fixedProduct.description = 'Product description needed';
  }

  if (!fixedProduct.isActive) {
    fixedProduct.isActive = true;
  }



  // Fix variant issues
  if (fixedProduct.variants) {
    fixedProduct.variants = fixedProduct.variants.map(variant => {
      const fixedVariant = { ...variant };

      // Set default selling price if zero or negative
      if (!fixedVariant.sellingPrice || fixedVariant.sellingPrice <= 0) {
        fixedVariant.sellingPrice = 99.99;
      }

      // Set default cost price if negative
      if (fixedVariant.costPrice === null || fixedVariant.costPrice === undefined || fixedVariant.costPrice < 0) {
        fixedVariant.costPrice = 50.00;
      }

      // Set default quantity if negative
      if (fixedVariant.quantity === null || fixedVariant.quantity === undefined || fixedVariant.quantity < 0) {
        fixedVariant.quantity = 0;
      }

      // Set default min quantity
      if (!fixedVariant.minQuantity || fixedVariant.minQuantity < 0) {
        fixedVariant.minQuantity = 5;
      }

      // Set default max quantity
      if (!fixedVariant.maxQuantity || fixedVariant.maxQuantity < 0) {
        fixedVariant.maxQuantity = 100;
      }

      // Set default barcode if missing
      if (!fixedVariant.barcode) {
        fixedVariant.barcode = `${fixedVariant.sku}-${Date.now()}`;
      }



      // Set default attributes
      if (!fixedVariant.attributes) {
        fixedVariant.attributes = {};
      }

      return fixedVariant;
    });
  }

  return fixedProduct;
}
