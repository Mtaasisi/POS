/**
 * Unified Image Service - Simplified Image Management for LATS
 * This consolidates all image operations into one simple service
 */

import { supabase } from './supabaseClient';

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface VariantImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  isPrimary: boolean;
  uploadedAt: string;
  variantId: string;
}

export interface UploadResult {
  success: boolean;
  image?: ProductImage;
  error?: string;
}

export class UnifiedImageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  private static readonly MAX_FILES_PER_PRODUCT = 5;

  /**
   * Upload a single image - Simple one-step process
   */
  static async uploadImage(
    file: File,
    productId: string,
    userId: string,
    isPrimary: boolean = false
  ): Promise<UploadResult> {
    try {
      // 1. Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. Check if product already has max images
      const existingImages = await this.getProductImages(productId);
      if (existingImages.length >= this.MAX_FILES_PER_PRODUCT) {
        return { success: false, error: `Maximum ${this.MAX_FILES_PER_PRODUCT} images allowed per product` };
      }

      // 3. Generate safe filename
      const timestamp = Date.now();
      const randomId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${productId}_${timestamp}_${randomId}.${extension}`;

      // 4. Upload to storage (development mode uses base64)
      let imageUrl: string;
      if (import.meta.env.DEV) {
        // Development: Use base64 for immediate preview
        imageUrl = await this.fileToBase64(file);
        
        // Check if base64 URL is too large and compress if needed
        if (imageUrl.length > 5000) {
          console.warn('🚨 Base64 image too large, compressing to prevent 431 errors');
          // For now, we'll use a placeholder in development
          imageUrl = this.generatePlaceholderUrl();
        }
        
        console.log('🛠️ Development mode: Using base64 image');
      } else {
        // Production: Upload to Supabase storage
        try {
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

          if (error) throw error;
          imageUrl = `${supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl}`;
        } catch (storageError) {
          console.error('Storage upload failed, falling back to base64:', storageError);
          // Fallback to base64 if storage fails
          imageUrl = await this.fileToBase64(file);
        }
      }

      // 5. Handle temporary products vs real products
      let uploadedImage: ProductImage;
      
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-')) {
        // For temporary products, create a local image object
        console.log('📝 Creating temporary image for product:', productId);
        uploadedImage = {
          id: `temp-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}`,
          url: imageUrl,
          thumbnailUrl: imageUrl,
          fileName: file.name,
          fileSize: file.size,
          isPrimary: isPrimary,
          uploadedAt: new Date().toISOString()
        };
        console.log('📝 Temporary image created:', uploadedImage);
      } else {
        // For real products, save to database
        const { data: dbData, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: imageUrl,
            thumbnail_url: imageUrl, // Same URL for now
            file_name: file.name,
            file_size: file.size,
            is_primary: isPrimary,
            uploaded_by: userId
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedImage = {
          id: dbData.id,
          url: dbData.image_url,
          thumbnailUrl: dbData.thumbnail_url,
          fileName: dbData.file_name,
          fileSize: dbData.file_size,
          isPrimary: dbData.is_primary,
          uploadedAt: dbData.created_at
        };
      }

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
   * Get all images for a product
   */
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // Validate productId format
      if (!productId || typeof productId !== 'string') {
        console.warn('Invalid productId provided to getProductImages:', productId);
        return [];
      }

      // Handle temporary products (don't query database)
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-')) {
        console.log('📝 Getting images for temporary product:', productId);
        // Return empty array for temporary products
        return [];
      }

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });

      if (error) {
        // Log the error but don't throw to prevent app crashes
        console.error('Failed to get product images:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        url: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        isPrimary: row.is_primary,
        uploadedAt: row.created_at
      }));
    } catch (error) {
      console.error('Failed to get product images:', error);
      return [];
    }
  }

  /**
   * Delete an image
   */
  static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle temporary images (don't query database)
      if (imageId.startsWith('temp-')) {
        console.log('📝 Deleting temporary image:', imageId);
        // For temporary images, just return success (they're not in database)
        return { success: true };
      }

      // Get image info first
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

      // Delete from storage (if not development)
      if (!import.meta.env.DEV && image.image_url) {
        const fileName = image.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product-images')
            .remove([fileName]);
        }
      }

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
      // Handle temporary products (don't query database)
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || imageId.startsWith('temp-')) {
        console.log('📝 Setting primary image for temporary product:', productId, 'imageId:', imageId);
        // For temporary products, just return success (they're not in database)
        return { success: true };
      }

      // First, unset all primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;
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
   * Validate file
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true };
  }

  /**
   * Convert file to base64 (for development)
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Generate a placeholder URL for images that are too large
   */
  private static generatePlaceholderUrl(): string {
    // Generate a simple placeholder image URL
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#f3f4f6"/>
        <text x="150" y="150" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          Image too large
        </text>
      </svg>
    `)}`;
  }

  // =====================================================
  // VARIANT IMAGE METHODS
  // =====================================================

  /**
   * Upload image for a specific variant
   */
  static async uploadVariantImage(
    file: File,
    variantId: string,
    userId: string,
    isPrimary: boolean = false
  ): Promise<{ success: boolean; image?: VariantImage; error?: string }> {
    try {
      // 1. Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. Check if variant already has max images
      const existingImages = await this.getVariantImages(variantId);
      if (existingImages.length >= this.MAX_FILES_PER_PRODUCT) {
        return { success: false, error: `Maximum ${this.MAX_FILES_PER_PRODUCT} images allowed per variant` };
      }

      // 3. Convert to base64 for storage
      const base64Data = await this.fileToBase64(file);
      
      // 4. Store in database
      const { data, error } = await supabase
        .from('variant_images')
        .insert({
          variant_id: variantId,
          image_url: base64Data,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_primary: isPrimary,
          uploaded_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upload variant image:', error);
        return { success: false, error: error.message };
      }

      const variantImage: VariantImage = {
        id: data.id,
        url: data.image_url,
        thumbnailUrl: data.thumbnail_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        isPrimary: data.is_primary,
        uploadedAt: data.created_at,
        variantId: data.variant_id
      };

      return { success: true, image: variantImage };
    } catch (error) {
      console.error('Failed to upload variant image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Get all images for a variant
   */
  static async getVariantImages(variantId: string): Promise<VariantImage[]> {
    try {
      // Validate variantId format
      if (!variantId || typeof variantId !== 'string') {
        console.warn('Invalid variantId provided to getVariantImages:', variantId);
        return [];
      }

      const { data, error } = await supabase
        .from('variant_images')
        .select('*')
        .eq('variant_id', variantId)
        .order('is_primary', { ascending: false });

      if (error) {
        console.error('Failed to get variant images:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        url: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        isPrimary: row.is_primary,
        uploadedAt: row.created_at,
        variantId: row.variant_id
      }));
    } catch (error) {
      console.error('Failed to get variant images:', error);
      return [];
    }
  }

  /**
   * Delete a variant image
   */
  static async deleteVariantImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('variant_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Failed to delete variant image:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete variant image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  /**
   * Set primary variant image
   */
  static async setPrimaryVariantImage(variantId: string, imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, set all images for this variant to non-primary
      await supabase
        .from('variant_images')
        .update({ is_primary: false })
        .eq('variant_id', variantId);

      // Then set the selected image as primary
      const { error } = await supabase
        .from('variant_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('variant_id', variantId);

      if (error) {
        console.error('Failed to set primary variant image:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to set primary variant image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Set primary failed' 
      };
    }
  }
}
