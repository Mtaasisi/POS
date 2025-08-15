// Import the main Supabase client and use it for uploads
import { supabase } from './supabaseClient';

// Use the main Supabase client for uploads to ensure proper authentication
const uploadSupabase = supabase;

export interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadResult {
  success: boolean;
  image?: UploadedImage;
  error?: string;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  /**
   * Upload a single image to Supabase storage
   */
  static async uploadImage(
    file: File,
    productId: string,
    userId: string,
    isPrimary: boolean = false
  ): Promise<UploadResult> {
    try {
      console.log('🔍 DEBUG: ImageUploadService.uploadImage called');
      console.log('🔍 DEBUG: Parameters:', { productId, userId, isPrimary });
      console.log('🔍 DEBUG: File info:', { name: file.name, size: file.size, type: file.type });

      // Validate inputs
      if (!file) {
        console.error('❌ DEBUG: No file provided');
        return { success: false, error: 'No file provided' };
      }
      if (!productId) {
        console.error('❌ DEBUG: Product ID is required');
        return { success: false, error: 'Product ID is required' };
      }
      if (!userId) {
        console.error('❌ DEBUG: User ID is required');
        return { success: false, error: 'User ID is required' };
      }

      console.log('✅ DEBUG: Input validation passed');

      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        console.error('❌ DEBUG: File validation failed:', validationResult.error);
        return { success: false, error: validationResult.error };
      }

      console.log('✅ DEBUG: File validation passed');

      // Check authentication
      console.log('🔍 DEBUG: Checking authentication...');
      const { data: { user }, error: authError } = await uploadSupabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ DEBUG: Authentication failed:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ DEBUG: Authentication successful, user:', user.id);

      // Generate safe filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = `${timestamp}_${randomId}.${fileExtension}`;
      
      // Use a simpler path format for temporary products
      const filePath = productId.startsWith('temp-') || productId.startsWith('test-') 
        ? `temp/${safeFileName}`
        : `${productId}/${safeFileName}`;

      console.log('📤 Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        path: filePath
      });
      
      // Additional debugging for file object
      console.log('🔍 DEBUG: File object details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        isFile: file instanceof File,
        constructor: file.constructor.name
      });
      
      // Debug the actual file content type
      console.log('🔍 DEBUG: File type check:', {
        type: file.type,
        typeStartsWithImage: file.type.startsWith('image/'),
        typeIsJson: file.type === 'application/json',
        typeIsUndefined: file.type === undefined,
        typeIsNull: file.type === null
      });
      
      // Create a new File object to ensure it's properly formatted
      const cleanFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      console.log('🔍 DEBUG: Clean file object:', {
        name: cleanFile.name,
        size: cleanFile.size,
        type: cleanFile.type,
        isFile: cleanFile instanceof File
      });
      
      // Alternative: Try using a Blob
      const fileBlob = new Blob([file], { type: file.type });
      console.log('🔍 DEBUG: File blob:', {
        size: fileBlob.size,
        type: fileBlob.type,
        isBlob: fileBlob instanceof Blob
      });

      // Upload to storage
      console.log('🔍 DEBUG: About to upload to Supabase storage');
      console.log('🔍 DEBUG: Upload path:', filePath);
      console.log('🔍 DEBUG: Bucket: product-images');
      
      // Test bucket access - but don't fail if this doesn't work
      try {
        const { data: buckets, error: bucketError } = await uploadSupabase.storage.listBuckets();
        console.log('🔍 DEBUG: Available buckets:', buckets);
        if (bucketError) {
          console.error('❌ DEBUG: Bucket list error:', bucketError);
        }
      } catch (error) {
        console.error('❌ DEBUG: Failed to list buckets:', error);
      }
      
      console.log('🔍 DEBUG: About to call Supabase upload with:', {
        filePath,
        fileName: cleanFile.name,
        fileSize: cleanFile.size,
        fileType: cleanFile.type,
        fileConstructor: cleanFile.constructor.name,
        isFile: cleanFile instanceof File,
        isBlob: cleanFile instanceof Blob
      });
      
      // Try different bucket names in case the bucket doesn't exist
      const bucketNames = ['product-images', 'images', 'uploads', 'files'];
      let uploadData, uploadError;
      let successfulBucket = null;
      
      for (const bucketName of bucketNames) {
        try {
          console.log(`🔍 DEBUG: Trying bucket: ${bucketName}`);
          const result = await uploadSupabase.storage
            .from(bucketName)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          uploadData = result.data;
          uploadError = result.error;
          
          if (!uploadError) {
            console.log(`✅ DEBUG: Upload successful with bucket: ${bucketName}`);
            successfulBucket = bucketName;
            break;
          } else {
            console.log(`❌ DEBUG: Failed with bucket ${bucketName}:`, uploadError);
          }
        } catch (error) {
          console.log(`❌ DEBUG: Exception with bucket ${bucketName}:`, error);
        }
      }
      
      // If no bucket worked, try to create the product-images bucket
      if (!successfulBucket) {
        try {
          console.log('🔍 DEBUG: Attempting to create product-images bucket...');
          const { data: bucketData, error: bucketError } = await uploadSupabase.storage.createBucket('product-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
            fileSizeLimit: 52428800 // 50MB
          });
          
          if (!bucketError) {
            console.log('✅ DEBUG: Created product-images bucket, trying upload again...');
            const result = await uploadSupabase.storage
              .from('product-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });
            uploadData = result.data;
            uploadError = result.error;
            successfulBucket = 'product-images';
          } else {
            console.error('❌ DEBUG: Failed to create bucket:', bucketError);
          }
        } catch (error) {
          console.error('❌ DEBUG: Exception creating bucket:', error);
        }
      }

      if (uploadError) {
        console.error('❌ DEBUG: Upload failed:', uploadError);
        console.error('❌ DEBUG: Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error,
          details: uploadError.details
        });
        return { 
          success: false, 
          error: this.getErrorMessage(uploadError) 
        };
      }

      console.log('✅ DEBUG: File uploaded to storage successfully');
      console.log('✅ DEBUG: Upload data:', uploadData);

      // Get public URL
      console.log('🔍 DEBUG: Getting public URL...');
      const { data: urlData } = uploadSupabase.storage
        .from(successfulBucket || 'product-images')
        .getPublicUrl(filePath);

      console.log('✅ DEBUG: Public URL obtained:', urlData.publicUrl);

      // Handle temporary product IDs (don't create database records yet)
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        console.log('📝 DEBUG: Uploading to storage only for temporary product:', productId);
        
        const uploadedImage: UploadedImage = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString()
        };

        console.log('✅ DEBUG: Image uploaded to storage (temporary):', uploadedImage);
        return {
          success: true,
          image: uploadedImage
        };
      }

      // Create database record for real products
      console.log('🔍 DEBUG: Creating database record for real product...');
      console.log('🔍 DEBUG: Database insert data:', {
        product_id: productId,
        image_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        is_primary: isPrimary,
        uploaded_by: userId
      });

      const { data: dbData, error: dbError } = await uploadSupabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          is_primary: isPrimary,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ DEBUG: Database insert failed:', dbError);
        console.error('❌ DEBUG: Database error details:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        });
        // Clean up uploaded file if database insert fails
        await uploadSupabase.storage
          .from(successfulBucket || 'product-images')
          .remove([filePath]);
        
        return { 
          success: false, 
          error: `Upload succeeded but database record failed: ${dbError.message}` 
        };
      }

      console.log('✅ DEBUG: Database record created successfully');
      console.log('✅ DEBUG: Database data:', dbData);

      const uploadedImage: UploadedImage = {
        id: dbData.id,
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: dbData.created_at
      };

      console.log('✅ DEBUG: Image uploaded successfully:', uploadedImage);
      console.log('✅ DEBUG: Final result:', {
        success: true,
        image: uploadedImage
      });

      return {
        success: true,
        image: uploadedImage
      };

    } catch (error) {
      console.error('❌ DEBUG: Upload error:', error);
      console.error('❌ DEBUG: Error type:', typeof error);
      console.error('❌ DEBUG: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === 0; // First image is primary
      
      console.log(`📤 Uploading image ${i + 1}/${files.length}: ${file.name}`);
      
      const result = await this.uploadImage(file, productId, userId, isPrimary);
      results.push(result);
      
      if (!result.success) {
        console.error(`❌ Failed to upload ${file.name}:`, result.error);
      }
    }
    
    return results;
  }

  /**
   * Delete an image
   */
  static async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get image record
      const { data: image, error: fetchError } = await uploadSupabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError || !image) {
        return { success: false, error: 'Image not found' };
      }

      // Delete from storage
      const urlParts = image.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const productId = urlParts[urlParts.length - 2];
      const filePath = `${productId}/${fileName}`;

      const { error: storageError } = await uploadSupabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Storage delete failed:', storageError);
        return { success: false, error: 'Failed to delete from storage' };
      }

      // Delete database record
      const { error: dbError } = await uploadSupabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Database delete failed:', dbError);
        return { success: false, error: 'Failed to delete database record' };
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
   * Get images for a product
   */
  static async getProductImages(productId: string): Promise<UploadedImage[]> {
    try {
      // Skip query if productId is a temporary ID
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        console.log('📝 Skipping image fetch for temporary product:', productId);
        return [];
      }

      const { data: images, error } = await uploadSupabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to fetch images:', error);
        return [];
      }

      return images.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnailUrl: img.thumbnail_url,
        fileName: img.file_name,
        fileSize: img.file_size,
        mimeType: img.mime_type || 'image/jpeg',
        uploadedAt: img.created_at
      }));

    } catch (error) {
      console.error('❌ Get images error:', error);
      return [];
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'File must be an image'
      };
    }

    return { valid: true };
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    const message = error.message || 'Unknown error';
    const statusCode = error.statusCode || error.status;
    
    console.error('🔍 DEBUG: Error details:', {
      message,
      statusCode,
      error: error.error,
      details: error.details,
      name: error.name
    });
    
    // Handle specific error cases
    if (statusCode === 400) {
      if (message.includes('duplicate')) {
        return 'File with this name already exists. Please rename the file.';
      }
      if (message.includes('size')) {
        return 'File size is too large. Please use a smaller image.';
      }
      if (message.includes('type') || message.includes('mime')) {
        return 'File type not supported. Please use JPEG, PNG, or WebP.';
      }
      if (message.includes('bucket')) {
        return 'Storage bucket not found. Please contact support.';
      }
      return `Upload failed (400): ${message}`;
    }
    
    if (statusCode === 401) {
      return 'Authentication failed. Please log in again.';
    }
    
    if (statusCode === 403) {
      return 'Permission denied. Please check your account access.';
    }
    
    if (statusCode === 404) {
      return 'Storage bucket not found. Please contact support.';
    }
    
    if (statusCode === 413) {
      return 'File size is too large. Please use a smaller image.';
    }
    
    // Generic error handling
    if (message.includes('permission')) {
      return 'Permission denied. Please check your account access.';
    }
    
    if (message.includes('bucket')) {
      return 'Storage bucket not found. Please contact support.';
    }
    
    return `Upload failed: ${message}`;
  }
}
