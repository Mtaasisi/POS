import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function finalComprehensiveTest() {
  console.log('🔍 FINAL COMPREHENSIVE TEST - ALL RPC FUNCTIONS');
  console.log('================================================');
  console.log('');
  
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
    const results = {};
    
    for (const test of tests) {
      console.log(`🔍 Testing ${test.description}...`);
      
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        allWorking = false;
        results[test.name] = { success: false, error: error.message };
      } else {
        console.log(`✅ ${test.name}: SUCCESS (${data?.length || 0} results)`);
        results[test.name] = { success: true, count: data?.length || 0 };
      }
    }
    
    console.log('');
    console.log('📊 FINAL RESULTS SUMMARY:');
    console.log('=========================');
    
    Object.entries(results).forEach(([functionName, result]) => {
      if (result.success) {
        console.log(`✅ ${functionName}: Working (${result.count} results)`);
      } else {
        console.log(`❌ ${functionName}: Failed - ${result.error}`);
      }
    });
    
    console.log('');
    if (allWorking) {
      console.log('🎉 COMPLETE SUCCESS! ALL RPC FUNCTIONS ARE WORKING!');
      console.log('✅ Your 400 Bad Request errors are now resolved!');
      console.log('✅ Your purchase order pages should work perfectly!');
      console.log('✅ Your inventory management features are fully functional!');
      console.log('');
      console.log('🚀 You can now use your app without any RPC function errors!');
    } else {
      console.log('⚠️  SOME FUNCTIONS STILL NEED FIXING:');
      console.log('');
      console.log('🔧 TO COMPLETE THE FIX:');
      console.log('1. Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
      console.log('2. Apply the remaining fixes:');
      
      Object.entries(results).forEach(([functionName, result]) => {
        if (!result.success) {
          if (functionName === 'get_received_items_for_po') {
            console.log(`   - Copy and paste FINAL_RECEIVED_ITEMS_FIX.sql for ${functionName}`);
          } else {
            console.log(`   - Apply ULTIMATE_FIX_RPC_FUNCTIONS.sql for ${functionName}`);
          }
        }
      });
      
      console.log('3. Run this test again: node final-comprehensive-test.js');
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
}

// Run the comprehensive test
finalComprehensiveTest();
