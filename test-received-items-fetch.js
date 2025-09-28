// Test script to check received items fetching
import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReceivedItemsFetch() {
  console.log('🔍 Testing received items fetch...\n');

  const purchaseOrderId = '496fbf00-3e77-4357-a4d2-9019919714d2';

  try {
    // 1. Check if lats_inventory_adjustments table exists and has data
    console.log('1. Checking lats_inventory_adjustments table...');
    const { data: adjustments, error: adjustmentsError } = await supabase
      .from('lats_inventory_adjustments')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .eq('adjustment_type', 'receive');

    if (adjustmentsError) {
      console.error('❌ Error with lats_inventory_adjustments:', adjustmentsError.message);
    } else {
      console.log('✅ lats_inventory_adjustments query successful');
      console.log(`📊 Found ${adjustments?.length || 0} adjustment records`);
      if (adjustments && adjustments.length > 0) {
        console.log('📦 Sample adjustment:', adjustments[0]);
      }
    }

    // 2. Check if inventory_items table exists and has data
    console.log('\n2. Checking inventory_items table...');
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('*')
      .contains('metadata', { purchase_order_id: purchaseOrderId });

    if (inventoryError) {
      console.error('❌ Error with inventory_items:', inventoryError.message);
    } else {
      console.log('✅ inventory_items query successful');
      console.log(`📊 Found ${inventoryItems?.length || 0} inventory item records`);
      if (inventoryItems && inventoryItems.length > 0) {
        console.log('📦 Sample inventory item:', inventoryItems[0]);
      }
    }

    // 3. Check purchase order status
    console.log('\n3. Checking purchase order status...');
    const { data: purchaseOrder, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, status, order_number')
      .eq('id', purchaseOrderId)
      .single();

    if (poError) {
      console.error('❌ Error fetching purchase order:', poError.message);
    } else {
      console.log('✅ Purchase order found:', purchaseOrder);
    }

    // 4. Check purchase order items
    console.log('\n4. Checking purchase order items...');
    const { data: poItems, error: poItemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId);

    if (poItemsError) {
      console.error('❌ Error fetching purchase order items:', poItemsError.message);
    } else {
      console.log('✅ Purchase order items found:', poItems?.length || 0, 'items');
      if (poItems && poItems.length > 0) {
        console.log('📦 Sample PO item:', poItems[0]);
      }
    }

    console.log('\n🎯 Summary:');
    console.log(`- Purchase Order: ${purchaseOrder?.order_number || 'Not found'}`);
    console.log(`- Status: ${purchaseOrder?.status || 'Unknown'}`);
    console.log(`- PO Items: ${poItems?.length || 0}`);
    console.log(`- Inventory Adjustments: ${adjustments?.length || 0}`);
    console.log(`- Inventory Items: ${inventoryItems?.length || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReceivedItemsFetch();
