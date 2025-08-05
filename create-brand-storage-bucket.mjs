import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function createBrandStorageBucket() {
  try {
    console.log('🔧 Creating brand-assets storage bucket...');
    
    // Create the storage bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('brand-assets', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Brand assets bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Brand assets bucket created successfully');
    }

    // Verify the bucket was created
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    console.log('🎉 Brand storage setup completed successfully!');
    console.log('📁 Bucket: brand-assets');
    console.log('🔓 Public read access enabled');
    console.log('📏 File size limit: 2MB');
    console.log('🖼️ Allowed types: JPEG, PNG, SVG, WebP');

  } catch (error) {
    console.error('❌ Error setting up brand storage:', error);
  }
}

// Run the setup
createBrandStorageBucket(); 