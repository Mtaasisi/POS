import { supabase } from './supabaseClient';

export interface LocalProductImageUploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface LocalProductImageData {
  id: string;
  url: string;
  thumbnailUrl?: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isPrimary: boolean;
}

export class LocalProductImageStorageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Base path for storing product images on the hosting server
  private static readonly BASE_UPLOAD_PATH = '/public/uploads/products';
  private static readonly BASE_THUMBNAIL_PATH = '/public/uploads/thumbnails';
  private static readonly BASE_URL_PATH = '/uploads/products';
  private static readonly BASE_THUMBNAIL_URL_PATH = '/uploads/thumbnails';

  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

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
   * Convert file to base64 for development mode
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload product image to local storage
   */
  static async uploadProductImage(
    file: File,
    productName: string,
    productId: string,
    imageType: 'main' | 'gallery' = 'gallery'
  ): Promise<LocalProductImageUploadResult> {
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

      // Check if we're in development mode
      if (this.isDevelopment()) {
        console.log('🛠️ Using development mode (base64)');
        // In development: use base64 for immediate preview
        const base64Data = await this.fileToBase64(file);
        
        // Also create a virtual file record for development mode
        const safeFileName = this.generateSafeFileName(productName, file.name);
        
        return {
          success: true,
          url: base64Data,
          fileName: safeFileName, // Include the generated filename for reference
          isDevelopment: true
        };
      }

      console.log('🚀 Using production mode (local storage)');
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
      formData.append('image_type', imageType);

      console.log('📋 FormData prepared:', {
        product_id: productId,
        product_name: productName,
        file_path: filePath,
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
        thumbnailUrl: result.thumbnail_url || thumbnailUrl
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
   * Upload multiple product images
   */
  static async uploadMultipleProductImages(
    files: File[],
    productName: string,
    productId: string
  ): Promise<LocalProductImageUploadResult[]> {
    const results: LocalProductImageUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageType = i === 0 ? 'main' : 'gallery'; // First image is main
      
      console.log(`📤 Uploading product image ${i + 1}/${files.length}: ${file.name}`);
      
      const result = await this.uploadProductImage(file, productName, productId, imageType);
      results.push(result);
      
      if (!result.success) {
        console.error(`❌ Failed to upload ${file.name}:`, result.error);
      }
    }
    
    return results;
  }

  /**
   * Get product images from local storage
   */
  static async getProductImages(productId: string): Promise<LocalProductImageData[]> {
    try {
      // Handle temporary products
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-')) {
        return [];
      }

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch product images:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        url: item.image_url,
        thumbnailUrl: item.thumbnail_url,
        localPath: item.local_path || '',
        fileName: item.file_name,
        fileSize: item.file_size,
        mimeType: item.mime_type || 'image/jpeg',
        uploadedAt: item.created_at,
        isPrimary: item.is_primary
      }));

    } catch (error) {
      console.error('❌ Error fetching product images:', error);
      return [];
    }
  }

  /**
   * Delete product image from local storage
   */
  static async deleteProductImage(imageId: string): Promise<LocalProductImageUploadResult> {
    try {
      // Get image record first
      const { data: image, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !image) {
        return { success: false, error: 'Image not found' };
      }

      // Delete from server
      const response = await fetch('/server-product-upload-handler.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_path: image.image_url
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server delete failed:', errorText);
        return { success: false, error: 'Failed to delete from server' };
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Database delete failed:', dbError);
        return { success: false, error: 'Failed to delete database record' };
      }

      console.log('✅ Product image deleted successfully:', imageId);
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
   * Set primary image
   */
  static async setPrimaryImage(imageId: string): Promise<LocalProductImageUploadResult> {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) {
        console.error('❌ Failed to set primary image:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Primary image set successfully:', imageId);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error setting primary image:', error);
      return {
        success: false,
        error: error.message || 'Failed to set primary image'
      };
    }
  }
}
