const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPurchaseOrder(purchaseOrderId) {
  console.log('🔍 Debugging Purchase Order:', purchaseOrderId);
  
  try {
    // 1. Check purchase order status
    const { data: po, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();
    
    if (poError) {
      console.error('❌ Error fetching purchase order:', poError);
      return;
    }
    
    console.log('📋 Purchase Order Status:', {
      id: po.id,
      order_number: po.order_number,
      status: po.status,
      total_amount: po.total_amount
    });
    
    // 2. Check purchase order items and their received quantities
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select(`
        id,
        product_id,
        variant_id,
        quantity,
        received_quantity,
        cost_price,
        product:lats_products(name, sku),
        variant:lats_product_variants(name, sku)
      `)
      .eq('purchase_order_id', purchaseOrderId);
    
    if (itemsError) {
      console.error('❌ Error fetching purchase order items:', itemsError);
      return;
    }
    
    console.log('📦 Purchase Order Items:', items?.map(item => ({
      id: item.id,
      product: item.product?.name,
      variant: item.variant?.name,
      ordered: item.quantity,
      received: item.received_quantity || 0,
      pending: item.quantity - (item.received_quantity || 0)
    })));
    
    // 3. Check inventory items (with serial numbers)
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('id, product_id, serial_number, metadata, created_at')
      .contains('metadata', { purchase_order_id: purchaseOrderId });
    
    if (inventoryError) {
      console.error('❌ Error fetching inventory items:', inventoryError);
    } else {
      console.log('📱 Inventory Items (with serials):', inventoryItems?.length || 0, 'items');
      if (inventoryItems?.length > 0) {
        console.log('   Sample:', inventoryItems[0]);
      }
    }
    
    // 4. Check inventory adjustments (without serial numbers)
    const { data: adjustments, error: adjustmentsError } = await supabase
      .from('lats_inventory_adjustments')
      .select('id, product_id, quantity, adjustment_type, reason, created_at')
      .eq('purchase_order_id', purchaseOrderId)
      .eq('adjustment_type', 'receive');
    
    if (adjustmentsError) {
      console.error('❌ Error fetching inventory adjustments:', adjustmentsError);
    } else {
      console.log('📊 Inventory Adjustments (no serials):', adjustments?.length || 0, 'adjustments');
      if (adjustments?.length > 0) {
        console.log('   Sample:', adjustments[0]);
      }
    }
    
    // 5. Summary
    const totalInventoryItems = inventoryItems?.length || 0;
    const totalAdjustments = adjustments?.length || 0;
    const totalReceivedItems = totalInventoryItems + totalAdjustments;
    
    console.log('📈 Summary:');
    console.log('   - Inventory Items (with serials):', totalInventoryItems);
    console.log('   - Inventory Adjustments (no serials):', totalAdjustments);
    console.log('   - Total Received Items:', totalReceivedItems);
    
    if (totalReceivedItems === 0) {
      console.log('💡 No received items found. This could mean:');
      console.log('   1. Items haven\'t been received yet');
      console.log('   2. Items were received but not properly recorded');
      console.log('   3. The receive process failed');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
const purchaseOrderId = '48566a1e-113f-4af2-a6df-b9bde7565a64';
debugPurchaseOrder(purchaseOrderId);
