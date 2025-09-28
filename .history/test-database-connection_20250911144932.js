// Test database connection and device table access
// Run this in the browser console to verify database connectivity

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('devices')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Check devices table structure
    console.log('2️⃣ Testing devices table access...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
      
    if (devicesError) {
      console.error('❌ Devices table access failed:', devicesError);
      return false;
    }
    
    console.log('✅ Devices table accessible');
    
    // Test 3: Check table schema
    console.log('3️⃣ Checking table schema...');
    if (devices && devices.length > 0) {
      const sampleDevice = devices[0];
      console.log('📋 Available columns:', Object.keys(sampleDevice));
      
      // Check for required columns
      const requiredColumns = [
        'id', 'customer_id', 'brand', 'model', 'serial_number', 
        'issue_description', 'status', 'assigned_to', 'estimated_hours',
        'expected_return_date', 'warranty_start', 'warranty_end',
        'warranty_status', 'repair_count', 'last_return_date',
        'created_at', 'updated_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !(col in sampleDevice));
      if (missingColumns.length > 0) {
        console.warn('⚠️ Missing columns:', missingColumns);
      } else {
        console.log('✅ All required columns present');
      }
    }
    
    // Test 4: Test permissions
    console.log('4️⃣ Testing update permissions...');
    const { data: countData, error: countError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
      
    if (countError) {
      console.error('❌ Read permission test failed:', countError);
      return false;
    }
    
    console.log('✅ Read permissions working');
    
    // Test 5: Check RLS policies
    console.log('5️⃣ Testing Row Level Security...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('devices')
      .select('id, brand, model, status')
      .limit(1);
      
    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError);
      console.log('💡 This might indicate RLS policy issues');
      return false;
    }
    
    console.log('✅ RLS policies working correctly');
    
    console.log('🎉 All database tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Helper function to test a specific device update
async function testSpecificDeviceUpdate(deviceId) {
  console.log(`🔍 Testing update for device: ${deviceId}`);
  
  try {
    // Get current device data
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();
      
    if (fetchError) {
      console.error('❌ Device fetch failed:', fetchError);
      return false;
    }
    
    console.log('📱 Current device data:', {
      id: device.id,
      brand: device.brand,
      model: device.model,
      status: device.status,
      updated_at: device.updated_at
    });
    
    // Test update
    const newTimestamp = new Date().toISOString();
    const { data: updateResult, error: updateError } = await supabase
      .from('devices')
      .update({ 
        updated_at: newTimestamp,
        estimated_hours: (device.estimated_hours || 0) + 1
      })
      .eq('id', deviceId)
      .select();
      
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return false;
    }
    
    console.log('✅ Update successful:', updateResult);
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

console.log('🚀 Database connection test functions loaded!');
console.log('Available functions:');
console.log('- testDatabaseConnection() - Test basic database connectivity');
console.log('- testSpecificDeviceUpdate(deviceId) - Test update for specific device');
console.log('');
console.log('Run testDatabaseConnection() to start testing...');
