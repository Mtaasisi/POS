#!/usr/bin/env node

/**
 * Test Partial Receive Fixes
 * This script tests the improved partial receive functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPartialReceiveFixes() {
  console.log('🧪 Testing Partial Receive Fixes...\n');
  
  try {
    // 1. Test the new database function
    console.log('1️⃣ Testing get_purchase_order_items_with_products function...');
    await testGetItemsWithProducts();
    
    // 2. Test the update function
    console.log('\n2️⃣ Testing update_received_quantities function...');
    await testUpdateReceivedQuantities();
    
    // 3. Test foreign key relationships
    console.log('\n3️⃣ Testing foreign key relationships...');
    await testForeignKeyRelationships();
    
    // 4. Test partial receive workflow
    console.log('\n4️⃣ Testing complete partial receive workflow...');
    await testPartialReceiveWorkflow();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testGetItemsWithProducts() {
  try {
    // Get a purchase order ID
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (ordersError || !orders || orders.length === 0) {
      console.log('❌ No purchase orders found for testing');
      return;
    }
    
    const purchaseOrderId = orders[0].id;
    console.log(`   Testing with purchase order: ${purchaseOrderId}`);
    
    // Test the function
    const { data, error } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: purchaseOrderId
      });
    
    if (error) {
      console.log('❌ Function test failed:', error.message);
    } else {
      console.log('✅ Function test successful');
      console.log(`   Found ${data?.length || 0} items with product details`);
      
      if (data && data.length > 0) {
        const sampleItem = data[0];
        console.log('   Sample item:', {
          product_name: sampleItem.product_name,
          variant_name: sampleItem.variant_name,
          quantity: sampleItem.quantity,
          received_quantity: sampleItem.received_quantity
        });
      }
    }
  } catch (error) {
    console.error('❌ Error testing get items function:', error);
  }
}

async function testUpdateReceivedQuantities() {
  try {
    // Get a purchase order item to test with
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('id, purchase_order_id, quantity, received_quantity')
      .limit(1);
    
    if (itemsError || !items || items.length === 0) {
      console.log('❌ No purchase order items found for testing');
      return;
    }
    
    const testItem = items[0];
    const currentReceived = testItem.received_quantity || 0;
    const newReceived = Math.min(currentReceived + 1, testItem.quantity);
    
    console.log(`   Testing with item: ${testItem.id}`);
    console.log(`   Current received: ${currentReceived}, New received: ${newReceived}`);
    
    // Test the function
    const { data, error } = await supabase
      .rpc('update_received_quantities', {
        purchase_order_id_param: testItem.purchase_order_id,
        item_updates: [{
          id: testItem.id,
          receivedQuantity: newReceived
        }],
        user_id_param: 'test-user-id'
      });
    
    if (error) {
      console.log('❌ Update function test failed:', error.message);
    } else {
      console.log('✅ Update function test successful');
      
      // Verify the update
      const { data: updatedItem, error: verifyError } = await supabase
        .from('lats_purchase_order_items')
        .select('received_quantity')
        .eq('id', testItem.id)
        .single();
      
      if (verifyError) {
        console.log('❌ Verification failed:', verifyError.message);
      } else if (updatedItem.received_quantity === newReceived) {
        console.log('✅ Update verification successful');
        
        // Revert the change
        await supabase
          .rpc('update_received_quantities', {
            purchase_order_id_param: testItem.purchase_order_id,
            item_updates: [{
              id: testItem.id,
              receivedQuantity: currentReceived
            }],
            user_id_param: 'test-user-id'
          });
        
        console.log('   ✅ Test change reverted');
      } else {
        console.log('❌ Update verification failed - quantity mismatch');
      }
    }
  } catch (error) {
    console.error('❌ Error testing update function:', error);
  }
}

async function testForeignKeyRelationships() {
  try {
    // Test if we can join purchase order items with products
    const { data, error } = await supabase
      .from('lats_purchase_order_items')
      .select(`
        id,
        product_id,
        variant_id,
        lats_products!inner(id, name),
        lats_product_variants!inner(id, name)
      `)
      .limit(1);
    
    if (error) {
      console.log('❌ Foreign key relationship test failed:', error.message);
      console.log('   This suggests the foreign key constraints need to be applied');
    } else {
      console.log('✅ Foreign key relationships working correctly');
      if (data && data.length > 0) {
        console.log('   Sample join result:', {
          product_name: data[0].lats_products?.name,
          variant_name: data[0].lats_product_variants?.name
        });
      }
    }
  } catch (error) {
    console.error('❌ Error testing foreign key relationships:', error);
  }
}

async function testPartialReceiveWorkflow() {
  try {
    // Get a purchase order with items
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        id,
        status,
        lats_purchase_order_items(
          id,
          quantity,
          received_quantity
        )
      `)
      .limit(1);
    
    if (ordersError || !orders || orders.length === 0) {
      console.log('❌ No purchase orders found for workflow testing');
      return;
    }
    
    const order = orders[0];
    console.log(`   Testing workflow with order: ${order.id}`);
    console.log(`   Order status: ${order.status}`);
    console.log(`   Items count: ${order.lats_purchase_order_items?.length || 0}`);
    
    if (order.lats_purchase_order_items && order.lats_purchase_order_items.length > 0) {
      const item = order.lats_purchase_order_items[0];
      console.log(`   Sample item: Qty ${item.quantity}, Received ${item.received_quantity || 0}`);
      
      // Test validation
      console.log('   Testing validation...');
      
      // Test negative quantity
      const { data: negResult, error: negError } = await supabase
        .rpc('update_received_quantities', {
          purchase_order_id_param: order.id,
          item_updates: [{
            id: item.id,
            receivedQuantity: -1
          }],
          user_id_param: 'test-user-id'
        });
      
      if (negError) {
        console.log('   ✅ Negative quantity validation working');
      } else {
        console.log('   ❌ Negative quantity validation failed');
      }
      
      // Test quantity exceeding ordered amount
      const { data: exceedResult, error: exceedError } = await supabase
        .rpc('update_received_quantities', {
          purchase_order_id_param: order.id,
          item_updates: [{
            id: item.id,
            receivedQuantity: item.quantity + 10
          }],
          user_id_param: 'test-user-id'
        });
      
      if (exceedError) {
        console.log('   ✅ Quantity limit validation working');
      } else {
        console.log('   ❌ Quantity limit validation failed');
      }
    }
    
    console.log('✅ Workflow test completed');
  } catch (error) {
    console.error('❌ Error testing workflow:', error);
  }
}

// Run the tests
testPartialReceiveFixes().catch(console.error);
