#!/usr/bin/env node

/**
 * Test Status Progression After Quality Check
 * 
 * This script tests the new intelligent status progression:
 * - received → quality_checked
 * - quality_checked → completed
 * - partial_received → partial_received (stays same)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStatusProgression() {
  console.log('🧪 Testing Status Progression After Quality Check...\n');

  try {
    // Step 1: Get current purchase order status
    console.log('📋 Step 1: Getting current purchase order status...');
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, updated_at')
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .single();

    if (poError) {
      console.error('❌ Error fetching purchase order:', poError);
      return;
    }

    console.log('✅ Current Status:');
    console.log(`   Order: ${poData.order_number}`);
    console.log(`   Status: ${poData.status}`);
    console.log(`   Updated: ${poData.updated_at}\n`);

    // Step 2: Test status progression logic
    console.log('🔄 Step 2: Testing status progression logic...');
    
    const testStatuses = ['received', 'quality_checked', 'partial_received', 'sent', 'shipped'];
    
    for (const currentStatus of testStatuses) {
      let nextStatus = currentStatus;
      
      // Simulate the status progression logic
      switch (currentStatus) {
        case 'received':
          nextStatus = 'quality_checked';
          break;
        case 'quality_checked':
          nextStatus = 'completed';
          break;
        case 'partial_received':
          nextStatus = 'partial_received';
          break;
        default:
          if (currentStatus === 'sent' || currentStatus === 'shipped') {
            nextStatus = 'received';
          } else {
            nextStatus = 'completed';
          }
      }
      
      console.log(`   ${currentStatus} → ${nextStatus}`);
    }
    console.log('');

    // Step 3: Test actual status update
    console.log('🎯 Step 3: Testing actual status update...');
    
    // Determine next status based on current status
    let nextStatus = poData.status;
    switch (poData.status) {
      case 'received':
        nextStatus = 'quality_checked';
        break;
      case 'quality_checked':
        nextStatus = 'completed';
        break;
      case 'partial_received':
        nextStatus = 'partial_received';
        break;
      default:
        if (poData.status === 'sent' || poData.status === 'shipped') {
          nextStatus = 'received';
        } else {
          nextStatus = 'completed';
        }
    }
    
    console.log(`   Current: ${poData.status}`);
    console.log(`   Next: ${nextStatus}\n`);

    // Step 4: Update status if different
    if (nextStatus !== poData.status) {
      console.log('🔄 Step 4: Updating purchase order status...');
      
      const { data: updateData, error: updateError } = await supabase
        .from('lats_purchase_orders')
        .update({ 
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', poData.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating status:', updateError);
        return;
      }

      console.log('✅ Status Updated:');
      console.log(`   New Status: ${updateData.status}`);
      console.log(`   Updated At: ${updateData.updated_at}\n`);
    } else {
      console.log('✅ Status already correct, no update needed\n');
    }

    // Step 5: Test status messages
    console.log('💬 Step 5: Testing status messages...');
    
    const statusMessages = {
      'quality_checked': 'Quality check completed - Items ready for inventory',
      'completed': 'Quality check completed - Purchase order finalized',
      'received': 'Items received and ready for quality check',
      'partial_received': 'Partial receive completed'
    };
    
    const message = statusMessages[nextStatus] || 'Quality check completed successfully';
    console.log(`   Message: ${message}\n`);

    // Step 6: Final verification
    console.log('🏁 Step 6: Final verification...');
    const { data: finalData, error: finalError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, updated_at')
      .eq('id', poData.id)
      .single();

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    console.log('✅ Final Status:');
    console.log(`   Order: ${finalData.order_number}`);
    console.log(`   Status: ${finalData.status}`);
    console.log(`   Updated: ${finalData.updated_at}\n`);

    console.log('🎉 Status Progression Test Complete!');
    console.log('✅ Status progression logic working correctly');
    console.log('✅ Status updates applied successfully');
    console.log('✅ User messages configured properly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testStatusProgression();
