// Debug script for creating spare parts
// Run this in your browser console to test spare part creation

console.log('🔍 Debug: Testing Spare Part Creation...\n');

// Get the supabase client from your app
const { supabase } = await import('./src/lib/supabaseClient.ts');

async function testSparePartCreation() {
  try {
    // Test data for creating a new spare part
    const testData = {
      name: 'Test Spare Part ' + Date.now(),
      partNumber: 'TEST-' + Date.now(), // Unique part number
      categoryId: 'fa675fbd-d6ac-40f0-a496-3003e8846464', // Use existing category
      brand: 'Test Brand',
      supplierId: '1b4a37b5-627a-4a47-906b-918aaea065a9', // Use existing supplier
      condition: 'new', // Valid condition
      description: 'Test description',
      costPrice: 10.00,
      sellingPrice: 15.00,
      quantity: 5,
      minQuantity: 1,
      location: 'Test Location',
      compatibleDevices: 'Test Device'
    };

    console.log('📝 Test data:', testData);

    // First, let's validate the foreign keys exist
    console.log('\n🔍 Validating foreign keys...');
    
    const { data: categoryExists } = await supabase
      .from('lats_categories')
      .select('id, name')
      .eq('id', testData.categoryId)
      .single();
    
    if (categoryExists) {
      console.log('✅ Category exists:', categoryExists.name);
    } else {
      console.error('❌ Category not found:', testData.categoryId);
      return;
    }

    const { data: supplierExists } = await supabase
      .from('lats_suppliers')
      .select('id, name')
      .eq('id', testData.supplierId)
      .single();
    
    if (supplierExists) {
      console.log('✅ Supplier exists:', supplierExists.name);
    } else {
      console.error('❌ Supplier not found:', testData.supplierId);
      return;
    }

    // Check if part number already exists
    console.log('\n🔍 Checking for duplicate part number...');
    const { data: existingPart } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number')
      .eq('part_number', testData.partNumber)
      .single();

    if (existingPart) {
      console.error('❌ Part number already exists:', existingPart);
      return;
    } else {
      console.log('✅ Part number is unique');
    }

    // Convert to database format
    const databaseData = {
      name: testData.name,
      part_number: testData.partNumber,
      category_id: testData.categoryId,
      brand: testData.brand,
      supplier_id: testData.supplierId,
      condition: testData.condition,
      description: testData.description,
      cost_price: testData.costPrice,
      selling_price: testData.sellingPrice,
      quantity: testData.quantity,
      min_quantity: testData.minQuantity,
      location: testData.location,
      compatible_devices: testData.compatibleDevices,
      created_by: null, // Will be set by database
      updated_by: null  // Will be set by database
    };

    console.log('\n📊 Database data:', databaseData);

    // Try to insert
    console.log('\n🚀 Attempting to create spare part...');
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .insert(databaseData)
      .select()
      .single();

    if (error) {
      console.error('❌ Creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Spare part created successfully:', data);
      
      // Verify it was actually saved
      setTimeout(async () => {
        const { data: verifyData, error: verifyError } = await supabase
          .from('lats_spare_parts')
          .select('*')
          .eq('id', data.id)
          .single();
        
        if (verifyError) {
          console.error('❌ Verification failed:', verifyError);
        } else {
          console.log('✅ Verification successful - data persisted:', verifyData);
        }
      }, 1000);
    }

  } catch (error) {
    console.error('❌ Exception during test:', error);
  }
}

// Also check current user authentication
console.log('\n🔐 Checking authentication...');
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError) {
  console.error('❌ Auth error:', authError);
} else {
  console.log('✅ Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in');
}

testSparePartCreation();
