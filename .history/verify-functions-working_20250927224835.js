import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function verifyFunctionsWorking() {
  console.log('🔍 VERIFYING RPC FUNCTIONS ARE WORKING...');
  console.log('=========================================');
  
  try {
    // Get a real purchase order ID
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found in database');
      return;
    }
    
    const testId = poData[0].id;
    console.log(`📝 Testing with purchase order ID: ${testId}`);
    console.log('');
    
    // Test all three functions
    const tests = [
      {
        name: 'get_purchase_order_items_with_products',
        params: { purchase_order_id_param: testId },
        description: 'Purchase Order Items with Products'
      },
      {
        name: 'get_po_inventory_stats',
        params: { po_id: testId },
        description: 'Purchase Order Inventory Stats'
      },
      {
        name: 'get_received_items_for_po',
        params: { po_id: testId },
        description: 'Received Items for Purchase Order'
      }
    ];
    
    let allWorking = true;
    
    for (const test of tests) {
      console.log(`🔍 Testing ${test.description}...`);
      
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        allWorking = false;
      } else {
        console.log(`✅ ${test.name}: SUCCESS (${data?.length || 0} results)`);
      }
    }
    
    console.log('');
    if (allWorking) {
      console.log('🎉 SUCCESS! ALL RPC FUNCTIONS ARE WORKING!');
      console.log('✅ Your 400 Bad Request errors should now be resolved!');
      console.log('✅ Your purchase order pages should work perfectly now!');
    } else {
      console.log('⚠️  Some functions still have issues.');
      console.log('🔧 Please run the FINAL_WORKING_RPC_FUNCTIONS.sql in your Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyFunctionsWorking();
