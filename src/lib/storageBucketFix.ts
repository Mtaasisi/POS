import { supabase } from './supabaseClient';

/**
 * Utility to create the product-images bucket if it doesn't exist
 * This can be run manually if the migration didn't create the bucket
 */
export class StorageBucketFix {
  /**
   * Create the product-images bucket manually
   */
  static async createProductImagesBucket(): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      console.log('🔧 Creating product-images bucket...');
      
      // Check if bucket already exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Failed to list buckets:', listError);
        return { success: false, error: listError.message };
      }
      
      const bucketExists = buckets?.some(bucket => bucket.id === 'product-images');
      
      if (bucketExists) {
        console.log('✅ product-images bucket already exists');
        return { success: true, message: 'Bucket already exists' };
      }
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });
      
      if (error) {
        console.error('❌ Failed to create bucket:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ product-images bucket created successfully');
      return { success: true, message: 'Bucket created successfully' };
    } catch (err) {
      console.error('❌ Bucket creation failed:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Alternative: Use a different bucket name that might work
   */
  static async tryAlternativeBucket(): Promise<{
    success: boolean;
    bucketName?: string;
    error?: string;
  }> {
    const alternativeNames = ['product_images', 'images', 'uploads'];
    
    for (const bucketName of alternativeNames) {
      try {
        console.log(`🔍 Trying bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        if (!error) {
          console.log(`✅ Found working bucket: ${bucketName}`);
          return { success: true, bucketName };
        }
      } catch (err) {
        console.log(`❌ Bucket ${bucketName} not available`);
      }
    }
    
    return { success: false, error: 'No alternative buckets found' };
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).StorageBucketFix = StorageBucketFix;
}
