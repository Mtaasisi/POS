#!/usr/bin/env node

/**
 * Debug the specific PATCH request that's failing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPatchRequest() {
  console.log('🔍 Debugging PATCH request for purchase order...\n');
  
  const targetId = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
  
  try {
    // First, let's see what the current record looks like
    console.log('1. Current record state:');
    const { data: currentRecord, error: fetchError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching current record:', fetchError);
      return;
    }
    
    console.log('📋 Current record:', {
      id: currentRecord.id,
      status: currentRecord.status,
      payment_status: currentRecord.payment_status,
      shipping_status: currentRecord.shipping_status,
      quality_check_status: currentRecord.quality_check_status
    });
    
    // Test different types of updates that might be causing the issue
    console.log('\n2. Testing various update scenarios...');
    
    // Test 1: Minimal update
    console.log('\n🧪 Test 1: Minimal update (status only)');
    const { data: minimalUpdate, error: minimalError } = await supabase
      .from('lats_purchase_orders')
      .update({ status: 'completed' })
      .eq('id', targetId)
      .select()
      .single();
    
    if (minimalError) {
      console.error('❌ Minimal update failed:', minimalError);
    } else {
      console.log('✅ Minimal update successful');
    }
    
    // Test 2: Update with quality check fields
    console.log('\n🧪 Test 2: Quality check update');
    const { data: qualityUpdate, error: qualityError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        quality_check_status: 'passed',
        quality_check_passed: true,
        quality_check_date: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (qualityError) {
      console.error('❌ Quality check update failed:', qualityError);
    } else {
      console.log('✅ Quality check update successful');
    }
    
    // Test 3: Update with payment fields
    console.log('\n🧪 Test 3: Payment update');
    const { data: paymentUpdate, error: paymentError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        payment_status: 'paid',
        total_paid: 7500
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (paymentError) {
      console.error('❌ Payment update failed:', paymentError);
    } else {
      console.log('✅ Payment update successful');
    }
    
    // Test 4: Update with shipping fields
    console.log('\n🧪 Test 4: Shipping update');
    const { data: shippingUpdate, error: shippingError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        shipping_status: 'delivered',
        tracking_number: 'TEST123'
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (shippingError) {
      console.error('❌ Shipping update failed:', shippingError);
    } else {
      console.log('✅ Shipping update successful');
    }
    
    // Test 5: Update with JSON fields
    console.log('\n🧪 Test 5: JSON fields update');
    const { data: jsonUpdate, error: jsonError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        shipping_info: {
          carrier: 'DHL',
          tracking: 'TEST123',
          estimated_delivery: '2025-01-15'
        }
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (jsonError) {
      console.error('❌ JSON fields update failed:', jsonError);
    } else {
      console.log('✅ JSON fields update successful');
    }
    
    // Test 6: Test with potentially problematic fields
    console.log('\n🧪 Test 6: Potentially problematic fields');
    const { data: problematicUpdate, error: problematicError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        completion_date: new Date().toISOString().split('T')[0], // Date format
        completion_notes: 'Test completion',
        completed_by: 'a7c9adb7-f525-4850-bd42-79a769f12953'
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (problematicError) {
      console.error('❌ Problematic fields update failed:', problematicError);
    } else {
      console.log('✅ Problematic fields update successful');
    }
    
    // Test 7: Test with all fields at once (like the app might do)
    console.log('\n🧪 Test 7: All fields update (simulating app behavior)');
    const { data: allFieldsUpdate, error: allFieldsError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'completed',
        payment_status: 'paid',
        shipping_status: 'delivered',
        quality_check_status: 'passed',
        quality_check_passed: true,
        total_paid: 7500,
        tracking_number: 'TEST123',
        completion_date: new Date().toISOString().split('T')[0],
        completion_notes: 'Quality check completed',
        completed_by: 'a7c9adb7-f525-4850-bd42-79a769f12953',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (allFieldsError) {
      console.error('❌ All fields update failed:', allFieldsError);
      console.log('This might be the issue! Error details:', allFieldsError);
    } else {
      console.log('✅ All fields update successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugPatchRequest().catch(console.error);
