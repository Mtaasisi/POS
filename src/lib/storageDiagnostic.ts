import { supabase } from './supabaseClient';

/**
 * Diagnostic utility to check Supabase storage configuration
 */
export class StorageDiagnostic {
  /**
   * Check if the product-images bucket exists
   */
  static async checkProductImagesBucket(): Promise<{
    exists: boolean;
    error?: string;
    bucketInfo?: any;
  }> {
    try {
      console.log('🔍 Checking if product-images bucket exists...');
      
      // Try to list objects in the bucket (this will fail if bucket doesn't exist)
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });
      
      if (error) {
        console.error('❌ Bucket check failed:', error);
        return { exists: false, error: error.message };
      }
      
      console.log('✅ product-images bucket exists');
      return { exists: true, bucketInfo: data };
    } catch (err) {
      console.error('❌ Storage diagnostic failed:', err);
      return { 
        exists: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Test uploading a small test file to the bucket
   */
  static async testUpload(): Promise<{
    success: boolean;
    error?: string;
    url?: string;
  }> {
    try {
      console.log('🧪 Testing upload to product-images bucket...');
      
      // Create a small test file
      const testContent = 'test';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      const testFileName = `test_${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(testFileName, testFile);
      
      if (error) {
        console.error('❌ Test upload failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Test upload successful:', data);
      
      // Clean up the test file
      await supabase.storage
        .from('product-images')
        .remove([testFileName]);
      
      return { success: true, url: data.path };
    } catch (err) {
      console.error('❌ Test upload failed:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Run full diagnostic
   */
  static async runDiagnostic(): Promise<{
    bucketExists: boolean;
    uploadWorks: boolean;
    recommendations: string[];
  }> {
    console.log('🔍 Running Supabase storage diagnostic...');
    
    const bucketCheck = await this.checkProductImagesBucket();
    const uploadTest = bucketCheck.exists ? await this.testUpload() : { success: false };
    
    const recommendations: string[] = [];
    
    if (!bucketCheck.exists) {
      recommendations.push('The product-images bucket does not exist. You need to run the migration to create it.');
      recommendations.push('Run: supabase db push or apply the migration manually in your Supabase dashboard.');
    }
    
    if (bucketCheck.exists && !uploadTest.success) {
      recommendations.push('Bucket exists but upload failed. Check RLS policies and permissions.');
    }
    
    if (bucketCheck.exists && uploadTest.success) {
      recommendations.push('Storage is working correctly! The 400 error might be due to file path issues.');
    }
    
    return {
      bucketExists: bucketCheck.exists,
      uploadWorks: uploadTest.success,
      recommendations
    };
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).StorageDiagnostic = StorageDiagnostic;
}
