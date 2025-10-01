#!/usr/bin/env node

/**
 * Test PATCH request for purchase order to identify the 400 error
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

async function testPatchPurchaseOrder() {
  console.log('🔧 Testing PATCH request for purchase order...\n');
  
  const targetId = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
  
  try {
    // Test 1: Basic update with minimal data
    console.log('1. Testing basic status update...');
    const { data: basicUpdate, error: basicError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (basicError) {
      console.error('❌ Basic update failed:', basicError);
    } else {
      console.log('✅ Basic update successful:', {
        id: basicUpdate?.id,
        status: basicUpdate?.status
      });
    }
    
    // Test 2: Update with additional fields that might be causing issues
    console.log('\n2. Testing update with additional fields...');
    const { data: extendedUpdate, error: extendedError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        shipping_status: 'delivered',
        tracking_number: 'TEST123',
        total_paid: 7500,
        payment_status: 'paid',
        quality_check_status: 'passed',
        quality_check_passed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (extendedError) {
      console.error('❌ Extended update failed:', extendedError);
    } else {
      console.log('✅ Extended update successful:', {
        id: extendedUpdate?.id,
        status: extendedUpdate?.status,
        shipping_status: extendedUpdate?.shipping_status,
        payment_status: extendedUpdate?.payment_status
      });
    }
    
    // Test 3: Test with fields that might not exist in the schema
    console.log('\n3. Testing update with potentially invalid fields...');
    const { data: invalidUpdate, error: invalidError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        // These fields might not exist in the schema
        invalid_field: 'test',
        another_invalid_field: 123,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (invalidError) {
      console.error('❌ Invalid fields update failed (expected):', invalidError);
    } else {
      console.log('✅ Invalid fields update successful (unexpected):', invalidUpdate);
    }
    
    // Test 4: Test with empty/null values
    console.log('\n4. Testing update with empty/null values...');
    const { data: nullUpdate, error: nullError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        notes: null,
        expected_delivery: null,
        shipping_notes: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (nullError) {
      console.error('❌ Null values update failed:', nullError);
    } else {
      console.log('✅ Null values update successful:', {
        id: nullUpdate?.id,
        status: nullUpdate?.status,
        notes: nullUpdate?.notes
      });
    }
    
    // Test 5: Test with JSON fields
    console.log('\n5. Testing update with JSON fields...');
    const { data: jsonUpdate, error: jsonError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'completed',
        shipping_info: {
          carrier: 'DHL',
          tracking: 'TEST123',
          estimated_delivery: '2025-01-15'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();
    
    if (jsonError) {
      console.error('❌ JSON fields update failed:', jsonError);
    } else {
      console.log('✅ JSON fields update successful:', {
        id: jsonUpdate?.id,
        status: jsonUpdate?.status,
        shipping_info: jsonUpdate?.shipping_info
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPatchPurchaseOrder().catch(console.error);
