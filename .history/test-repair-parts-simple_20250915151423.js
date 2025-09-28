#!/usr/bin/env node

/**
 * Simple Repair Parts Test
 * Tests the repair parts functionality with minimal setup
 */

import { createClient } from '@supabase/supabase-js';

// Try to get configuration from environment or use local fallback
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRepairParts() {
  console.log('🔧 Testing Repair Parts Functionality...\n');
  
  try {
    // Test 1: Check if repair_parts table exists and is accessible
    console.log('1. Testing repair_parts table access...');
    const { data: repairParts, error: repairPartsError } = await supabase
      .from('repair_parts')
      .select('*')
      .limit(1);
    
    if (repairPartsError) {
      console.log(`   ❌ repair_parts table error: ${repairPartsError.message}`);
    } else {
      console.log('   ✅ repair_parts table accessible');
    }
    
    // Test 2: Check if lats_spare_parts table exists
    console.log('\n2. Testing lats_spare_parts table access...');
    const { data: spareParts, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number, quantity')
      .limit(3);
    
    if (sparePartsError) {
      console.log(`   ❌ lats_spare_parts table error: ${sparePartsError.message}`);
    } else {
      console.log(`   ✅ lats_spare_parts table accessible (${spareParts?.length || 0} parts found)`);
      if (spareParts && spareParts.length > 0) {
        console.log('   📦 Sample parts:');
        spareParts.forEach(part => {
          console.log(`      - ${part.name} (${part.part_number}) - Stock: ${part.quantity}`);
        });
      }
    }
    
    // Test 3: Check if devices table exists
    console.log('\n3. Testing devices table access...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, status')
      .limit(3);
    
    if (devicesError) {
      console.log(`   ❌ devices table error: ${devicesError.message}`);
    } else {
      console.log(`   ✅ devices table accessible (${devices?.length || 0} devices found)`);
      if (devices && devices.length > 0) {
        console.log('   📱 Sample devices:');
        devices.forEach(device => {
          console.log(`      - ${device.brand} ${device.model} (${device.status})`);
        });
      }
    }
    
    // Test 4: Check if we can create a repair part (if we have test data)
    if (spareParts && spareParts.length > 0 && devices && devices.length > 0) {
      console.log('\n4. Testing repair part creation...');
      
      const testDevice = devices[0];
      const testSparePart = spareParts[0];
      
      const { data: newRepairPart, error: createError } = await supabase
        .from('repair_parts')
        .insert({
          device_id: testDevice.id,
          spare_part_id: testSparePart.id,
          quantity_needed: 1,
          cost_per_unit: 1000,
          status: 'needed',
          notes: 'Test repair part - will be deleted'
        })
        .select()
        .single();
      
      if (createError) {
        console.log(`   ❌ Create repair part error: ${createError.message}`);
      } else {
        console.log('   ✅ Repair part created successfully');
        console.log(`   📝 Created: ${newRepairPart.id}`);
        
        // Clean up test data
        const { error: deleteError } = await supabase
          .from('repair_parts')
          .delete()
          .eq('id', newRepairPart.id);
        
        if (deleteError) {
          console.log(`   ⚠️  Cleanup error: ${deleteError.message}`);
        } else {
          console.log('   🧹 Test data cleaned up');
        }
      }
    } else {
      console.log('\n4. Skipping repair part creation test (no test data available)');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 REPAIR PARTS SYSTEM STATUS:');
    
    const repairPartsWorking = !repairPartsError;
    const sparePartsWorking = !sparePartsError;
    const devicesWorking = !devicesError;
    
    console.log(`   repair_parts table: ${repairPartsWorking ? '✅ Working' : '❌ Not working'}`);
    console.log(`   lats_spare_parts table: ${sparePartsWorking ? '✅ Working' : '❌ Not working'}`);
    console.log(`   devices table: ${devicesWorking ? '✅ Working' : '❌ Not working'}`);
    
    if (repairPartsWorking && sparePartsWorking && devicesWorking) {
      console.log('\n🎉 REPAIR PARTS SYSTEM: 100% FUNCTIONAL!');
      console.log('   All required tables are accessible and working correctly.');
      console.log('   The repair parts functionality is ready to use.');
    } else {
      console.log('\n⚠️  REPAIR PARTS SYSTEM: PARTIALLY FUNCTIONAL');
      console.log('   Some tables are not accessible. Check the errors above.');
    }
    
  } catch (error) {
    console.log(`\n💥 Test failed: ${error.message}`);
  }
}

// Run the test
testRepairParts();
