import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBucket() {
  try {
    console.log('🔍 Checking existing storage buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check if product-images bucket exists
    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket already exists!');
      return;
    }
    
    console.log('❌ product-images bucket not found. Creating it...');
    
    // Create the product-images bucket
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return;
    }
    
    console.log('✅ product-images bucket created successfully!');
    
    // Create RLS policies
    console.log('🔒 Creating RLS policies...');
    
    // Note: RLS policies need to be created via SQL, not the JS client
    console.log('📝 Please run the following SQL in your Supabase dashboard:');
    console.log(`
-- Create RLS policies for the storage bucket
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
    `);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndCreateBucket();
