import { supabase } from './supabaseClient';

export const testStorageBucket = async () => {
  try {
    console.log('🧪 Testing storage bucket configuration...');
    
    // Test 1: Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError);
      return false;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found');
      console.log('📦 Available buckets:', buckets);
      return false;
    }
    
    console.log('✅ product-images bucket found:', productImagesBucket);
    
    // Test 2: Check bucket configuration
    console.log('🔍 Bucket configuration:', {
      id: productImagesBucket.id,
      name: productImagesBucket.name,
      public: productImagesBucket.public,
      fileSizeLimit: productImagesBucket.fileSizeLimit,
      allowedMimeTypes: productImagesBucket.allowedMimeTypes
    });
    
    // Test 3: Try to list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('temp', { limit: 1 });
    
    if (listError) {
      console.error('❌ Failed to list files:', listError);
      console.error('❌ List error details:', {
        message: listError.message,
        statusCode: listError.statusCode,
        error: listError.error,
        details: listError.details
      });
      return false;
    }
    
    console.log('✅ Successfully listed files in bucket');
    console.log('📁 Files in temp folder:', files);
    
    // Test 4: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return false;
    }
    
    console.log('✅ Authentication successful, user:', user.id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
};
