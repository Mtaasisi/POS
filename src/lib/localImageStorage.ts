import { supabase } from './supabaseClient';

export interface LocalUploadResult {
  success: boolean;
  image?: {
    id: string;
    url: string;
    localPath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
  error?: string;
}

export interface LocalImageData {
  id: string;
  url: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isPrimary: boolean;
}

export class LocalImageStorageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Base path for storing images on the hosting server
  private static readonly BASE_UPLOAD_PATH = '/public/uploads/products';
  private static readonly BASE_URL_PATH = '/uploads/products';

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
   * Generate safe filename
   */
  private static generateSafeFileName(originalName: string, productId: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${productId}_${timestamp}_${randomId}.${fileExtension}`;
  }

  /**
   * Create directory structure for product images
   */
  private static async createProductDirectory(productId: string): Promise<string> {
    const productPath = `${this.BASE_UPLOAD_PATH}/${productId}`;
    
    try {
      // This would typically be handled by your server-side code
      // For now, we'll assume the directory structure exists
      console.log('📁 Creating product directory:', productPath);
      return productPath;
    } catch (error) {
      console.error('❌ Failed to create directory:', error);
      throw new Error('Failed to create upload directory');
    }
  }

  /**
   * Convert file to base64 (for demonstration purposes)
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Upload image to local storage via server handler
   */
  static async uploadImage(
    file: File,
    productId: string,
    userId: string,
    isPrimary: boolean = false
  ): Promise<LocalUploadResult> {
    try {
      // Validate inputs
      if (!file) {
        return { success: false, error: 'No file provided' };
      }
      if (!productId) {
        return { success: false, error: 'Product ID is required' };
      }
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📤 Uploading image to local storage:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        productId: productId
      });

      // Upload to server handler
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', productId);
      formData.append('user_id', userId);
      formData.append('is_primary', isPrimary ? '1' : '0');

      // Get the server upload handler URL (update this to your actual server URL)
      const uploadUrl = '/server-upload-handler.php';
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let the browser set it with boundary
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      const uploadedImage = {
        id: result.image.id,
        url: result.image.url,
        localPath: result.image.localPath,
        fileName: result.image.fileName,
        fileSize: result.image.fileSize,
        mimeType: result.image.mimeType,
        uploadedAt: result.image.uploadedAt
      };

      console.log('✅ Image uploaded successfully to local storage:', uploadedImage);

      return {
        success: true,
        image: uploadedImage
      };

    } catch (error) {
      console.error('❌ Local upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: File[],
    productId: string,
    userId: string
  ): Promise<LocalUploadResult[]> {
    const results: LocalUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === 0; // First image becomes primary
      
      console.log(`📤 Uploading image ${i + 1}/${files.length}:`, file.name);
      
      const result = await this.uploadImage(file, productId, userId, isPrimary);
      results.push(result);
      
      // Add small delay between uploads to prevent overwhelming the server
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get product images from local storage
   */
  static async getProductImages(productId: string): Promise<LocalImageData[]> {
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
   * Delete image from local storage
   */
  static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get image data first
      const { data: imageData, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !imageData) {
        return { success: false, error: 'Image not found' };
      }

      // Delete from database first
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('❌ Database delete failed:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // In a real implementation, you would also delete the physical file
      console.log('🗑️ Image deleted from database:', imageData.file_name);
      console.log('📁 Physical file should be deleted from:', imageData.local_path);

      return { success: true };

    } catch (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Set primary image
   */
  static async setPrimaryImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the image to find its product_id
      const { data: imageData, error: fetchError } = await supabase
        .from('product_images')
        .select('product_id')
        .eq('id', imageId)
        .single();

      if (fetchError || !imageData) {
        return { success: false, error: 'Image not found' };
      }

      // Update all images for this product to set is_primary = false
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', imageData.product_id);

      if (updateError) {
        console.error('❌ Failed to reset primary images:', updateError);
        return { success: false, error: updateError.message };
      }

      // Set the selected image as primary
      const { error: setPrimaryError } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (setPrimaryError) {
        console.error('❌ Failed to set primary image:', setPrimaryError);
        return { success: false, error: setPrimaryError.message };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Set primary error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate thumbnail (placeholder for now)
   */
  static async generateThumbnail(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(thumbnailFile);
          } else {
            resolve(file); // Fallback to original file
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
