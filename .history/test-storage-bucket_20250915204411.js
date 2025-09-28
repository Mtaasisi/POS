// Test script to verify storage bucket and upload functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageBucket() {
  console.log('🧪 Testing storage bucket and upload functionality...');
  
  try {
    // Test 1: Check if bucket exists
    console.log('\n1. Checking if product-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists');
      console.log(`📊 Bucket info:`, {
        id: productImagesBucket.id,
        name: productImagesBucket.name,
        public: productImagesBucket.public,
        file_size_limit: productImagesBucket.file_size_limit,
        allowed_mime_types: productImagesBucket.allowed_mime_types
      });
    } else {
      console.log('❌ product-images bucket does not exist');
      console.log('📋 Available buckets:', buckets.map(b => b.id));
      return;
    }
    
    // Test 2: Check bucket contents
    console.log('\n2. Checking bucket contents...');
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError.message);
    } else {
      console.log(`📁 Found ${files.length} files in bucket`);
      if (files.length > 0) {
        console.log('📋 Recent files:');
        files.slice(0, 5).forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`);
        });
      }
    }
    
    // Test 3: Check spare_part_images table
    console.log('\n3. Checking spare_part_images table...');
    const { data: images, error: imagesError } = await supabase
      .from('spare_part_images')
      .select('*')
      .limit(5);
    
    if (imagesError) {
      console.error('❌ Error querying spare_part_images:', imagesError.message);
    } else {
      console.log(`📊 Found ${images.length} records in spare_part_images table`);
      if (images.length > 0) {
        console.log('📋 Recent records:');
        images.forEach(img => {
          console.log(`  - ${img.file_name} (${img.is_primary ? 'PRIMARY' : 'secondary'})`);
          console.log(`    Main: ${img.image_url ? '✅' : '❌'}`);
          console.log(`    Thumbnail: ${img.thumbnail_url ? '✅' : '❌'}`);
        });
      }
    }
    
    console.log('\n🎉 Storage bucket test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testStorageBucket();
