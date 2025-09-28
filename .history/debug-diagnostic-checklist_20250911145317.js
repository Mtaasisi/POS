// Debug script for Device Diagnostic Checklist functionality
// Copy and paste this into your browser console to test diagnostic checklist operations

async function debugDiagnosticChecklist() {
  console.log('🔍 Starting diagnostic checklist debug...');
  
  try {
    // Step 1: Check if devices table has diagnostic_checklist column
    console.log('1️⃣ Checking devices table structure...');
    const { data: sampleDevice, error: sampleError } = await supabase
      .from('devices')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleError) {
      console.error('❌ Failed to fetch sample device:', sampleError);
      return;
    }
    
    console.log('✅ Sample device fetched:', {
      id: sampleDevice.id,
      brand: sampleDevice.brand,
      model: sampleDevice.model,
      hasDiagnosticChecklist: 'diagnostic_checklist' in sampleDevice,
      hasRepairChecklist: 'repair_checklist' in sampleDevice
    });
    
    // Step 2: Test diagnostic checklist update
    console.log('2️⃣ Testing diagnostic checklist update...');
    
    const testDiagnosticData = {
      diagnostic_checklist: {
        items: [
          {
            id: 'power-test',
            title: 'Power Test',
            description: 'Check if device powers on and boots properly',
            category: 'hardware',
            required: true,
            status: 'pass'
          },
          {
            id: 'display-test',
            title: 'Display Test',
            description: 'Check screen for dead pixels, brightness, and touch response',
            category: 'hardware',
            required: true,
            status: 'fail'
          }
        ],
        notes: {
          'power-test': 'Device powers on successfully',
          'display-test': 'Screen has dead pixels in top right corner'
        },
        adminNotes: 'Test diagnostic from debug script',
        summary: {
          total: 2,
          passed: 1,
          failed: 1,
          pending: 0
        },
        overallStatus: 'issues-found',
        last_updated: new Date().toISOString()
      }
    };
    
    console.log('📝 Test diagnostic data:', testDiagnosticData);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('devices')
      .update(testDiagnosticData)
      .eq('id', sampleDevice.id)
      .select();
      
    if (updateError) {
      console.error('❌ Diagnostic checklist update failed:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Diagnostic checklist update successful:', updateResult);
    }
    
    // Step 3: Test repair checklist update
    console.log('3️⃣ Testing repair checklist update...');
    
    const testRepairData = {
      repair_checklist: {
        items: [
          {
            id: 'diagnosis-1',
            step: 1,
            title: 'Initial Assessment',
            description: 'Examine device for physical damage and power issues',
            category: 'diagnosis',
            required: true,
            completed: true
          },
          {
            id: 'diagnosis-2',
            step: 2,
            title: 'Power Testing',
            description: 'Test device power supply and battery functionality',
            category: 'diagnosis',
            required: true,
            completed: false
          }
        ],
        notes: {
          'diagnosis-1': 'Physical inspection completed - minor scratches found',
          'diagnosis-2': 'Power test in progress'
        },
        last_updated: new Date().toISOString()
      }
    };
    
    console.log('🔧 Test repair data:', testRepairData);
    
    const { data: repairResult, error: repairError } = await supabase
      .from('devices')
      .update(testRepairData)
      .eq('id', sampleDevice.id)
      .select();
      
    if (repairError) {
      console.error('❌ Repair checklist update failed:', repairError);
      console.error('Error details:', {
        message: repairError.message,
        details: repairError.details,
        hint: repairError.hint,
        code: repairError.code
      });
    } else {
      console.log('✅ Repair checklist update successful:', repairResult);
    }
    
    // Step 4: Verify the updates
    console.log('4️⃣ Verifying the updates...');
    const { data: updatedDevice, error: verifyError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', sampleDevice.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Device after updates:', {
        id: updatedDevice.id,
        brand: updatedDevice.brand,
        model: updatedDevice.model,
        status: updatedDevice.status,
        diagnostic_checklist: updatedDevice.diagnostic_checklist,
        repair_checklist: updatedDevice.repair_checklist,
        updated_at: updatedDevice.updated_at
      });
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Helper function to test diagnostic checklist with a specific device
async function testDiagnosticChecklistForDevice(deviceId) {
  console.log(`🔍 Testing diagnostic checklist for device: ${deviceId}`);
  
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
      diagnostic_checklist: device.diagnostic_checklist,
      repair_checklist: device.repair_checklist
    });
    
    // Test diagnostic checklist update
    const diagnosticData = {
      diagnostic_checklist: {
        items: [
          {
            id: 'power-test',
            title: 'Power Test',
            description: 'Check if device powers on and boots properly',
            category: 'hardware',
            required: true,
            status: 'pass'
          }
        ],
        notes: {
          'power-test': 'Device powers on successfully - debug test'
        },
        summary: {
          total: 1,
          passed: 1,
          failed: 0,
          pending: 0
        },
        overallStatus: 'all-passed',
        last_updated: new Date().toISOString()
      }
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('devices')
      .update(diagnosticData)
      .eq('id', deviceId)
      .select();
      
    if (updateError) {
      console.error('❌ Diagnostic update failed:', updateError);
      return false;
    }
    
    console.log('✅ Diagnostic update successful:', updateResult);
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Helper function to test admin notification creation
async function testAdminNotification(deviceId) {
  console.log(`🔔 Testing admin notification creation for device: ${deviceId}`);
  
  try {
    const notificationData = {
      device_id: deviceId,
      type: 'diagnostic_report',
      title: 'Test Diagnostic Report',
      message: 'This is a test diagnostic report from debug script',
      status: 'unread',
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Notification data:', notificationData);
    
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert(notificationData)
      .select();
      
    if (error) {
      console.error('❌ Admin notification creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    console.log('✅ Admin notification created successfully:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Helper function to list devices with diagnostic data
async function listDevicesWithDiagnostics() {
  console.log('📋 Listing devices with diagnostic data...');
  
  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, brand, model, status, diagnostic_checklist, repair_checklist, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Failed to fetch devices:', error);
      return;
    }
    
    console.log('📱 Devices with diagnostic data:');
    devices.forEach((device, index) => {
      const hasDiagnostic = device.diagnostic_checklist && device.diagnostic_checklist.items;
      const hasRepair = device.repair_checklist && device.repair_checklist.items;
      
      console.log(`${index + 1}. ${device.brand} ${device.model} (${device.status})`);
      console.log(`   ID: ${device.id}`);
      console.log(`   Has Diagnostic: ${hasDiagnostic ? 'Yes' : 'No'}`);
      console.log(`   Has Repair: ${hasRepair ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    return devices;
  } catch (error) {
    console.error('❌ Failed to list devices:', error);
  }
}

console.log('🚀 Diagnostic checklist debug functions loaded!');
console.log('Available functions:');
console.log('- debugDiagnosticChecklist() - Test diagnostic and repair checklist updates');
console.log('- testDiagnosticChecklistForDevice(deviceId) - Test diagnostic for specific device');
console.log('- testAdminNotification(deviceId) - Test admin notification creation');
console.log('- listDevicesWithDiagnostics() - List devices with diagnostic data');
console.log('');
console.log('Run debugDiagnosticChecklist() to start testing...');
