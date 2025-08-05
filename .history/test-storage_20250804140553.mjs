import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testStorage() {
  try {
    console.log('🔍 Testing Supabase Storage...');
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Check if product-images bucket exists
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found!');
      return;
    }
    
    console.log('✅ product-images bucket found:', productImagesBucket);
    
    // List files in product-images bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list();
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      return;
    }
    
    console.log('📁 Files in product-images bucket:', files);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorage(); 