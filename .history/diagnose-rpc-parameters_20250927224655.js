import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function diagnoseRPCParameters() {
  console.log('🔍 DIAGNOSING RPC PARAMETER ISSUES...');
  console.log('=====================================');
  
  // Get a real purchase order ID from the database
  console.log('📝 Step 1: Getting a real purchase order ID from database...');
  
  try {
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found in database');
      console.log('   This might be why the functions are failing');
      console.log('   Let\'s try with a dummy UUID anyway...');
    } else {
      console.log(`✅ Found purchase order: ${poData[0].id}`);
    }
    
    const testId = poData && poData.length > 0 ? poData[0].id : '00000000-0000-0000-0000-000000000000';
    
    console.log(`📝 Step 2: Testing with ID: ${testId}`);
    console.log('');
    
    // Test 1: get_purchase_order_items_with_products
    console.log('🔍 TEST 1: get_purchase_order_items_with_products');
    console.log('Parameter being sent: { purchase_order_id_param: "' + testId + '" }');
    
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: testId
      });
    
    if (itemsError) {
      console.log(`❌ ERROR: ${itemsError.message}`);
      console.log(`   Code: ${itemsError.code || 'N/A'}`);
      console.log(`   Details: ${itemsError.details || 'N/A'}`);
      console.log(`   Hint: ${itemsError.hint || 'N/A'}`);
    } else {
      console.log(`✅ SUCCESS: Function returned ${itemsData?.length || 0} items`);
    }
    console.log('');
    
    // Test 2: get_po_inventory_stats
    console.log('🔍 TEST 2: get_po_inventory_stats');
    console.log('Parameter being sent: { po_id: "' + testId + '" }');
    
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_po_inventory_stats', {
        po_id: testId
      });
    
    if (statsError) {
      console.log(`❌ ERROR: ${statsError.message}`);
      console.log(`   Code: ${statsError.code || 'N/A'}`);
      console.log(`   Details: ${statsError.details || 'N/A'}`);
      console.log(`   Hint: ${statsError.hint || 'N/A'}`);
    } else {
      console.log(`✅ SUCCESS: Function returned ${statsData?.length || 0} stats`);
    }
    console.log('');
    
    // Test 3: get_received_items_for_po
    console.log('🔍 TEST 3: get_received_items_for_po');
    console.log('Parameter being sent: { po_id: "' + testId + '" }');
    
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_received_items_for_po', {
        po_id: testId
      });
    
    if (receivedError) {
      console.log(`❌ ERROR: ${receivedError.message}`);
      console.log(`   Code: ${receivedError.code || 'N/A'}`);
      console.log(`   Details: ${receivedError.details || 'N/A'}`);
      console.log(`   Hint: ${receivedError.hint || 'N/A'}`);
    } else {
      console.log(`✅ SUCCESS: Function returned ${receivedData?.length || 0} items`);
    }
    console.log('');
    
    // Summary
    const allErrors = [itemsError, statsError, receivedError].filter(e => e);
    
    if (allErrors.length === 0) {
      console.log('🎉 ALL FUNCTIONS ARE WORKING!');
      console.log('✅ The 400 Bad Request errors should be resolved!');
    } else {
      console.log('⚠️  FUNCTIONS STILL HAVE ISSUES:');
      allErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
      });
      
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
      console.log('2. Run the corrected SQL functions from FIXED_RPC_FUNCTIONS.sql');
      console.log('3. The functions need to be recreated with the correct column names');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
diagnoseRPCParameters();
