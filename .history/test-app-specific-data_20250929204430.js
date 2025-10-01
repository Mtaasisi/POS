#!/usr/bin/env node

/**
 * Test the specific data that the application might be sending
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

async function testAppSpecificData() {
  console.log('🔍 Testing app-specific data patterns...\n');
  
  const targetId = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
  
  try {
    // Test 1: Quality check completion (common app scenario)
    console.log('1. Testing quality check completion scenario...');
    const { data: qcUpdate, error: qcError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        quality_check_status: 'passed',
        quality_check_passed: true,
        quality_check_date: new Date().toISOString(),
        quality_check_notes: 'Quality check completed successfully',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (qcError) {
      console.error('❌ Quality check update failed:', qcError);
    } else {
      console.log('✅ Quality check update successful');
    }
    
    // Test 2: Payment completion scenario
    console.log('\n2. Testing payment completion scenario...');
    const { data: paymentUpdate, error: paymentError } = await supabase
      .from('lats_purchase_orders')
      .update({
        payment_status: 'paid',
        total_paid: 7500,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (paymentError) {
      console.error('❌ Payment update failed:', paymentError);
    } else {
      console.log('✅ Payment update successful');
    }
    
    // Test 3: Shipping completion scenario
    console.log('\n3. Testing shipping completion scenario...');
    const { data: shippingUpdate, error: shippingError } = await supabase
      .from('lats_purchase_orders')
      .update({
        shipping_status: 'delivered',
        tracking_number: 'TEST123',
        shipping_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (shippingError) {
      console.error('❌ Shipping update failed:', shippingError);
    } else {
      console.log('✅ Shipping update successful');
    }
    
    // Test 4: Complete order scenario (all fields at once)
    console.log('\n4. Testing complete order scenario...');
    const { data: completeUpdate, error: completeError } = await supabase
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
        completion_notes: 'Order completed successfully',
        completed_by: 'a7c9adb7-f525-4850-bd42-79a769f12953',
        quality_check_date: new Date().toISOString(),
        quality_check_notes: 'All items passed quality check',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (completeError) {
      console.error('❌ Complete order update failed:', completeError);
      console.log('This might be the issue! Error details:', completeError);
    } else {
      console.log('✅ Complete order update successful');
    }
    
    // Test 5: Test with problematic data types
    console.log('\n5. Testing problematic data types...');
    const { data: typeUpdate, error: typeError } = await supabase
      .from('lats_purchase_orders')
      .update({
        total_paid: '7500', // String instead of number
        exchange_rate: '2.5', // String instead of number
        quality_check_passed: 'true', // String instead of boolean
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (typeError) {
      console.error('❌ Type conversion update failed:', typeError);
    } else {
      console.log('✅ Type conversion update successful');
    }
    
    // Test 6: Test with invalid enum values
    console.log('\n6. Testing invalid enum values...');
    const { data: enumUpdate, error: enumError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'invalid_status', // Invalid enum value
        payment_status: 'invalid_payment', // Invalid enum value
        shipping_status: 'invalid_shipping', // Invalid enum value
        quality_check_status: 'invalid_quality', // Invalid enum value
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (enumError) {
      console.error('❌ Invalid enum update failed (expected):', enumError);
      console.log('This confirms constraints are working correctly');
    } else {
      console.log('✅ Invalid enum update successful (unexpected)');
    }
    
    // Test 7: Test with NULL values in required fields
    console.log('\n7. Testing NULL values in required fields...');
    const { data: nullUpdate, error: nullError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: NULL, // NULL in required field
        payment_status: NULL, // NULL in required field
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (nullError) {
      console.error('❌ NULL values update failed (expected):', nullError);
    } else {
      console.log('✅ NULL values update successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAppSpecificData().catch(console.error);
