// Debug script to test device updates in the browser console
// Copy and paste this into your browser console to test device updates

async function debugDeviceUpdate() {
  console.log('🔍 Starting device update debug...');
  
  // Test device ID from the error (you can change this to any valid device ID)
  const testDeviceId = 'a4504cd2-5ea9-4b34-a73d-25dd75b0741d';
  
  try {
    // Step 1: Check if device exists
    console.log('1️⃣ Checking if device exists...');
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', testDeviceId)
      .single();
      
    if (fetchError) {
      console.error('❌ Device not found:', fetchError);
      console.log('💡 Try using a different device ID that exists in your database');
      return;
    }
    
    console.log('✅ Device found:', {
      id: device.id,
      brand: device.brand,
      model: device.model,
      status: device.status,
      customer_id: device.customer_id
    });
    
    // Step 2: Test a simple update using updateDeviceInDb
    console.log('2️⃣ Testing updateDeviceInDb function...');
    
    // Import the function (this should work if you're in the app context)
    if (typeof updateDeviceInDb === 'function') {
      const updateData = {
        status: device.status === 'assigned' ? 'diagnosis-started' : 'assigned',
        estimatedHours: 2
      };
      
      console.log('📝 Update data:', updateData);
      
      const result = await updateDeviceInDb(testDeviceId, updateData);
      console.log('✅ updateDeviceInDb result:', result);
    } else {
      console.log('⚠️ updateDeviceInDb function not available in this context');
    }
    
    // Step 3: Test direct Supabase update
    console.log('3️⃣ Testing direct Supabase update...');
    const { data: updateData, error: updateError } = await supabase
      .from('devices')
      .update({ 
        updated_at: new Date().toISOString(),
        estimated_hours: 3
      })
      .eq('id', testDeviceId)
      .select();
      
    if (updateError) {
      console.error('❌ Direct update failed:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Direct update successful:', updateData);
    }
    
    // Step 4: Verify the update
    console.log('4️⃣ Verifying the update...');
    const { data: updatedDevice, error: verifyError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', testDeviceId)
      .single();
      
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Device after update:', {
        id: updatedDevice.id,
        status: updatedDevice.status,
        estimated_hours: updatedDevice.estimated_hours,
        updated_at: updatedDevice.updated_at
      });
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Helper function to test with a specific device ID
async function testDeviceUpdateById(deviceId) {
  console.log(`🔍 Testing device update for ID: ${deviceId}`);
  
  try {
    // Check if device exists
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();
      
    if (fetchError) {
      console.error('❌ Device not found:', fetchError);
      return;
    }
    
    console.log('✅ Device found:', device);
    
    // Test update
    const { data: updateData, error: updateError } = await supabase
      .from('devices')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId)
      .select();
      
    if (updateError) {
      console.error('❌ Update failed:', updateError);
    } else {
      console.log('✅ Update successful:', updateData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to list recent devices
async function listRecentDevices() {
  console.log('📋 Listing recent devices...');
  
  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, brand, model, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Failed to fetch devices:', error);
      return;
    }
    
    console.log('📱 Recent devices:');
    devices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.brand} ${device.model} (${device.status}) - ID: ${device.id}`);
    });
    
    return devices;
  } catch (error) {
    console.error('❌ Failed to list devices:', error);
  }
}

console.log('🚀 Device update debug functions loaded!');
console.log('Available functions:');
console.log('- debugDeviceUpdate() - Test the original failing device');
console.log('- testDeviceUpdateById(deviceId) - Test with a specific device ID');
console.log('- listRecentDevices() - List recent devices to get valid IDs');
console.log('');
console.log('Run debugDeviceUpdate() to start testing...');