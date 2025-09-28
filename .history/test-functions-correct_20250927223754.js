import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function testFunctionsCorrect() {
  console.log('🔍 Testing RPC functions with correct parameters...');
  
  // Test with a dummy UUID
  const testId = '00000000-0000-0000-0000-000000000000';
  
  try {
    // Test get_purchase_order_items_with_products
    console.log('📝 Testing get_purchase_order_items_with_products...');
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: testId
      });
    
    if (itemsError) {
      console.log(`❌ get_purchase_order_items_with_products error: ${itemsError.message}`);
    } else {
      console.log(`✅ get_purchase_order_items_with_products works - returned ${itemsData?.length || 0} items`);
    }
    
    // Test get_po_inventory_stats
    console.log('📝 Testing get_po_inventory_stats...');
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_po_inventory_stats', {
        po_id: testId
      });
    
    if (statsError) {
      console.log(`❌ get_po_inventory_stats error: ${statsError.message}`);
    } else {
      console.log(`✅ get_po_inventory_stats works - returned ${statsData?.length || 0} stats`);
    }
    
    // Test get_received_items_for_po
    console.log('📝 Testing get_received_items_for_po...');
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_received_items_for_po', {
        po_id: testId
      });
    
    if (receivedError) {
      console.log(`❌ get_received_items_for_po error: ${receivedError.message}`);
    } else {
      console.log(`✅ get_received_items_for_po works - returned ${receivedData?.length || 0} items`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFunctionsCorrect();
