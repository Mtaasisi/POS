import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBucket() {
  console.log('🔍 Checking product-images bucket...');
  
  try {
    // Check if bucket exists by trying to list objects
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('❌ Bucket check failed:', error);
      
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        console.log('📝 Bucket does not exist. Creating it...');
        await createBucket();
      } else {
        console.error('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ product-images bucket exists');
      console.log('📊 Bucket data:', data);
    }
  } catch (err) {
    console.error('❌ Storage check failed:', err);
  }
}

async function createBucket() {
  try {
    console.log('🔧 Creating product-images bucket...');
    
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });
    
    if (error) {
      console.error('❌ Failed to create bucket:', error);
    } else {
      console.log('✅ Bucket created successfully:', data);
    }
  } catch (err) {
    console.error('❌ Bucket creation failed:', err);
  }
}

// Run the check
checkStorageBucket();