/**
 * Robust Image Service - Fast, Simple, and Reliable Image Management
 * Optimized for LATS with caching, compression, and smart fallbacks
 */

import { supabase } from './supabaseClient';
import DebugUtils from '../utils/debugUtils';

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  isPrimary: boolean;
  uploadedAt: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface UploadResult {
  success: boolean;
  image?: ProductImage;
  error?: string;
}

export interface ImageStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  primaryImages: number;
}

export class RobustImageService {
  // Configuration
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (reduced for better performance)
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private static readonly MAX_FILES_PER_PRODUCT = 5;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // In-memory cache for better performance
  private static imageCache = new Map<string, { data: ProductImage[]; timestamp: number }>();

  /**
   * Upload image with smart optimization
   */
  static async uploadImage(
    file: File,
    productId: string,
    userId: string,
    isPrimary: boolean = false
  ): Promise<UploadResult> {
    try {
      // 1. Quick validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. Check limits
      const existingImages = await this.getProductImages(productId);
      if (existingImages.length >= this.MAX_FILES_PER_PRODUCT) {
        return { success: false, error: `Maximum ${this.MAX_FILES_PER_PRODUCT} images allowed per product` };
      }

      // 3. Generate optimized filename
      const fileName = this.generateFileName(file, productId);

      // 4. Smart upload based on environment
      let imageUrl: string;
      let thumbnailUrl: string;

      // Always upload to storage for proper file storage
      try {
        const uploadResult = await this.uploadToStorage(file, fileName);
        imageUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl;
        console.log('✅ Uploaded to Supabase Storage:', imageUrl);
      } catch (storageError) {
        console.warn('Storage failed, using base64 fallback:', storageError);
        // Fallback to base64 only if storage completely fails
        const compressedImage = await this.compressImage(file);
        imageUrl = compressedImage;
        thumbnailUrl = await this.createThumbnail(file, 200);
        console.log('⚠️ Using base64 fallback due to storage error');
      }

      // 5. Save to database
      const uploadedImage = await this.saveImageRecord({
        productId,
        imageUrl,
        thumbnailUrl,
        fileName: file.name,
        fileSize: file.size,
        isPrimary,
        userId,
        mimeType: file.type
      });

      // 6. Clear cache for this product
      this.clearProductCache(productId);

      return { success: true, image: uploadedImage };

    } catch (error) {
      console.error('Upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Get product images with caching
   */
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // Check cache first
      const cacheKey = `product_${productId}`;
      const cached = this.imageCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        // Only log in development mode to reduce console noise
        DebugUtils.throttledLog(`cached_images_${productId}`, '📦 Using cached images for product:', 3000, productId);
        return cached.data;
      }

      // Handle temporary products
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-')) {
        return [];
      }

      // Query database
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      const images = data.map(row => ({
        id: row.id,
        url: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        isPrimary: row.is_primary,
        uploadedAt: row.created_at,
        mimeType: row.mime_type,
        width: row.width,
        height: row.height
      }));

      // Cache the result
      this.imageCache.set(cacheKey, { data: images, timestamp: Date.now() });

      return images;
    } catch (error) {
      console.error('Failed to get product images:', error);
      return [];
    }
  }

  /**
   * Delete image with cleanup
   */
  static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle temporary images
      if (imageId.startsWith('temp-')) {
        return { success: true };
      }

      // Get image info
      const { data: image, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from database
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;

      // Delete from storage (production only)
      if (!import.meta.env.DEV && image.image_url && !image.image_url.startsWith('data:')) {
        await this.deleteFromStorage(image.image_url);
      }

      // Clear cache
      this.clearProductCache(image.product_id);

      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  /**
   * Set primary image
   */
  static async setPrimaryImage(imageId: string, productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle temporary products
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || imageId.startsWith('temp-')) {
        return { success: true };
      }

      // Update database
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      // Clear cache
      this.clearProductCache(productId);

      return { success: true };
    } catch (error) {
      console.error('Set primary failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Set primary failed' 
      };
    }
  }

  /**
   * Get image statistics
   */
  static async getImageStats(): Promise<ImageStats> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('file_size, is_primary');

      if (error) throw error;

      const totalImages = data.length;
      const totalSize = data.reduce((sum, img) => sum + (img.file_size || 0), 0);
      const averageSize = totalImages > 0 ? totalSize / totalImages : 0;
      const primaryImages = data.filter(img => img.is_primary).length;

      return {
        totalImages,
        totalSize,
        averageSize,
        primaryImages
      };
    } catch (error) {
      console.error('Failed to get image stats:', error);
      return {
        totalImages: 0,
        totalSize: 0,
        averageSize: 0,
        primaryImages: 0
      };
    }
  }

  /**
   * Bulk operations for better performance
   */
  static async bulkUploadImages(
    files: File[],
    productId: string,
    userId: string
  ): Promise<{ success: boolean; images: ProductImage[]; errors: string[] }> {
    const results: ProductImage[] = [];
    const errors: string[] = [];

    // Process files in parallel for better performance
    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await this.uploadImage(file, productId, userId, index === 0);
        if (result.success && result.image) {
          results.push(result.image);
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${file.name}: Upload failed`);
      }
    });

    await Promise.all(uploadPromises);

    return {
      success: results.length > 0,
      images: results,
      errors
    };
  }

  // Private helper methods

  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true };
  }

  private static generateFileName(file: File, productId: string): string {
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    return `${productId}_${timestamp}_${randomId}.${extension}`;
  }

  private static async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1200px)
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private static async createThumbnail(file: File, size: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;

        if (aspectRatio > 1) {
          drawHeight = size / aspectRatio;
        } else {
          drawWidth = size * aspectRatio;
        }

        const x = (size - drawWidth) / 2;
        const y = (size - drawHeight) / 2;

        ctx?.drawImage(img, x, y, drawWidth, drawHeight);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailDataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private static async uploadToStorage(file: File, fileName: string): Promise<{ url: string; thumbnailUrl: string }> {
    // Upload main image
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const url = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
    
    // Create and upload thumbnail
    const thumbnail = await this.createThumbnail(file, 200);
    const thumbnailBlob = await this.dataUrlToBlob(thumbnail);
    const thumbnailFileName = `thumb_${fileName}`;

    await supabase.storage
      .from('product-images')
      .upload(thumbnailFileName, thumbnailBlob);

    const thumbnailUrl = supabase.storage.from('product-images').getPublicUrl(thumbnailFileName).data.publicUrl;

    return { url, thumbnailUrl };
  }

  private static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  private static async saveImageRecord(data: {
    productId: string;
    imageUrl: string;
    thumbnailUrl: string;
    fileName: string;
    fileSize: number;
    isPrimary: boolean;
    userId: string;
    mimeType: string;
  }): Promise<ProductImage> {
    // Handle temporary products - don't save to database
    if (data.productId.startsWith('temp-product-') || data.productId.startsWith('test-product-') || data.productId.startsWith('temp-sparepart-')) {
      console.log('📝 Creating temporary image record for product:', data.productId);
      return {
        id: `temp-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}`,
        url: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        isPrimary: data.isPrimary,
        uploadedAt: new Date().toISOString(),
        mimeType: data.mimeType
      };
    }

    // For real products, check if image already exists before inserting
    const { data: existingImage } = await supabase
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', data.productId)
      .eq('image_url', data.imageUrl)
      .single();

    if (existingImage) {
      console.log('⚠️ Image record already exists, returning existing record');
      // Return the existing image record
      const { data: dbData } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', existingImage.id)
        .single();

      return {
        id: dbData!.id,
        url: dbData!.image_url,
        thumbnailUrl: dbData!.thumbnail_url,
        fileName: dbData!.file_name,
        fileSize: dbData!.file_size,
        isPrimary: dbData!.is_primary,
        uploadedAt: dbData!.created_at,
        mimeType: dbData!.mime_type
      };
    }

    // Insert new image record
    const { data: dbData, error } = await supabase
      .from('product_images')
      .insert({
        product_id: data.productId,
        image_url: data.imageUrl,
        thumbnail_url: data.thumbnailUrl,
        file_name: data.fileName,
        file_size: data.fileSize,
        is_primary: data.isPrimary,
        uploaded_by: data.userId,
        mime_type: data.mimeType
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database insert error:', error);
      throw error;
    }

    return {
      id: dbData.id,
      url: dbData.image_url,
      thumbnailUrl: dbData.thumbnail_url,
      fileName: dbData.file_name,
      fileSize: dbData.file_size,
      isPrimary: dbData.is_primary,
      uploadedAt: dbData.created_at,
      mimeType: dbData.mime_type
    };
  }

  private static async deleteFromStorage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('product-images')
          .remove([fileName, `thumb_${fileName}`]);
      }
    } catch (error) {
      console.warn('Failed to delete from storage:', error);
    }
  }

  private static clearProductCache(productId: string): void {
    const cacheKey = `product_${productId}`;
    this.imageCache.delete(cacheKey);
  }

  // Cache management
  static clearAllCache(): void {
    this.imageCache.clear();
  }

  static getCacheStats(): { size: number; entries: number } {
    return {
      size: this.imageCache.size,
      entries: this.imageCache.size
    };
  }
}
