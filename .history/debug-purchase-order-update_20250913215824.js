#!/usr/bin/env node

/**
 * Debug Purchase Order Update Issues
 * This script helps identify why the purchase order update is failing
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

async function debugPurchaseOrderUpdate() {
  console.log('🔍 Debugging Purchase Order Update Issues...\n');
  
  const purchaseOrderId = '286e5379-4508-4645-be6e-64a275d028ee';
  
  try {
    // 1. Check if the purchase order exists
    console.log('1. Checking if purchase order exists...');
    const { data: existingOrder, error: fetchError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching purchase order:', fetchError);
      return;
    }
    
    if (!existingOrder) {
      console.error('❌ Purchase order not found');
      return;
    }
    
    console.log('✅ Purchase order exists:', {
      id: existingOrder.id,
      status: existingOrder.status,
      created_by: existingOrder.created_by,
      supplier_id: existingOrder.supplier_id
    });
    
    // 2. Check table structure
    console.log('\n2. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'lats_purchase_orders' });
    
    if (tableError) {
      console.log('⚠️ Could not get table structure via RPC, trying alternative method...');
      // Try to get structure by attempting a select with all possible columns
      const testColumns = [
        'id', 'order_number', 'supplier_id', 'status', 'total_amount', 
        'expected_delivery', 'notes', 'created_by', 'created_at', 'updated_at',
        'shipping_status', 'tracking_number', 'estimated_delivery', 
        'shipping_notes', 'shipping_info', 'shipping_date', 'total_amount_base_currency'
      ];
      
      const { data: testData, error: testError } = await supabase
        .from('lats_purchase_orders')
        .select(testColumns.join(', '))
        .eq('id', purchaseOrderId)
        .single();
      
      if (testError) {
        console.error('❌ Error testing columns:', testError);
      } else {
        console.log('✅ Available columns:', Object.keys(testData));
      }
    } else {
      console.log('✅ Table structure:', tableInfo);
    }
    
    // 3. Test a simple update
    console.log('\n3. Testing simple update...');
    const { data: updateData, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        updated_at: new Date().toISOString(),
        notes: existingOrder.notes || 'Test update'
      })
      .eq('id', purchaseOrderId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Simple update failed:', updateError);
      
      // 4. Check RLS policies
      console.log('\n4. Checking RLS status...');
      const { data: rlsInfo, error: rlsError } = await supabase
        .rpc('get_table_rls_info', { table_name: 'lats_purchase_orders' });
      
      if (rlsError) {
        console.log('⚠️ Could not get RLS info via RPC');
      } else {
        console.log('RLS Info:', rlsInfo);
      }
      
    } else {
      console.log('✅ Simple update successful:', updateData);
    }
    
    // 5. Test with shipping fields
    console.log('\n5. Testing update with shipping fields...');
    const shippingUpdateData = {
      status: 'shipped',
      shipping_status: 'shipped',
      tracking_number: 'TEST123',
      estimated_delivery: '2024-02-15',
      shipping_notes: 'Test shipping update',
      shipping_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: shippingUpdate, error: shippingError } = await supabase
      .from('lats_purchase_orders')
      .update(shippingUpdateData)
      .eq('id', purchaseOrderId)
      .select()
      .single();
    
    if (shippingError) {
      console.error('❌ Shipping update failed:', shippingError);
      console.log('Shipping update data:', shippingUpdateData);
    } else {
      console.log('✅ Shipping update successful:', shippingUpdate);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS Policies...');
  
  try {
    // Try to get policies information
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'lats_purchase_orders');
    
    if (error) {
      console.log('⚠️ Could not query policies directly:', error.message);
      console.log('This is normal - policies are usually not accessible via the client');
    } else {
      console.log('Policies:', data);
    }
  } catch (error) {
    console.log('⚠️ Error checking policies:', error.message);
  }
}

async function main() {
  await debugPurchaseOrderUpdate();
  await checkRLSPolicies();
  
  console.log('\n📋 Summary:');
  console.log('1. If simple update fails, the issue is likely RLS policies');
  console.log('2. If shipping update fails, the issue is missing columns');
  console.log('3. Run the appropriate fix SQL based on the results above');
}

main().catch(console.error);
