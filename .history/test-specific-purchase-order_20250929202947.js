#!/usr/bin/env node

/**
 * Test fetching the specific purchase order that's causing the 400 error
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

async function testSpecificPurchaseOrder() {
  console.log('🔍 Testing specific purchase order fetch...\n');
  
  const targetId = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
  
  try {
    console.log(`📋 Fetching purchase order: ${targetId}`);
    
    // Test 1: Basic fetch with select *
    console.log('\n1. Testing basic fetch with select *:');
    const { data: basicData, error: basicError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (basicError) {
      console.error('❌ Basic fetch error:', basicError);
    } else {
      console.log('✅ Basic fetch successful:', {
        id: basicData?.id,
        order_number: basicData?.order_number,
        status: basicData?.status,
        supplier_id: basicData?.supplier_id
      });
    }
    
    // Test 2: Fetch with specific columns
    console.log('\n2. Testing fetch with specific columns:');
    const { data: specificData, error: specificError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, supplier_id, total_amount, created_at')
      .eq('id', targetId)
      .single();
    
    if (specificError) {
      console.error('❌ Specific columns fetch error:', specificError);
    } else {
      console.log('✅ Specific columns fetch successful:', specificData);
    }
    
    // Test 3: Test the exact query that might be causing the 400 error
    console.log('\n3. Testing exact query from the error URL:');
    const { data: exactData, error: exactError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', targetId);
    
    if (exactError) {
      console.error('❌ Exact query error:', exactError);
    } else {
      console.log('✅ Exact query successful:', exactData);
    }
    
    // Test 4: Test with joins (this might be causing the issue)
    console.log('\n4. Testing with supplier join:');
    const { data: joinData, error: joinError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        supplier:lats_suppliers(id, name, company_name)
      `)
      .eq('id', targetId)
      .single();
    
    if (joinError) {
      console.error('❌ Join query error:', joinError);
    } else {
      console.log('✅ Join query successful:', {
        id: joinData?.id,
        order_number: joinData?.order_number,
        supplier: joinData?.supplier
      });
    }
    
    // Test 5: Test with items join
    console.log('\n5. Testing with items join:');
    const { data: itemsData, error: itemsError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        items:lats_purchase_order_items(id, quantity, cost_price, total_price)
      `)
      .eq('id', targetId)
      .single();
    
    if (itemsError) {
      console.error('❌ Items join query error:', itemsError);
    } else {
      console.log('✅ Items join query successful:', {
        id: itemsData?.id,
        order_number: itemsData?.order_number,
        items_count: itemsData?.items?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificPurchaseOrder().catch(console.error);
