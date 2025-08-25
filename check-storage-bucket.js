// Check and setup Supabase Storage bucket for product images
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with actual credentials
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBucket() {
  console.log('🔍 Checking Supabase Storage bucket configuration...\n');

  try {
    // 1. List all buckets
    console.log('1. Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(`✅ Found ${buckets.length} buckets:`);
    buckets.forEach((bucket, index) => {
      console.log(`   ${index + 1}. ${bucket.name} (Public: ${bucket.public})`);
    });
    console.log('');

    // 2. Check if product-images bucket exists
    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      console.log('❌ product-images bucket does not exist!');
      console.log('   This is why images are not being stored in the database storage.');
      console.log('');
      console.log('💡 To fix this, you need to:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Storage section');
      console.log('   3. Create a new bucket named "product-images"');
      console.log('   4. Set it to public');
      console.log('   5. Configure RLS policies');
      return;
    }

    console.log('✅ product-images bucket exists!');
    console.log(`   Name: ${productImagesBucket.name}`);
    console.log(`   Public: ${productImagesBucket.public}`);
    console.log(`   Created: ${productImagesBucket.created_at}`);
    console.log('');

    // 3. List files in the bucket
    console.log('2. Checking files in product-images bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list();

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      console.log('   This might indicate RLS policy issues.');
    } else {
      console.log(`✅ Found ${files.length} files in the bucket:`);
      if (files.length > 0) {
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
        });
      } else {
        console.log('   No files found in the bucket.');
      }
    }
    console.log('');

    // 4. Test file upload (small test)
    console.log('3. Testing file upload capability...');
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload('test-upload.txt', testFile);

      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError);
        console.log('   This indicates RLS policy or permission issues.');
      } else {
        console.log('✅ Upload test successful!');
        console.log(`   File uploaded: ${uploadData.path}`);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('product-images')
          .remove(['test-upload.txt']);

        if (deleteError) {
          console.log('⚠️ Could not clean up test file:', deleteError);
        } else {
          console.log('✅ Test file cleaned up successfully');
        }
      }
    } catch (testError) {
      console.error('❌ Upload test failed with exception:', testError);
    }
    console.log('');

    // 5. Check RLS policies
    console.log('4. Checking RLS policies for storage...');
    console.log('   Note: Storage RLS policies are configured in Supabase dashboard');
    console.log('   under Storage > Policies for the product-images bucket.');
    console.log('');

    console.log('🎉 Storage bucket check completed!');
    console.log('');
    console.log('📝 Summary:');
    if (productImagesBucket) {
      console.log('   ✅ product-images bucket exists');
      console.log('   ✅ Bucket is accessible');
      if (files && files.length > 0) {
        console.log(`   ✅ Found ${files.length} existing files`);
      } else {
        console.log('   ℹ️  No existing files (this is normal for new setup)');
      }
    } else {
      console.log('   ❌ product-images bucket missing');
      console.log('   ❌ Images cannot be stored without the bucket');
    }
    console.log('');
    console.log('💡 Next steps:');
    if (productImagesBucket) {
      console.log('   1. Try uploading a product image through the UI');
      console.log('   2. Check that the image appears in the bucket');
      console.log('   3. Verify the image URL is accessible');
    } else {
      console.log('   1. Create the product-images bucket in Supabase dashboard');
      console.log('   2. Set appropriate RLS policies');
      console.log('   3. Test image upload again');
    }

  } catch (error) {
    console.error('❌ Storage check failed with error:', error);
  }
}

// Run the check
checkStorageBucket();
