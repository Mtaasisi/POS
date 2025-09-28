import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurchaseOrderLoading() {
  console.log('🧪 Testing Purchase Order Loading...');
  
  try {
    // First, get a list of purchase orders to test with
    console.log('📋 Getting purchase orders list...');
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error getting orders:', ordersError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No purchase orders found to test with');
      return;
    }
    
    const testOrder = orders[0];
    console.log('✅ Found test order:', testOrder);
    
    // Test the main purchase order fetch (this is what the store uses)
    console.log('🔍 Testing main purchase order fetch...');
    const { data: orderData, error: orderError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        supplier:lats_suppliers(*),
        items:lats_purchase_order_items(
          *,
          product:lats_products(*),
          variant:lats_product_variants(*)
        )
      `)
      .eq('id', testOrder.id)
      .single();
    
    if (orderError) {
      console.error('❌ Error fetching purchase order:', orderError);
    } else {
      console.log('✅ Purchase order data loaded:', {
        id: orderData.id,
        orderNumber: orderData.order_number,
        status: orderData.status,
        itemsCount: orderData.items?.length || 0,
        hasSupplier: !!orderData.supplier
      });
    }
    
    // Test the RPC function for items
    console.log('🔍 Testing RPC function get_purchase_order_items_with_products...');
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', { po_id: testOrder.id });
    
    if (itemsError) {
      console.error('❌ Error fetching items via RPC:', itemsError);
    } else {
      console.log('✅ Items loaded via RPC:', {
        count: itemsData?.length || 0,
        sample: itemsData?.[0] ? {
          productName: itemsData[0].product?.name,
          quantity: itemsData[0].quantity,
          costPrice: itemsData[0].cost_price
        } : 'No items'
      });
    }
    
    // Test received items RPC function
    console.log('🔍 Testing RPC function get_received_items_for_po...');
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_received_items_for_po', { po_id: testOrder.id });
    
    if (receivedError) {
      console.error('❌ Error fetching received items via RPC:', receivedError);
    } else {
      console.log('✅ Received items loaded via RPC:', {
        count: receivedData?.length || 0
      });
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPurchaseOrderLoading();
