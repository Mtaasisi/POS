import { ValidationError } from '../types/inventory';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class LatsFormValidator {
  private static instance: LatsFormValidator;
  
  private constructor() {}
  
  static getInstance(): LatsFormValidator {
    if (!LatsFormValidator.instance) {
      LatsFormValidator.instance = new LatsFormValidator();
    }
    return LatsFormValidator.instance;
  }

  // Validate a single field
  validateField(value: any, rules: ValidationRule, fieldName: string): ValidationError | null {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        field: fieldName,
        message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
      };
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return {
          field: fieldName,
          message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rules.minLength} characters`
        };
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          field: fieldName,
          message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rules.maxLength} characters`
        };
      }
    }

    // Numeric range validation
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return {
          field: fieldName,
          message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rules.min}`
        };
      }
      
      if (rules.max !== undefined && value > rules.max) {
        return {
          field: fieldName,
          message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rules.max}`
        };
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return {
        field: fieldName,
        message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`
      };
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      return {
        field: fieldName,
        message: rules.message || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is invalid`
      };
    }

    return null;
  }

  // Validate entire form
  validateForm(data: Record<string, any>, schema: ValidationSchema): ValidationError[] {
    const errors: ValidationError[] = [];
    
    Object.keys(schema).forEach(fieldName => {
      const value = data[fieldName];
      const rules = schema[fieldName];
      
      const error = this.validateField(value, rules, fieldName);
      if (error) {
        errors.push(error);
      }
    });
    
    return errors;
  }

  // Validate product form data
  validateProductForm(data: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Basic product validation
    const basicSchema: ValidationSchema = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      description: {
        maxLength: 500
      },
      categoryId: {
        required: true
      }
    };

    // Validate basic fields
    Object.keys(basicSchema).forEach(fieldName => {
      const value = data[fieldName];
      const rules = basicSchema[fieldName];
      
      const error = this.validateField(value, rules, fieldName);
      if (error) {
        errors.push(error);
      }
    });

    // Validate variants
    if (data.variants && data.variants.length > 0) {
      data.variants.forEach((variant: any, index: number) => {
        // Validate required fields
        if (!variant.sku || variant.sku.trim() === '') {
          errors.push({
            field: `variants.${index}.sku`,
            message: 'SKU is required for each variant'
          });
        }

        if (!variant.name || variant.name.trim() === '') {
          errors.push({
            field: `variants.${index}.name`,
            message: 'Variant name is required'
          });
        }

        // Validate numeric fields
        if (variant.price !== undefined && (isNaN(variant.price) || variant.price < 0)) {
          errors.push({
            field: `variants.${index}.price`,
            message: 'Price must be a positive number'
          });
        }

        if (variant.costPrice !== undefined && (isNaN(variant.costPrice) || variant.costPrice < 0)) {
          errors.push({
            field: `variants.${index}.costPrice`,
            message: 'Cost price must be a positive number'
          });
        }

        if (variant.stockQuantity !== undefined && (isNaN(variant.stockQuantity) || variant.stockQuantity < 0)) {
          errors.push({
            field: `variants.${index}.stockQuantity`,
            message: 'Stock quantity must be a positive number'
          });
        }

        if (variant.minStockLevel !== undefined && (isNaN(variant.minStockLevel) || variant.minStockLevel < 0)) {
          errors.push({
            field: `variants.${index}.minStockLevel`,
            message: 'Minimum stock level must be a positive number'
          });
        }

        // Validate that minStockLevel is not greater than stockQuantity
        if (variant.minStockLevel && variant.stockQuantity &&
            Number(variant.minStockLevel) > Number(variant.stockQuantity)) {
          errors.push({
            field: `variants.${index}.minStockLevel`,
            message: 'Minimum stock level cannot be greater than current stock quantity'
          });
        }
      });
    }

    // Check for duplicate SKUs across all variants
    const skus = data.variants
      .map((variant: any, index: number) => ({ sku: variant.sku, index }))
      .filter((item: any) => item.sku && item.sku.trim() !== '');
    
    const duplicateSkus = skus.filter((item: any, index: number) => 
      skus.findIndex((other: any) => other.sku === item.sku) !== index
    );

    if (duplicateSkus.length > 0) {
      const duplicateSkuList = [...new Set(duplicateSkus.map((item: any) => item.sku))].join(', ');
      errors.push({
        field: 'variants',
        message: `Duplicate SKUs found: ${duplicateSkuList}. Each variant must have a unique SKU.`
      });
    }

    return errors;
  }

  // Validate category form data
  validateCategoryForm(data: any): ValidationError[] {
    const schema: ValidationSchema = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      description: {
        maxLength: 200
      },
      color: {
        pattern: /^#[0-9A-F]{6}$/i,
        message: 'Color must be a valid hex color (e.g., #FF0000)'
      }
    };

    return this.validateForm(data, schema);
  }

  // Validate brand form data
  validateBrandForm(data: any): ValidationError[] {
    const schema: ValidationSchema = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      description: {
        maxLength: 200
      },
      website: {
        pattern: /^https?:\/\/.+/,
        message: 'Website must be a valid URL starting with http:// or https://'
      }
    };

    return this.validateForm(data, schema);
  }

  // Validate supplier form data
  validateSupplierForm(data: any): ValidationError[] {
    const schema: ValidationSchema = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email must be a valid email address'
      },
      phone: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        message: 'Phone must be a valid phone number'
      },
      leadTimeDays: {
        required: true,
        min: 1,
        max: 365,
        message: 'Lead time must be between 1 and 365 days'
      }
    };

    return this.validateForm(data, schema);
  }

  // Validate variant form data
  validateVariantForm(data: any): ValidationError[] {
    const schema: ValidationSchema = {
      name: {
        required: true,
        minLength: 1,
        maxLength: 50
      },
      sku: {
        required: true,
        pattern: /^[A-Z0-9-_]+$/,
        message: 'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
      },
      costPrice: {
        required: true,
        min: 0,
        message: 'Cost price must be positive'
      },
      sellingPrice: {
        required: true,
        min: 0,
        message: 'Selling price must be positive'
      },
      stockQuantity: {
        required: true,
        min: 0,
        message: 'Stock quantity must be non-negative'
      },
      minStockLevel: {
        required: true,
        min: 0,
        message: 'Minimum stock level must be non-negative'
      }
    };

    return this.validateForm(data, schema);
  }

  // Validate price relationship
  validatePriceRelationship(costPrice: number, sellingPrice: number): ValidationError | null {
    if (costPrice > sellingPrice) {
      return {
        field: 'sellingPrice',
        message: 'Selling price must be higher than cost price'
      };
    }
    
    if (costPrice === sellingPrice) {
      return {
        field: 'sellingPrice',
        message: 'Selling price should be higher than cost price for profit'
      };
    }
    
    return null;
  }

  // Validate stock levels
  validateStockLevels(quantity: number, minLevel: number, maxLevel?: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (quantity < 0) {
      errors.push({
        field: 'quantity',
        message: 'Stock quantity cannot be negative'
      });
    }
    
    if (minLevel < 0) {
      errors.push({
        field: 'minStockLevel',
        message: 'Minimum stock level cannot be negative'
      });
    }
    
    if (maxLevel !== undefined && quantity > maxLevel) {
      errors.push({
        field: 'quantity',
        message: 'Stock quantity cannot exceed maximum stock level'
      });
    }
    
    return errors;
  }

  // Validate dimensions
  validateDimensions(dimensions: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (dimensions) {
      if (dimensions.length && dimensions.length < 0) {
        errors.push({
          field: 'dimensions.length',
          message: 'Length must be positive'
        });
      }
      
      if (dimensions.width && dimensions.width < 0) {
        errors.push({
          field: 'dimensions.width',
          message: 'Width must be positive'
        });
      }
      
      if (dimensions.height && dimensions.height < 0) {
        errors.push({
          field: 'dimensions.height',
          message: 'Height must be positive'
        });
      }
    }
    
    return errors;
  }

  // Validate weight
  validateWeight(weight: number): ValidationError | null {
    if (weight !== undefined && weight < 0) {
      return {
        field: 'weight',
        message: 'Weight must be positive'
      };
    }
    
    return null;
  }

  // Validate barcode
  validateBarcode(barcode: string): ValidationError | null {
    if (barcode && !/^[0-9]{8,14}$/.test(barcode)) {
      return {
        field: 'barcode',
        message: 'Barcode must be 8-14 digits'
      };
    }
    
    return null;
  }

  // Validate email
  validateEmail(email: string): ValidationError | null {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        field: 'email',
        message: 'Email must be a valid email address'
      };
    }
    
    return null;
  }

  // Validate phone
  validatePhone(phone: string): ValidationError | null {
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
      return {
        field: 'phone',
        message: 'Phone must be a valid phone number'
      };
    }
    
    return null;
  }

  // Validate URL
  validateUrl(url: string): ValidationError | null {
    if (url && !/^https?:\/\/.+/.test(url)) {
      return {
        field: 'url',
        message: 'URL must start with http:// or https://'
      };
    }
    
    return null;
  }

  // Validate hex color
  validateHexColor(color: string): ValidationError | null {
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return {
        field: 'color',
        message: 'Color must be a valid hex color (e.g., #FF0000)'
      };
    }
    
    return null;
  }

  // Get field error message
  getFieldError(fieldName: string, errors: ValidationError[]): string | null {
    // Safety check: ensure errors is an array
    if (!Array.isArray(errors)) {
      console.warn('getFieldError: errors parameter is not an array:', errors);
      return null;
    }
    const error = errors.find(e => e.field === fieldName);
    return error ? error.message : null;
  }

  // Check if field has error
  hasFieldError(fieldName: string, errors: ValidationError[]): boolean {
    // Safety check: ensure errors is an array
    if (!Array.isArray(errors)) {
      console.warn('hasFieldError: errors parameter is not an array:', errors);
      return false;
    }
    return errors.some(e => e.field === fieldName);
  }

  // Clear field error
  clearFieldError(fieldName: string, errors: ValidationError[]): ValidationError[] {
    // Safety check: ensure errors is an array
    if (!Array.isArray(errors)) {
      console.warn('clearFieldError: errors parameter is not an array:', errors);
      return [];
    }
    return errors.filter(e => e.field !== fieldName);
  }

  // Add field error
  addFieldError(fieldName: string, message: string, errors: ValidationError[]): ValidationError[] {
    // Safety check: ensure errors is an array
    if (!Array.isArray(errors)) {
      console.warn('addFieldError: errors parameter is not an array:', errors);
      errors = [];
    }
    const newError: ValidationError = { field: fieldName, message };
    return [...errors, newError];
  }
}

