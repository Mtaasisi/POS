import { supabase } from './supabaseClient';

export interface LocalProductUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  thumbnailUrl?: string;
}

export class LocalProductStorageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for products
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Base paths for storing product images on the hosting server
  private static readonly BASE_UPLOAD_PATH = '/public/uploads/products';
  private static readonly BASE_THUMBNAIL_PATH = '/public/uploads/thumbnails';
  private static readonly BASE_URL_PATH = '/uploads/products';
  private static readonly BASE_THUMBNAIL_URL_PATH = '/uploads/thumbnails';

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Generate safe filename for product image
   */
  private static generateSafeFileName(productName: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${sanitizedName}_${timestamp}_${randomId}.${fileExtension}`;
  }

  /**
   * Upload product image to local storage
   */
  static async uploadProductImage(
    file: File,
    productName: string,
    productId: string,
    imageType: 'main' | 'gallery' = 'main'
  ): Promise<LocalProductUploadResult> {
    try {
      console.log('🔍 uploadProductImage: Starting upload process');
      
      // Validate inputs
      if (!file) {
        console.error('❌ No file provided');
        return { success: false, error: 'No file provided' };
      }
      if (!productName) {
        console.error('❌ Product name is required');
        return { success: false, error: 'Product name is required' };
      }
      if (!productId) {
        console.error('❌ Product ID is required');
        return { success: false, error: 'Product ID is required' };
      }

      console.log('✅ Input validation passed');

      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        console.error('❌ File validation failed:', validationResult.error);
        return { success: false, error: validationResult.error };
      }

      console.log('✅ File validation passed');

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ Authentication passed');

      console.log('📤 Uploading product image to local storage:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        productName: productName,
        productId: productId,
        imageType: imageType
      });

      // Generate safe filename
      const safeFileName = this.generateSafeFileName(productName, file.name);
      const filePath = `${this.BASE_UPLOAD_PATH}/${safeFileName}`;
      const thumbnailPath = `${this.BASE_THUMBNAIL_PATH}/${safeFileName}`;
      const publicUrl = `${this.BASE_URL_PATH}/${safeFileName}`;
      const thumbnailUrl = `${this.BASE_THUMBNAIL_URL_PATH}/${safeFileName}`;

      console.log('📁 Generated paths:', {
        safeFileName,
        filePath,
        thumbnailPath,
        publicUrl,
        thumbnailUrl
      });

      // Upload to server handler
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', productId);
      formData.append('product_name', productName);
      formData.append('file_path', filePath);
      formData.append('thumbnail_path', thumbnailPath);
      formData.append('image_type', imageType);

      console.log('📋 FormData prepared:', {
        product_id: productId,
        product_name: productName,
        file_path: filePath,
        thumbnail_path: thumbnailPath,
        image_type: imageType
      });

      // Get the server upload handler URL
      const uploadUrl = '/server-product-upload-handler.php';
      
      console.log('🌐 Making request to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📄 Response JSON:', result);

      if (!result.success) {
        console.error('❌ Upload failed:', result.error);
        return { success: false, error: result.error || 'Upload failed' };
      }

      console.log('✅ Product image uploaded successfully:', result.url);
      return {
        success: true,
        url: result.url || publicUrl,
        thumbnailUrl: result.thumbnailUrl || thumbnailUrl
      };

    } catch (error: any) {
      console.error('❌ Error uploading product image:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete product image from local storage
   */
  static async deleteProductImage(filePath: string): Promise<LocalProductUploadResult> {
    try {
      console.log('🗑️ Deleting product image:', filePath);

      const response = await fetch('/server-product-upload-handler.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_path: filePath })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error || 'Delete failed' };
      }

      console.log('✅ Product image deleted successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error deleting product image:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  /**
   * Convert file to base64 for development mode
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail URL from main image URL
   */
  static getThumbnailUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If it's already a thumbnail URL, return as is
    if (imageUrl.includes('/thumbnails/')) {
      return imageUrl;
    }
    
    // Convert main image URL to thumbnail URL
    return imageUrl.replace('/products/', '/thumbnails/');
  }
}

export const localProductStorage = LocalProductStorageService;
