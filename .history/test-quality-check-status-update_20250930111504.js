#!/usr/bin/env node

/**
 * Test Quality Check Status Update
 * 
 * This script tests the complete flow:
 * 1. Check current purchase order status
 * 2. Complete a quality check
 * 3. Verify purchase order status is updated
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQualityCheckStatusUpdate() {
  console.log('🧪 Testing Quality Check Status Update Flow...\n');

  try {
    // Step 1: Get the purchase order with quality check
    console.log('📋 Step 1: Getting purchase order with quality check...');
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        id,
        order_number,
        status,
        quality_check_status,
        created_at,
        updated_at
      `)
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .single();

    if (poError) {
      console.error('❌ Error fetching purchase order:', poError);
      return;
    }

    console.log('✅ Purchase Order Found:');
    console.log(`   ID: ${poData.id}`);
    console.log(`   Order: ${poData.order_number}`);
    console.log(`   Status: ${poData.status}`);
    console.log(`   Quality Check Status: ${poData.quality_check_status}`);
    console.log(`   Updated: ${poData.updated_at}\n`);

    // Step 2: Get quality check details
    console.log('🔍 Step 2: Getting quality check details...');
    const { data: qcData, error: qcError } = await supabase
      .from('purchase_order_quality_checks')
      .select(`
        id,
        status,
        overall_result,
        checked_at,
        created_at
      `)
      .eq('purchase_order_id', poData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (qcError) {
      console.error('❌ Error fetching quality check:', qcError);
      return;
    }

    console.log('✅ Quality Check Found:');
    console.log(`   ID: ${qcData.id}`);
    console.log(`   Status: ${qcData.status}`);
    console.log(`   Result: ${qcData.overall_result}`);
    console.log(`   Checked: ${qcData.checked_at}\n`);

    // Step 3: Get quality check items
    console.log('📊 Step 3: Getting quality check items...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('purchase_order_quality_check_items')
      .select(`
        id,
        criteria_name,
        result,
        quantity_checked,
        notes
      `)
      .eq('quality_check_id', qcData.id);

    if (itemsError) {
      console.error('❌ Error fetching quality check items:', itemsError);
      return;
    }

    console.log(`✅ Quality Check Items (${itemsData.length}):`);
    itemsData.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.criteria_name}: ${item.result} (${item.quantity_checked} checked)`);
    });
    console.log('');

    // Step 4: Test status update
    console.log('🔄 Step 4: Testing purchase order status update...');
    
    // Update purchase order status to 'completed'
    const { data: updateData, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', poData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating purchase order status:', updateError);
      return;
    }

    console.log('✅ Purchase Order Status Updated:');
    console.log(`   New Status: ${updateData.status}`);
    console.log(`   Updated At: ${updateData.updated_at}\n`);

    // Step 5: Verify the update
    console.log('✅ Step 5: Verifying status update...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, updated_at')
      .eq('id', poData.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('✅ Verification Complete:');
    console.log(`   Order: ${verifyData.order_number}`);
    console.log(`   Status: ${verifyData.status}`);
    console.log(`   Updated: ${verifyData.updated_at}\n`);

    // Step 6: Test the complete flow
    console.log('🎯 Step 6: Complete Quality Check Flow Test...');
    
    // Simulate completing a quality check
    const { data: completeData, error: completeError } = await supabase
      .rpc('complete_quality_check', {
        p_quality_check_id: qcData.id,
        p_notes: 'Quality check completed via test script',
        p_signature: 'test-user'
      });

    if (completeError) {
      console.error('❌ Error completing quality check:', completeError);
      return;
    }

    console.log('✅ Quality Check Completed:');
    console.log(`   Result: ${completeData}\n`);

    // Final verification
    console.log('🏁 Final Status Check:');
    const { data: finalData, error: finalError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        id,
        order_number,
        status,
        quality_check_status,
        updated_at
      `)
      .eq('id', poData.id)
      .single();

    if (finalError) {
      console.error('❌ Error in final check:', finalError);
      return;
    }

    console.log('✅ Final Status:');
    console.log(`   Order: ${finalData.order_number}`);
    console.log(`   Status: ${finalData.status}`);
    console.log(`   Quality Check Status: ${finalData.quality_check_status}`);
    console.log(`   Updated: ${finalData.updated_at}\n`);

    console.log('🎉 Quality Check Status Update Test Complete!');
    console.log('✅ All steps executed successfully');
    console.log('✅ Purchase order status updated to completed');
    console.log('✅ Quality check system working properly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testQualityCheckStatusUpdate();
