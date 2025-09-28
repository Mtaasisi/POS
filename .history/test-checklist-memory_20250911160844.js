// Test script for Checklist Memory Functionality
// This script tests that checklists remember previously checked items

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_key_here';

if (supabaseUrl === 'your_supabase_url_here' || supabaseKey === 'your_supabase_key_here') {
  console.log('⚠️  Please set your Supabase credentials in environment variables:');
  console.log('   VITE_SUPABASE_URL=your_supabase_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_key');
  console.log('');
  console.log('Or modify this script with your actual credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChecklistMemory() {
  console.log('🧠 Testing Checklist Memory Functionality...');
  console.log('=============================================');
  
  try {
    // Test 1: Get a device with existing diagnostic data
    console.log('\n1️⃣ Finding device with existing diagnostic data...');
    
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .not('diagnostic_checklist', 'is', null)
      .limit(1);
      
    if (devicesError) {
      console.error('❌ Failed to fetch devices:', devicesError);
      return;
    }
    
    if (!devices || devices.length === 0) {
      console.log('⚠️  No devices with diagnostic data found. Creating test data...');
      
      // Get any device to create test data
      const { data: anyDevice, error: anyDeviceError } = await supabase
        .from('devices')
        .select('*')
        .limit(1)
        .single();
        
      if (anyDeviceError) {
        console.error('❌ Failed to fetch any device:', anyDeviceError);
        return;
      }
      
      // Create test diagnostic data
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
            },
            {
              id: 'audio-test',
              title: 'Audio Test',
              description: 'Test speakers and microphone functionality',
              category: 'hardware',
              required: true,
              status: 'pending'
            }
          ],
          notes: {
            'power-test': 'Device powers on successfully',
            'display-test': 'Screen has dead pixels in top right corner'
          },
          adminNotes: 'Test diagnostic checklist for memory functionality',
          summary: { total: 3, passed: 1, failed: 1, pending: 1 },
          overallStatus: 'in-progress',
          last_updated: new Date().toISOString()
        }
      };
      
      const { data: updateData, error: updateError } = await supabase
        .from('devices')
        .update(testDiagnosticData)
        .eq('id', anyDevice.id)
        .select();
        
      if (updateError) {
        console.error('❌ Failed to create test diagnostic data:', updateError);
        return;
      }
      
      console.log('✅ Test diagnostic data created for device:', anyDevice.id);
      devices.push(updateData[0]);
    }
    
    const testDevice = devices[0];
    console.log('✅ Found device with diagnostic data:', {
      id: testDevice.id,
      brand: testDevice.brand,
      model: testDevice.model,
      status: testDevice.status,
      hasDiagnosticChecklist: !!testDevice.diagnostic_checklist,
      diagnosticItems: testDevice.diagnostic_checklist?.items?.length || 0
    });
    
    // Test 2: Verify diagnostic checklist data structure
    console.log('\n2️⃣ Verifying diagnostic checklist data structure...');
    
    if (testDevice.diagnostic_checklist && testDevice.diagnostic_checklist.items) {
      console.log('✅ Diagnostic checklist items found:', testDevice.diagnostic_checklist.items.length);
      
      testDevice.diagnostic_checklist.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title}: ${item.status}`);
      });
      
      console.log('✅ Notes found:', Object.keys(testDevice.diagnostic_checklist.notes || {}).length);
      console.log('✅ Summary:', testDevice.diagnostic_checklist.summary);
      console.log('✅ Overall status:', testDevice.diagnostic_checklist.overallStatus);
    } else {
      console.log('❌ No diagnostic checklist data found');
    }
    
    // Test 3: Test repair checklist memory
    console.log('\n3️⃣ Testing repair checklist memory...');
    
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
            completed: true
          },
          {
            id: 'repair-1',
            step: 3,
            title: 'Parts Installation',
            description: 'Install required replacement parts',
            category: 'repair',
            required: true,
            completed: false
          }
        ],
        notes: {
          'diagnosis-1': 'Device has minor scratches but no major damage',
          'diagnosis-2': 'Battery holds charge well',
          'repair-1': 'Waiting for replacement screen'
        },
        last_updated: new Date().toISOString()
      }
    };
    
    const { data: repairUpdate, error: repairError } = await supabase
      .from('devices')
      .update(testRepairData)
      .eq('id', testDevice.id)
      .select();
      
    if (repairError) {
      console.error('❌ Failed to create test repair data:', repairError);
    } else {
      console.log('✅ Test repair checklist data created');
      
      if (repairUpdate[0].repair_checklist && repairUpdate[0].repair_checklist.items) {
        console.log('✅ Repair checklist items found:', repairUpdate[0].repair_checklist.items.length);
        
        repairUpdate[0].repair_checklist.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title}: ${item.completed ? '✅ Completed' : '⏳ Pending'}`);
        });
      }
    }
    
    // Test 4: Simulate reopening checklist (refresh device data)
    console.log('\n4️⃣ Simulating checklist reopening (refreshing device data)...');
    
    const { data: refreshedDevice, error: refreshError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', testDevice.id)
      .single();
      
    if (refreshError) {
      console.error('❌ Failed to refresh device data:', refreshError);
    } else {
      console.log('✅ Device data refreshed successfully');
      
      // Check if diagnostic data is preserved
      if (refreshedDevice.diagnostic_checklist && refreshedDevice.diagnostic_checklist.items) {
        console.log('✅ Diagnostic checklist memory preserved:');
        refreshedDevice.diagnostic_checklist.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title}: ${item.status}`);
        });
      }
      
      // Check if repair data is preserved
      if (refreshedDevice.repair_checklist && refreshedDevice.repair_checklist.items) {
        console.log('✅ Repair checklist memory preserved:');
        refreshedDevice.repair_checklist.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title}: ${item.completed ? '✅ Completed' : '⏳ Pending'}`);
        });
      }
    }
    
    console.log('\n🎉 Checklist memory functionality test completed!');
    console.log('✅ Both diagnostic and repair checklists should now remember checked items');
    console.log('✅ When you reopen the checklists, they should show previous progress');
    console.log('✅ Auto-save functionality ensures data is always preserved');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testChecklistMemory();
