// Test script to verify 409 conflict fix for spare parts
// This script tests the upsert functionality to ensure no more 409 errors

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'your-anon-key-here'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSparePartsUpsert() {
  console.log('🧪 Testing spare parts upsert functionality...');
  
  const testPartData = {
    name: 'Test Battery',
    part_number: 'TEST-BAT-001',
    description: 'Test battery for conflict resolution',
    cost_price: 25.00,
    selling_price: 35.00,
    quantity: 10,
    min_quantity: 2,
    location: 'A1-B2',
    category_id: null, // You might need to provide a valid category ID
    brand: 'TestBrand',
    condition: 'new',
    part_type: 'battery',
    primary_device_type: 'mobile'
  };

  try {
    // First insert
    console.log('📝 First insert attempt...');
    const { data: firstInsert, error: firstError } = await supabase
      .from('lats_spare_parts')
      .upsert(testPartData, { 
        onConflict: 'part_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (firstError) {
      console.error('❌ First insert failed:', firstError);
      return;
    }
    
    console.log('✅ First insert successful:', firstInsert.id);

    // Second insert with same part_number (should update, not conflict)
    console.log('📝 Second insert attempt with same part_number...');
    const updatedPartData = {
      ...testPartData,
      quantity: 15, // Changed quantity
      selling_price: 40.00 // Changed price
    };

    const { data: secondInsert, error: secondError } = await supabase
      .from('lats_spare_parts')
      .upsert(updatedPartData, { 
        onConflict: 'part_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (secondError) {
      console.error('❌ Second insert failed:', secondError);
      return;
    }
    
    console.log('✅ Second insert (upsert) successful:', secondInsert.id);
    console.log('📊 Updated quantity:', secondInsert.quantity);
    console.log('📊 Updated price:', secondInsert.selling_price);
    
    // Verify it's the same record
    if (firstInsert.id === secondInsert.id) {
      console.log('✅ Confirmed: Same record was updated (no 409 conflict)');
    } else {
      console.log('⚠️  Warning: Different records created');
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('lats_spare_parts')
      .delete()
      .eq('part_number', 'TEST-BAT-001');

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('🎉 Test completed successfully! No 409 conflicts detected.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSparePartsUpsert();
