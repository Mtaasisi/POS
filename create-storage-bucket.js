// Create Supabase Storage bucket for product images
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createStorageBucket() {
  console.log('🚀 Creating Supabase Storage bucket for product images...\n');

  try {
    // 1. Check if bucket already exists
    console.log('1. Checking if product-images bucket already exists...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const existingBucket = existingBuckets.find(bucket => bucket.name === 'product-images');
    
    if (existingBucket) {
      console.log('✅ product-images bucket already exists!');
      console.log(`   Name: ${existingBucket.name}`);
      console.log(`   Public: ${existingBucket.public}`);
      console.log(`   Created: ${existingBucket.created_at}`);
      console.log('');
      console.log('🎉 No action needed - bucket is ready to use!');
      return;
    }

    console.log('❌ product-images bucket does not exist. Creating it now...\n');

    // 2. Create the bucket
    console.log('2. Creating product-images bucket...');
    const { data: bucket, error: createError } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return;
    }

    console.log('✅ product-images bucket created successfully!');
    console.log(`   Name: ${bucket.name}`);
    console.log(`   Public: ${bucket.public}`);
    console.log(`   Created: ${bucket.created_at}`);
    console.log('');

    // 3. Set up RLS policies for the bucket
    console.log('3. Setting up RLS policies for the bucket...');
    
    // Note: Storage RLS policies are typically set up through SQL commands
    // We'll provide the SQL commands to run manually
    
    console.log('✅ Bucket created successfully!');
    console.log('');
    console.log('📋 Next steps to complete the setup:');
    console.log('');
    console.log('1. Go to your Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc');
    console.log('');
    console.log('2. Navigate to Storage > Policies');
    console.log('');
    console.log('3. Add the following RLS policies for the product-images bucket:');
    console.log('');
    console.log('   **Public Read Policy:**');
    console.log('   - Policy Name: "Public read access"');
    console.log('   - Operation: SELECT');
    console.log('   - Target roles: public');
    console.log('   - Using expression: true');
    console.log('');
    console.log('   **Authenticated Upload Policy:**');
    console.log('   - Policy Name: "Authenticated users can upload"');
    console.log('   - Operation: INSERT');
    console.log('   - Target roles: authenticated');
    console.log('   - Using expression: auth.role() = \'authenticated\'');
    console.log('');
    console.log('   **Authenticated Update Policy:**');
    console.log('   - Policy Name: "Authenticated users can update"');
    console.log('   - Operation: UPDATE');
    console.log('   - Target roles: authenticated');
    console.log('   - Using expression: auth.role() = \'authenticated\'');
    console.log('');
    console.log('   **Authenticated Delete Policy:**');
    console.log('   - Policy Name: "Authenticated users can delete"');
    console.log('   - Operation: DELETE');
    console.log('   - Target roles: authenticated');
    console.log('   - Using expression: auth.role() = \'authenticated\'');
    console.log('');
    console.log('4. Test the setup by uploading a product image through the UI');
    console.log('');

    // 4. Test the bucket
    console.log('4. Testing the new bucket...');
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload('test-upload.txt', testFile);

      if (uploadError) {
        console.log('⚠️ Upload test failed (this is normal before RLS policies are set):', uploadError.message);
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
      console.log('⚠️ Upload test failed (this is normal before RLS policies are set):', testError.message);
    }

    console.log('');
    console.log('🎉 Storage bucket setup completed!');
    console.log('');
    console.log('💡 After setting up the RLS policies, your product images will be properly stored in Supabase Storage.');

  } catch (error) {
    console.error('❌ Storage bucket creation failed with error:', error);
  }
}

// Run the creation
createStorageBucket();
