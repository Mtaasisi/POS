import { supabase } from './supabaseClient';
import { ImageCompressionService, CompressedImage } from './imageCompressionService';

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

  // Development mode storage for temporary products
  private static devImageStorage = new Map<string, UploadedImage[]>();
  
  // Cache for product images to reduce API calls
  private static imageCache = new Map<string, { images: UploadedImage[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get development mode images for a product
   */
  static getDevImages(productId: string): UploadedImage[] {
    return this.devImageStorage.get(productId) || [];
  }

  /**
   * Clear image cache for a specific product
   */
  static clearImageCache(productId?: string): void {
    if (productId) {
      this.imageCache.delete(productId);
      console.log('🗑️ EnhancedImageUploadService: Cleared image cache for product:', productId);
    } else {
      this.imageCache.clear();
      console.log('🗑️ EnhancedImageUploadService: Cleared all image cache');
    }
  }

  /**
   * Clear development mode images for a product
   */
  static clearDevImages(productId: string): void {
    this.devImageStorage.delete(productId);
  }

  /**
   * Diagnostic function to check upload environment
   */
  static async diagnoseUploadEnvironment(): Promise<{
    networkStatus: boolean;
    supabaseConnection: boolean;
    storageAccess: boolean;
    fileSizeLimit: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Check network status
    const networkStatus = navigator.onLine;
    if (!networkStatus) {
      issues.push('No internet connection');
    }
    
    // Check Supabase connection
    let supabaseConnection = false;
    try {
      const { data, error } = await supabase.from('devices').select('count').limit(1);
      supabaseConnection = !error;
      if (error) {
        issues.push(`Supabase connection failed: ${error.message}`);
      }
    } catch (error: any) {
      issues.push(`Supabase connection error: ${error.message}`);
    }
    
    // Check storage access
    let storageAccess = false;
    try {
      const { data, error } = await supabase.storage.from('product-images').list('', { limit: 1 });
      storageAccess = !error;
      if (error) {
        issues.push(`Storage access failed: ${error.message}`);
      }
    } catch (error: any) {
      issues.push(`Storage access error: ${error.message}`);
    }
    
    // Check file size limit
    const fileSizeLimit = true; // This would be checked per file
    
    return {
      networkStatus,
      supabaseConnection,
      storageAccess,
      fileSizeLimit,
      issues
    };
  }

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

      // Add timeout wrapper for upload
      const uploadWithTimeout = async () => {
        const uploadPromise = supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
        });

        // Race between upload and timeout
        return Promise.race([uploadPromise, timeoutPromise]) as Promise<{ data: any; error: any }>;
      };

      console.log('⏱️ Starting upload with 30-second timeout...');
      const { data: uploadData, error: uploadError } = await uploadWithTimeout();
      console.log('📤 Upload completed:', { uploadData, uploadError });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        console.error('❌ Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error,
          details: uploadError.details
        });
        
        // Fallback: Store image locally for temporary products
        if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
          console.log('🔄 Attempting local fallback for temporary product...');
          try {
            const localImageUrl = URL.createObjectURL(file);
            const uploadedImage: UploadedImage = {
              id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
              url: localImageUrl,
              thumbnailUrl: localImageUrl,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              isPrimary: isPrimary,
              uploadedAt: new Date().toISOString()
            };

            // Store in development mode storage
            if (!this.devImageStorage.has(productId)) {
              this.devImageStorage.set(productId, []);
            }
            this.devImageStorage.get(productId)!.push(uploadedImage);

            console.log('✅ Local fallback successful:', uploadedImage);
            return {
              success: true,
              image: uploadedImage
            };
          } catch (fallbackError) {
            console.error('❌ Local fallback also failed:', fallbackError);
          }
        }
        
        return { 
          success: false, 
          error: this.getErrorMessage(uploadError) 
        };
      }

      console.log('✅ File uploaded successfully to storage');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Get image dimensions if possible
      const dimensions = await this.getImageDimensions(file);

      // Generate compressed thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (generateThumbnail && file.type !== 'image/svg+xml') {
        try {
          console.log('🔄 Generating optimal thumbnail with recommended specifications...');
          
          // Generate optimal thumbnail according to recommended specs
          const optimalThumbnail = await ImageCompressionService.generateOptimalThumbnail(
            file,
            'SMALL' // Use small size (150x150) for POS grids
          );

          // Log compression statistics
          const stats = ImageCompressionService.getCompressionStats(file.size, optimalThumbnail.size);
          console.log('📊 Optimal thumbnail stats:', {
            original: stats.originalSize,
            compressed: stats.compressedSize,
            savings: `${stats.savings} (${stats.savingsPercent}%)`,
            ratio: stats.compressionRatio,
            dimensions: `${optimalThumbnail.width}x${optimalThumbnail.height}`,
            format: optimalThumbnail.format
          });

          // Upload optimal thumbnail to storage
          thumbnailUrl = await ImageCompressionService.uploadCompressedThumbnail(
            optimalThumbnail,
            productId,
            file.name,
            bucket
          );

          if (thumbnailUrl) {
            console.log('✅ Optimal thumbnail uploaded successfully');
          } else {
            console.warn('⚠️ Failed to upload optimal thumbnail, continuing without thumbnail');
          }
        } catch (error) {
          console.error('❌ Optimal thumbnail generation failed:', error);
          // Continue without thumbnail if generation fails
        }
      }

      // Handle temporary product IDs (don't create database records yet)
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        console.log('📝 Skipping database record for temporary product:', productId);
        
        const uploadedImage: UploadedImage = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          url: urlData.publicUrl,
          thumbnailUrl: thumbnailUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          isPrimary: isPrimary,
          uploadedAt: new Date().toISOString()
        };

        // Store in development mode storage for later retrieval
        if (!this.devImageStorage.has(productId)) {
          this.devImageStorage.set(productId, []);
        }
        this.devImageStorage.get(productId)!.push(uploadedImage);

        console.log('✅ Image uploaded successfully (temporary product):', uploadedImage);
        console.log('📦 Stored in dev storage for product:', productId);
        console.log('📦 Total dev images for this product:', this.devImageStorage.get(productId)!.length);
        console.log('📦 All dev storage keys:', Array.from(this.devImageStorage.keys()));
        console.log('📦 Dev storage size:', this.devImageStorage.size);
        
        return {
          success: true,
          image: uploadedImage
        };
      }

      // For real products, create database record
      const { data: dbData, error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          file_name: file.name,
          file_size: file.size,
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
  static async deleteImage(imageId: string, bucket: string = 'product-images', productId?: string): Promise<UploadResult> {
    try {
      // Handle temporary products
      if (productId && (productId.startsWith('temp-product-') || productId.startsWith('test-product-'))) {
        console.log('📝 Deleting image for temporary product:', productId, 'imageId:', imageId);
        
        const devImages = this.devImageStorage.get(productId) || [];
        const imageToDelete = devImages.find(img => img.id === imageId);
        
        if (!imageToDelete) {
          console.error('❌ Image not found in development storage:', imageId);
          return { success: false, error: 'Image not found' };
        }
        
        // Remove from development storage
        const updatedImages = devImages.filter(img => img.id !== imageId);
        this.devImageStorage.set(productId, updatedImages);
        
        console.log('✅ Image deleted from development storage:', imageId);
        return { success: true };
      }

      // Handle real products (database and storage deletion)
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
      const extractedProductId = urlParts[urlParts.length - 2];
      const filePath = `${extractedProductId}/${fileName}`;

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
  static async setPrimaryImage(imageId: string, productId?: string): Promise<UploadResult> {
    try {
      // Handle temporary products
      if (productId && (productId.startsWith('temp-product-') || productId.startsWith('test-product-'))) {
        console.log('📝 Setting primary image for temporary product:', productId, 'imageId:', imageId);
        
        const devImages = this.devImageStorage.get(productId) || [];
        
        // Update all images to set isPrimary = false
        devImages.forEach(img => {
          img.isPrimary = false;
        });
        
        // Set the selected image as primary
        const targetImage = devImages.find(img => img.id === imageId);
        if (targetImage) {
          targetImage.isPrimary = true;
          console.log('✅ Primary image set successfully for temporary product:', imageId);
          return { success: true };
        } else {
          console.error('❌ Image not found in development storage:', imageId);
          return { success: false, error: 'Image not found' };
        }
      }

      // Handle real products (database update)
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
   * Get error message from Supabase error
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    return 'Unknown error occurred';
  }

  /**
   * Update product images from temporary product ID to real product ID
   * This method handles the transition from temporary to real product IDs
   */
  static async updateProductImages(tempProductId: string, realProductId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 EnhancedImageUploadService: Updating product images from temp ID to real ID:', { tempProductId, realProductId });
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Failed to get authenticated user:', userError);
        return { success: false, error: 'Authentication required' };
      }

      // Check if we have development mode images stored
      const devImages = this.getDevImages(tempProductId);
      console.log('🔍 EnhancedImageUploadService: Checking dev storage for:', tempProductId);
      console.log('🔍 EnhancedImageUploadService: All dev storage keys:', Array.from(this.devImageStorage.keys()));
      console.log('🔍 EnhancedImageUploadService: Dev storage size:', this.devImageStorage.size);
      console.log('🔍 EnhancedImageUploadService: Found dev images:', devImages?.length || 0);
      
      if (devImages && devImages.length > 0) {
        console.log('🛠️ EnhancedImageUploadService: Found development mode images:', devImages.length);
        
        // Create database records for development mode images
        const imageRecords = devImages.map((img, index) => ({
          product_id: realProductId,
          image_url: img.url,
          thumbnail_url: img.thumbnailUrl,
          file_name: img.fileName,
          file_size: img.fileSize,
          is_primary: index === 0, // First image is primary
          uploaded_by: user.id
        }));

        // Insert all image records
        const { data: insertedImages, error: insertError } = await supabase
          .from('product_images')
          .insert(imageRecords)
          .select();

        if (insertError) {
          console.error('❌ Failed to insert development mode image records:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('✅ EnhancedImageUploadService: Successfully created development mode image records:', { 
          tempProductId, 
          realProductId, 
          createdCount: insertedImages?.length || 0 
        });

        // Clean up development storage
        this.clearDevImages(tempProductId);

        // Clear cache for the real product ID since images were updated
        this.clearImageCache(realProductId);

        return { success: true };
      }

      console.log('📝 EnhancedImageUploadService: No development mode images found for:', tempProductId);
      return { success: true }; // No images to process
      
    } catch (error) {
      console.error('❌ EnhancedImageUploadService: Error updating product images:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
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
