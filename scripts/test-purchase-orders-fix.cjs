const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testPurchaseOrdersFix() {
  try {
    console.log('🧪 Testing purchase orders fix...');
    
    // Test the old problematic query
    console.log('📝 Testing old query (should fail)...');
    const { data: oldData, error: oldError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        lats_suppliers(name),
        lats_purchase_order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (oldError) {
      console.log('❌ Old query failed as expected:', oldError.message);
    } else {
      console.log('⚠️  Old query unexpectedly succeeded');
    }
    
    // Test the new approach
    console.log('📝 Testing new approach...');
    
    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.log('❌ Orders query failed:', ordersError.message);
      return;
    }
    
    console.log('✅ Orders query successful');
    console.log(`📊 Found ${orders?.length || 0} purchase orders`);
    
    // Fetch suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('id, name');
    
    if (suppliersError) {
      console.log('❌ Suppliers query failed:', suppliersError.message);
      return;
    }
    
    console.log('✅ Suppliers query successful');
    console.log(`📊 Found ${suppliers?.length || 0} suppliers`);
    
    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('*');
    
    if (itemsError) {
      console.log('❌ Items query failed:', itemsError.message);
      return;
    }
    
    console.log('✅ Items query successful');
    console.log(`📊 Found ${items?.length || 0} purchase order items`);
    
    // Test data combination
    if (orders && orders.length > 0) {
      const suppliersMap = new Map((suppliers || []).map(s => [s.id, s]));
      const itemsMap = new Map();
      (items || []).forEach(item => {
        if (!itemsMap.has(item.purchase_order_id)) {
          itemsMap.set(item.purchase_order_id, []);
        }
        itemsMap.get(item.purchase_order_id).push(item);
      });
      
      const firstOrder = orders[0];
      const supplierName = suppliersMap.get(firstOrder.supplier_id)?.name || 'Unknown Supplier';
      const orderItems = itemsMap.get(firstOrder.id) || [];
      
      console.log('✅ Data combination successful');
      console.log(`📋 Sample order: ${firstOrder.order_number} from ${supplierName} with ${orderItems.length} items`);
    }
    
    console.log('🎉 Purchase orders fix test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPurchaseOrdersFix();
