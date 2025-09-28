import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function debugDetailsPage() {
  console.log('🔍 DEBUGGING PURCHASE ORDER DETAILS PAGE DATA LOADING...');
  console.log('=======================================================');
  
  try {
    // Get a real purchase order with its details
    console.log('📝 Step 1: Getting purchase order details...');
    
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found:', poError?.message);
      return;
    }
    
    const purchaseOrder = poData[0];
    console.log('✅ Purchase order found:', purchaseOrder.id);
    console.log('   Status:', purchaseOrder.status);
    console.log('   Supplier:', purchaseOrder.supplier_name);
    console.log('');
    
    // Test the RPC functions with this purchase order
    console.log('📝 Step 2: Testing RPC functions with real data...');
    
    // Test get_purchase_order_items_with_products
    console.log('🔍 Testing get_purchase_order_items_with_products...');
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: purchaseOrder.id
      });
    
    if (itemsError) {
      console.log(`❌ Items error: ${itemsError.message}`);
    } else {
      console.log(`✅ Items loaded: ${itemsData?.length || 0} items`);
      if (itemsData && itemsData.length > 0) {
        console.log('   Sample item:', {
          id: itemsData[0].id,
          product_name: itemsData[0].product_name,
          quantity: itemsData[0].quantity,
          unit_cost: itemsData[0].unit_cost,
          total_cost: itemsData[0].total_cost,
          received_quantity: itemsData[0].received_quantity
        });
      }
    }
    
    // Test get_po_inventory_stats
    console.log('🔍 Testing get_po_inventory_stats...');
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_po_inventory_stats', {
        po_id: purchaseOrder.id
      });
    
    if (statsError) {
      console.log(`❌ Stats error: ${statsError.message}`);
    } else {
      console.log(`✅ Stats loaded: ${statsData?.length || 0} stats`);
      if (statsData && statsData.length > 0) {
        console.log('   Stats:', statsData);
      } else {
        console.log('   No inventory stats found (this is normal if no items received yet)');
      }
    }
    
    // Test get_received_items_for_po
    console.log('🔍 Testing get_received_items_for_po...');
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_received_items_for_po', {
        po_id: purchaseOrder.id
      });
    
    if (receivedError) {
      console.log(`❌ Received items error: ${receivedError.message}`);
    } else {
      console.log(`✅ Received items loaded: ${receivedData?.length || 0} items`);
      if (receivedData && receivedData.length > 0) {
        console.log('   Sample received item:', {
          id: receivedData[0].id,
          product_name: receivedData[0].product_name,
          status: receivedData[0].status,
          cost_price: receivedData[0].cost_price
        });
      } else {
        console.log('   No received items found (this is normal if no items received yet)');
      }
    }
    
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`Purchase Order: ${purchaseOrder.id}`);
    console.log(`Items: ${itemsData?.length || 0}`);
    console.log(`Stats: ${statsData?.length || 0}`);
    console.log(`Received: ${receivedData?.length || 0}`);
    
    if (itemsData && itemsData.length > 0) {
      console.log('');
      console.log('✅ DATA IS AVAILABLE - The issue might be in the frontend code');
      console.log('🔧 Check your purchase order details page component for:');
      console.log('   1. Data state management');
      console.log('   2. Loading state handling');
      console.log('   3. Error handling');
      console.log('   4. Data rendering logic');
    } else {
      console.log('');
      console.log('⚠️  NO ITEMS FOUND - This might be why the page appears empty');
      console.log('🔧 Check if:');
      console.log('   1. The purchase order has items in lats_purchase_order_items table');
      console.log('   2. The items have the correct purchase_order_id');
      console.log('   3. The items are linked to valid products');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugDetailsPage();
