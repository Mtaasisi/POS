import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPurchaseOrder() {
  const poId = '2f772843-d993-4987-adb4-393ab0bf718c';
  
  console.log('🔍 Debugging Purchase Order:', poId);
  
  // Check purchase order status
  const { data: po, error: poError } = await supabase
    .from('lats_purchase_orders')
    .select('*')
    .eq('id', poId)
    .single();
    
  if (poError) {
    console.error('❌ Error fetching PO:', poError);
    return;
  }
  
  console.log('📋 Purchase Order Status:', {
    id: po.id,
    order_number: po.order_number,
    status: po.status,
    total_amount: po.total_amount,
    created_at: po.created_at
  });
  
  // Check purchase order items
  const { data: items, error: itemsError } = await supabase
    .from('lats_purchase_order_items')
    .select('*')
    .eq('purchase_order_id', poId);
    
  if (itemsError) {
    console.error('❌ Error fetching items:', itemsError);
    return;
  }
  
  console.log('📦 Purchase Order Items:');
  items.forEach((item, index) => {
    console.log(`  Item ${index + 1}:`, {
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      received_quantity: item.received_quantity,
      cost_price: item.cost_price,
      is_fully_received: item.received_quantity >= item.quantity
    });
  });
  
  // Count completion status
  const totalItems = items.length;
  const completedItems = items.filter(item => item.received_quantity >= item.quantity).length;
  
  console.log('📊 Completion Status:', {
    total_items: totalItems,
    completed_items: completedItems,
    can_complete: completedItems === totalItems && totalItems > 0
  });
}

debugPurchaseOrder().catch(console.error);
