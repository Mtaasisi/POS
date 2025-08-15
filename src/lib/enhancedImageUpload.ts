import { supabase } from './supabaseClient';

export interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface UploadResult {
  success: boolean;
  image?: UploadedImage;
  error?: string;
}

export interface ImageUploadOptions {
  bucket?: 'product-images' | 'brand-logos' | 'category-icons';
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  isPrimary?: boolean;
}

export class EnhancedImageUploadService {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ];

  /**
   * Upload a single image with enhanced features
   */
  static async uploadImage(
    file: File,
    productId: string,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
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

      // Set default options
      const {
        bucket = 'product-images',
        maxFileSize = this.DEFAULT_MAX_FILE_SIZE,
        allowedTypes = this.DEFAULT_ALLOWED_TYPES,
        generateThumbnail = true,
        thumbnailSize = { width: 300, height: 300 },
        isPrimary = false
      } = options;

      // Validate file
      const validationResult = this.validateFile(file, maxFileSize, allowedTypes);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Generate safe filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = `${timestamp}_${randomId}.${fileExtension}`;
      const filePath = `${productId}/${safeFileName}`;

      console.log('📤 Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        path: filePath
      });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        return { 
          success: false, 
          error: this.getErrorMessage(uploadError) 
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Get image dimensions if possible
      const dimensions = await this.getImageDimensions(file);

      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (generateThumbnail && file.type !== 'image/svg+xml') {
        thumbnailUrl = await this.generateThumbnail(file, thumbnailSize);
      }

      // Create database record
      const { data: dbData, error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          is_primary: isPrimary,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert failed:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
        
        return { 
          success: false, 
          error: `Upload succeeded but database record failed: ${dbError.message}` 
        };
      }

      const uploadedImage: UploadedImage = {
        id: dbData.id,
        url: urlData.publicUrl,
        thumbnailUrl: thumbnailUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
        isPrimary: isPrimary,
        uploadedAt: dbData.created_at
      };

      console.log('✅ Image uploaded successfully:', uploadedImage);

      return {
        success: true,
        image: uploadedImage
      };

    } catch (error) {
      console.error('❌ Upload error:', error);
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
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === 0; // First image becomes primary
      
      const result = await this.uploadImage(file, productId, userId, {
        ...options,
        isPrimary
      });
      
      results.push(result);
      
      // Add small delay between uploads to avoid rate limiting
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Delete an image
   */
  static async deleteImage(imageId: string, bucket: string = 'product-images'): Promise<UploadResult> {
    try {
      // Get image info from database
      const { data: imageData, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !imageData) {
        return { success: false, error: 'Image not found' };
      }

      // Extract file path from URL
      const urlParts = imageData.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const productId = urlParts[urlParts.length - 2];
      const filePath = `${productId}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Storage delete failed:', storageError);
        return { success: false, error: this.getErrorMessage(storageError) };
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Database delete failed:', dbError);
        return { success: false, error: this.getErrorMessage(dbError) };
      }

      console.log('✅ Image deleted successfully:', imageId);

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
   * Set an image as primary
   */
  static async setPrimaryImage(imageId: string): Promise<UploadResult> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('❌ Set primary failed:', error);
        return { success: false, error: this.getErrorMessage(error) };
      }

      console.log('✅ Primary image set successfully:', imageId);

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
   * Get images for a product
   */
  static async getProductImages(productId: string): Promise<UploadedImage[]> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Get images failed:', error);
        return [];
      }

      return data.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnailUrl: img.thumbnail_url,
        fileName: img.file_name,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        width: img.width,
        height: img.height,
        isPrimary: img.is_primary,
        uploadedAt: img.created_at
      }));

    } catch (error) {
      console.error('❌ Get images error:', error);
      return [];
    }
  }

  /**
   * Validate file
   */
  private static validateFile(
    file: File, 
    maxFileSize: number, 
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxFileSize) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB` 
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Get image dimensions
   */
  private static async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (file.type === 'image/svg+xml') {
        resolve(null); // SVG dimensions are not easily determined
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate thumbnail
   */
  private static async generateThumbnail(
    file: File, 
    size: { width: number; height: number }
  ): Promise<string | undefined> {
    try {
      // Create canvas for thumbnail generation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Calculate aspect ratio
          const aspectRatio = img.width / img.height;
          let { width, height } = size;
          
          if (aspectRatio > 1) {
            // Landscape
            height = width / aspectRatio;
          } else {
            // Portrait
            width = height * aspectRatio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and resize image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // For now, return the original URL
              // In a real implementation, you'd upload the thumbnail to storage
              resolve(undefined);
            } else {
              resolve(undefined);
            }
          }, 'image/jpeg', 0.8);
        };
        
        img.onerror = () => resolve(undefined);
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return undefined;
    }
  }

  /**
   * Get error message from Supabase error
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    return 'Unknown error occurred';
  }

  /**
   * Test storage bucket access
   */
  static async testBucketAccess(bucket: string = 'product-images'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });

      if (error) {
        return { success: false, error: this.getErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
