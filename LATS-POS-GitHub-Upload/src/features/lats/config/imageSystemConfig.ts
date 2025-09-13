/**
 * Image System Configuration for LATS Products
 * This file cements the current working image system settings
 */

export interface ImageSystemConfig {
  // File upload settings
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFilesPerProduct: number;
  
  // Storage settings
  storagePaths: {
    baseUploadPath: string;
    baseThumbnailPath: string;
    baseUrlPath: string;
    baseThumbnailUrlPath: string;
  };
  
  // Database settings
  database: {
    tableName: string;
    primaryKeyField: string;
    productIdField: string;
    imageUrlField: string;
    thumbnailUrlField: string;
    fileNameField: string;
    fileSizeField: string;
    isPrimaryField: string;
    uploadedByField: string;
    createdAtField: string;
    updatedAtField: string;
  };
  
  // Validation settings
  validation: {
    requireProductId: boolean;
    requireUserId: boolean;
    validateFileType: boolean;
    validateFileSize: boolean;
    autoGenerateThumbnails: boolean;
  };
  
  // UI settings
  ui: {
    showUploadProgress: boolean;
    showFileValidation: boolean;
    allowDragAndDrop: boolean;
    showImagePreview: boolean;
    allowImageReordering: boolean;
    showDeleteConfirmation: boolean;
  };
  
  // Development settings
  development: {
    useLocalStorage: boolean;
    useTempStorage: boolean;
    enableDebugLogging: boolean;
    mockUploadDelay: number;
  };
}

/**
 * Current working image system configuration
 * DO NOT MODIFY unless you understand the full impact
 */
export const IMAGE_SYSTEM_CONFIG: ImageSystemConfig = {
  // File upload settings - Current working values
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  maxFilesPerProduct: 5,
  
  // Storage settings - Current working paths
  storagePaths: {
    baseUploadPath: '/public/uploads/products',
    baseThumbnailPath: '/public/uploads/thumbnails',
    baseUrlPath: '/uploads/products',
    baseThumbnailUrlPath: '/uploads/thumbnails'
  },
  
  // Database settings - Current working schema
  database: {
    tableName: 'product_images',
    primaryKeyField: 'id',
    productIdField: 'product_id',
    imageUrlField: 'image_url',
    thumbnailUrlField: 'thumbnail_url',
    fileNameField: 'file_name',
    fileSizeField: 'file_size',
    isPrimaryField: 'is_primary',
    uploadedByField: 'uploaded_by',
    createdAtField: 'created_at',
    updatedAtField: 'updated_at'
  },
  
  // Validation settings - Current working validation
  validation: {
    requireProductId: true,
    requireUserId: true,
    validateFileType: true,
    validateFileSize: true,
    autoGenerateThumbnails: false // Currently using same URL for thumbnail
  },
  
  // UI settings - Current working UI behavior
  ui: {
    showUploadProgress: true,
    showFileValidation: true,
    allowDragAndDrop: true,
    showImagePreview: true,
    allowImageReordering: false, // Not currently implemented
    showDeleteConfirmation: true
  },
  
  // Development settings - Current working dev mode
  development: {
    useLocalStorage: true,
    useTempStorage: true,
    enableDebugLogging: true,
    mockUploadDelay: 0
  }
};

/**
 * Image system validation functions
 */
export class ImageSystemValidator {
  /**
   * Validate file type against allowed types
   */
  static validateFileType(file: File): boolean {
    return IMAGE_SYSTEM_CONFIG.allowedFileTypes.includes(file.type);
  }
  
  /**
   * Validate file size against maximum allowed size
   */
  static validateFileSize(file: File): boolean {
    return file.size <= IMAGE_SYSTEM_CONFIG.maxFileSize;
  }
  
  /**
   * Validate file completely
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (IMAGE_SYSTEM_CONFIG.validation.validateFileType && !this.validateFileType(file)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${IMAGE_SYSTEM_CONFIG.allowedFileTypes.join(', ')}` 
      };
    }
    
    if (IMAGE_SYSTEM_CONFIG.validation.validateFileSize && !this.validateFileSize(file)) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${IMAGE_SYSTEM_CONFIG.maxFileSize / (1024 * 1024)}MB` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate product ID
   */
  static validateProductId(productId: string): boolean {
    if (!IMAGE_SYSTEM_CONFIG.validation.requireProductId) return true;
    return !!productId && productId.trim().length > 0;
  }
  
  /**
   * Validate user ID
   */
  static validateUserId(userId: string): boolean {
    if (!IMAGE_SYSTEM_CONFIG.validation.requireUserId) return true;
    return !!userId && userId.trim().length > 0;
  }
}

/**
 * Image system utility functions
 */
export class ImageSystemUtils {
  /**
   * Generate safe filename for product image
   */
  static generateSafeFileName(productName: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    
    return `${sanitizedName}_${timestamp}_${randomId}.${fileExtension}`;
  }
  
  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return import.meta.env.DEV || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  /**
   * Get storage path for product images
   */
  static getStoragePath(productId: string, fileName: string): string {
    return `${IMAGE_SYSTEM_CONFIG.storagePaths.baseUploadPath}/${productId}/${fileName}`;
  }
  
  /**
   * Get thumbnail path for product images
   */
  static getThumbnailPath(productId: string, fileName: string): string {
    return `${IMAGE_SYSTEM_CONFIG.storagePaths.baseThumbnailPath}/${productId}/${fileName}`;
  }
  
  /**
   * Get public URL for product images
   */
  static getPublicUrl(productId: string, fileName: string): string {
    return `${IMAGE_SYSTEM_CONFIG.storagePaths.baseUrlPath}/${productId}/${fileName}`;
  }
  
  /**
   * Get public thumbnail URL for product images
   */
  static getPublicThumbnailUrl(productId: string, fileName: string): string {
    return `${IMAGE_SYSTEM_CONFIG.storagePaths.baseThumbnailUrlPath}/${productId}/${fileName}`;
  }
}

/**
 * Image system constants
 */
export const IMAGE_SYSTEM_CONSTANTS = {
  // Error messages
  ERRORS: {
    NO_FILE: 'No file provided',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File too large',
    PRODUCT_ID_REQUIRED: 'Product ID is required',
    USER_ID_REQUIRED: 'User ID is required',
    UPLOAD_FAILED: 'Upload failed',
    DELETE_FAILED: 'Delete failed',
    LOAD_FAILED: 'Failed to load images'
  },
  
  // Success messages
  SUCCESS: {
    UPLOAD_COMPLETE: 'Image uploaded successfully',
    DELETE_COMPLETE: 'Image deleted successfully',
    PRIMARY_SET: 'Primary image set successfully'
  },
  
  // File size limits in human readable format
  FILE_SIZE_LIMITS: {
    MAX_SIZE_MB: IMAGE_SYSTEM_CONFIG.maxFileSize / (1024 * 1024),
    MAX_SIZE_KB: IMAGE_SYSTEM_CONFIG.maxFileSize / 1024,
    MAX_SIZE_BYTES: IMAGE_SYSTEM_CONFIG.maxFileSize
  }
};

/**
 * Export the configuration for use in other modules
 */
export default IMAGE_SYSTEM_CONFIG;
