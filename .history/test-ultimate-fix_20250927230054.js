import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function testUltimateFix() {
  console.log('🔍 TESTING ULTIMATE FIX FOR RPC FUNCTIONS...');
  console.log('=============================================');
  
  try {
    // Get a real purchase order ID
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found for testing');
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
      console.log(`   Function: ${test.name}`);
      console.log(`   Parameters:`, test.params);
      
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.log(`❌ ERROR: ${error.message}`);
        console.log(`   Code: ${error.code || 'N/A'}`);
        console.log(`   Details: ${error.details || 'N/A'}`);
        console.log(`   Hint: ${error.hint || 'N/A'}`);
        allWorking = false;
      } else {
        console.log(`✅ SUCCESS: Function returned ${data?.length || 0} results`);
        if (data && data.length > 0) {
          console.log(`   Sample result keys:`, Object.keys(data[0]));
        }
      }
      console.log('');
    }
    
    if (allWorking) {
      console.log('🎉 ULTIMATE FIX SUCCESS!');
      console.log('✅ All RPC functions are working correctly!');
      console.log('✅ Your 400 Bad Request errors should now be resolved!');
      console.log('✅ Your purchase order pages should work perfectly!');
    } else {
      console.log('⚠️  Some functions still have issues.');
      console.log('🔧 Please apply the ULTIMATE_FIX_RPC_FUNCTIONS.sql in your Supabase SQL Editor');
      console.log('');
      console.log('📋 INSTRUCTIONS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
      console.log('2. Copy and paste the contents of ULTIMATE_FIX_RPC_FUNCTIONS.sql');
      console.log('3. Click "Run" to execute');
      console.log('4. Run this test again: node test-ultimate-fix.js');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUltimateFix();
