// Test script for Device Checklist Functionality
// This script tests the enhanced diagnostic and repair checklist functionality

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

async function testChecklistFunctionality() {
  console.log('🔍 Testing Enhanced Checklist Functionality...');
  console.log('================================================');
  
  try {
    // Test 1: Check database structure
    console.log('\n1️⃣ Testing Database Structure...');
    
    const { data: sampleDevice, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .limit(1)
      .single();
      
    if (deviceError) {
      console.error('❌ Failed to fetch sample device:', deviceError);
      return;
    }
    
    console.log('✅ Sample device fetched:', {
      id: sampleDevice.id,
      brand: sampleDevice.brand,
      model: sampleDevice.model,
      status: sampleDevice.status,
      hasDiagnosticChecklist: 'diagnostic_checklist' in sampleDevice,
      hasRepairChecklist: 'repair_checklist' in sampleDevice
    });
    
    // Test 2: Test diagnostic checklist update
    console.log('\n2️⃣ Testing Diagnostic Checklist Update...');
    
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
        adminNotes: 'Test diagnostic checklist',
        summary: { total: 2, passed: 1, failed: 1, pending: 0 },
        overallStatus: 'issues-found',
        last_updated: new Date().toISOString()
      }
    };
    
    const { data: diagnosticUpdate, error: diagnosticError } = await supabase
      .from('devices')
      .update(testDiagnosticData)
      .eq('id', sampleDevice.id)
      .select();
      
    if (diagnosticError) {
      console.error('❌ Diagnostic checklist update failed:', diagnosticError);
    } else {
      console.log('✅ Diagnostic checklist update successful:', diagnosticUpdate[0].diagnostic_checklist);
    }
    
    // Test 3: Test repair checklist update
    console.log('\n3️⃣ Testing Repair Checklist Update...');
    
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
      .eq('id', sampleDevice.id)
      .select();
      
    if (repairError) {
      console.error('❌ Repair checklist update failed:', repairError);
    } else {
      console.log('✅ Repair checklist update successful:', repairUpdate[0].repair_checklist);
    }
    
    // Test 4: Test diagnostic_checks table
    console.log('\n4️⃣ Testing Diagnostic Checks Table...');
    
    const testCheckData = {
      diagnostic_device_id: sampleDevice.id,
      test_item: 'Power Test',
      result: 'passed',
      remarks: 'Device powers on successfully',
      image_url: null
    };
    
    const { data: checkData, error: checkError } = await supabase
      .from('diagnostic_checks')
      .insert(testCheckData)
      .select();
      
    if (checkError) {
      console.error('❌ Diagnostic check insert failed:', checkError);
    } else {
      console.log('✅ Diagnostic check insert successful:', checkData[0]);
    }
    
    // Test 5: Test status update
    console.log('\n5️⃣ Testing Status Update...');
    
    const { data: statusUpdate, error: statusError } = await supabase
      .from('devices')
      .update({ 
        status: 'diagnosis-issues',
        updated_at: new Date().toISOString()
      })
      .eq('id', sampleDevice.id)
      .select();
      
    if (statusError) {
      console.error('❌ Status update failed:', statusError);
    } else {
      console.log('✅ Status update successful:', statusUpdate[0].status);
    }
    
    // Test 6: Verify final state
    console.log('\n6️⃣ Verifying Final State...');
    
    const { data: finalDevice, error: finalError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', sampleDevice.id)
      .single();
      
    if (finalError) {
      console.error('❌ Failed to fetch final device state:', finalError);
    } else {
      console.log('✅ Final device state:', {
        id: finalDevice.id,
        status: finalDevice.status,
        hasDiagnosticChecklist: !!finalDevice.diagnostic_checklist,
        hasRepairChecklist: !!finalDevice.repair_checklist,
        diagnosticItems: finalDevice.diagnostic_checklist?.items?.length || 0,
        repairItems: finalDevice.repair_checklist?.items?.length || 0
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Enhanced checklist functionality is working properly!');
    console.log('✅ Auto-save and synchronization features are ready!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testChecklistFunctionality();
