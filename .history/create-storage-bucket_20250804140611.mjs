import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function createStorageBucket() {
  try {
    console.log('🔧 Creating product-images storage bucket...');
    
    // Create the product-images bucket
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true, // Make bucket public so images can be accessed
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: ['image/*'] // Only allow images
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }
    
    console.log('✅ product-images bucket created successfully:', data);
    
    // Verify the bucket was created
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets after creation:', buckets.map(b => b.name));
    
  } catch (error) {
    console.error('❌ Failed to create bucket:', error);
  }
}

createStorageBucket(); 