// Export singleton instance
export const latsFormValidator = LatsFormValidator.getInstance();

// Export convenience functions
export const validateProductForm = (data: any) => 
  latsFormValidator.validateProductForm(data);

export const validateCategoryForm = (data: any) => 
  latsFormValidator.validateCategoryForm(data);

export const validateBrandForm = (data: any) => 
  latsFormValidator.validateBrandForm(data);

export const validateSupplierForm = (data: any) => 
  latsFormValidator.validateSupplierForm(data);

export const validateVariantForm = (data: any) => 
  latsFormValidator.validateVariantForm(data);

export const validatePriceRelationship = (costPrice: number, sellingPrice: number) => 
  latsFormValidator.validatePriceRelationship(costPrice, sellingPrice);

export const validateStockLevels = (quantity: number, minLevel: number, maxLevel?: number) => 
  latsFormValidator.validateStockLevels(quantity, minLevel, maxLevel);

export const getFieldError = (fieldName: string, errors: ValidationError[]) => 
  latsFormValidator.getFieldError(fieldName, errors);

export const hasFieldError = (fieldName: string, errors: ValidationError[]) => 
  latsFormValidator.hasFieldError(fieldName, errors);

export const clearFieldError = (fieldName: string, errors: ValidationError[]) => 
  latsFormValidator.clearFieldError(fieldName, errors);

export const addFieldError = (fieldName: string, message: string, errors: ValidationError[]) => 
  latsFormValidator.addFieldError(fieldName, message, errors);
