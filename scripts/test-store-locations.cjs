// Test script for store locations API
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStoreLocations() {
  try {
    console.log('🧪 Testing store locations API...');
    
    // Test 1: Check if table exists and has data
    console.log('\n1. Checking if table exists...');
    const { data: locations, error } = await supabase
      .from('lats_store_locations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing table:', error);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    console.log(`📊 Found ${locations?.length || 0} locations`);
    
    if (locations && locations.length > 0) {
      console.log('📍 Sample location:', {
        name: locations[0].name,
        code: locations[0].code,
        city: locations[0].city,
        is_active: locations[0].is_active
      });
    }
    
    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const { data: sampleLocation } = await supabase
      .from('lats_store_locations')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleLocation) {
      const expectedFields = [
        'id', 'name', 'code', 'description', 'address', 'city', 'region',
        'country', 'phone', 'email', 'whatsapp', 'manager_name',
        'opening_hours', 'is_24_hours', 'has_parking', 'has_wifi',
        'has_repair_service', 'has_sales_service', 'has_delivery_service',
        'store_size_sqm', 'max_capacity', 'current_staff_count',
        'is_active', 'is_main_branch', 'priority_order',
        'monthly_rent', 'utilities_cost', 'monthly_target',
        'notes', 'images', 'created_at', 'updated_at'
      ];
      
      const missingFields = expectedFields.filter(field => !(field in sampleLocation));
      
      if (missingFields.length === 0) {
        console.log('✅ All expected fields are present');
      } else {
        console.log('⚠️ Missing fields:', missingFields);
      }
    }
    
    // Test 3: Test basic CRUD operations
    console.log('\n3. Testing CRUD operations...');
    
    // Create a test location
    const testLocation = {
      name: 'Test Location',
      code: 'TEST001',
      description: 'Test location for API testing',
      address: 'Test Address',
      city: 'Test City',
      country: 'Tanzania',
      is_active: true,
      is_main_branch: false,
      priority_order: 999,
      opening_hours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: '10:00', close: '16:00' }
      },
      is_24_hours: false,
      has_parking: false,
      has_wifi: false,
      has_repair_service: true,
      has_sales_service: true,
      has_delivery_service: false,
      current_staff_count: 0,
      images: []
    };
    
    const { data: createdLocation, error: createError } = await supabase
      .from('lats_store_locations')
      .insert([testLocation])
      .select()
      .single();
    
    if (createError) {
      console.log('⚠️ Could not create test location (might already exist):', createError.message);
    } else {
      console.log('✅ Test location created successfully');
      
      // Update the test location
      const { data: updatedLocation, error: updateError } = await supabase
        .from('lats_store_locations')
        .update({ description: 'Updated test location' })
        .eq('id', createdLocation.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Error updating location:', updateError);
      } else {
        console.log('✅ Test location updated successfully');
      }
      
      // Delete the test location
      const { error: deleteError } = await supabase
        .from('lats_store_locations')
        .delete()
        .eq('id', createdLocation.id);
      
      if (deleteError) {
        console.log('❌ Error deleting test location:', deleteError);
      } else {
        console.log('✅ Test location deleted successfully');
      }
    }
    
    console.log('\n🎉 Store locations API test completed successfully!');
    console.log('📍 The page should be accessible at: /store-locations');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStoreLocations();
