import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function checkBuckets() {
  try {
    console.log('🔍 Checking existing storage buckets...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 All buckets:', buckets);
    
    // Try to access each bucket
    for (const bucket of buckets) {
      console.log(`\n🔍 Testing bucket: ${bucket.name}`);
      
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list();
        
        if (filesError) {
          console.error(`❌ Error accessing ${bucket.name}:`, filesError);
        } else {
          console.log(`✅ Successfully accessed ${bucket.name}, files:`, files);
        }
      } catch (error) {
        console.error(`❌ Failed to test ${bucket.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkBuckets(); 