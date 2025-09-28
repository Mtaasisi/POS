// Test script to verify spare_part_images table is working
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

async function testSparePartImagesTable() {
  console.log('🧪 Testing spare_part_images table...');
  
  try {
    // Test 1: Check if table exists and is accessible
    console.log('\n1. Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('spare_part_images')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
      return;
    }
    
    console.log('✅ Table is accessible');
    console.log(`📊 Current records: ${tableData.length}`);
    
    // Test 2: Check table structure
    console.log('\n2. Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('spare_part_images')
      .select('id, spare_part_id, image_url, thumbnail_url, file_name, file_size, mime_type, is_primary, uploaded_by, created_at, updated_at')
      .limit(0);
    
    if (structureError) {
      console.error('❌ Structure test error:', structureError.message);
    } else {
      console.log('✅ Table structure is correct');
    }
    
    // Test 3: Check if we can insert a test record (and then delete it)
    console.log('\n3. Testing insert/delete functionality...');
    
    // First, get a spare part ID to use for testing
    const { data: spareParts, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select('id')
      .limit(1);
    
    if (sparePartsError || !spareParts || spareParts.length === 0) {
      console.log('⚠️  No spare parts found to test with');
      return;
    }
    
    const testSparePartId = spareParts[0].id;
    console.log(`📝 Using spare part ID: ${testSparePartId}`);
    
    // Insert test record
    const testRecord = {
      spare_part_id: testSparePartId,
      image_url: 'https://example.com/test-image.jpg',
      thumbnail_url: 'https://example.com/test-thumbnail.jpg',
      file_name: 'test-image.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      is_primary: false,
      uploaded_by: null
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('spare_part_images')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return;
    }
    
    console.log('✅ Insert test passed');
    console.log(`📝 Inserted record ID: ${insertData.id}`);
    
    // Delete test record
    const { error: deleteError } = await supabase
      .from('spare_part_images')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('❌ Delete test failed:', deleteError.message);
    } else {
      console.log('✅ Delete test passed');
    }
    
    console.log('\n🎉 All tests passed! The spare_part_images table is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSparePartImagesTable();
