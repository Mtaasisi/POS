import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function fixDetailsPageLoading() {
  console.log('🔧 FIXING PURCHASE ORDER DETAILS PAGE LOADING ISSUE...');
  console.log('=======================================================');
  
  try {
    // Get a real purchase order
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found:', poError?.message);
      return;
    }
    
    const purchaseOrder = poData[0];
    console.log('✅ Purchase order found:', purchaseOrder.id);
    console.log('');
    
    // Test what data is available from the initial load
    console.log('📝 Step 1: Checking initial purchase order data...');
    console.log('   Order ID:', purchaseOrder.id);
    console.log('   Status:', purchaseOrder.status);
    console.log('   Total Amount:', purchaseOrder.total_amount);
    console.log('   Currency:', purchaseOrder.currency);
    console.log('   Items from initial load:', purchaseOrder.items || 'No items property');
    console.log('');
    
    // Test the RPC function to see what data it returns
    console.log('📝 Step 2: Testing RPC function data...');
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: purchaseOrder.id
      });
    
    if (itemsError) {
      console.log(`❌ RPC function error: ${itemsError.message}`);
      return;
    }
    
    console.log(`✅ RPC function returned ${itemsData?.length || 0} items`);
    if (itemsData && itemsData.length > 0) {
      console.log('   Sample item data:');
      console.log('   - Product Name:', itemsData[0].product_name);
      console.log('   - Quantity:', itemsData[0].quantity);
      console.log('   - Unit Cost:', itemsData[0].unit_cost);
      console.log('   - Total Cost:', itemsData[0].total_cost);
      console.log('   - Received Quantity:', itemsData[0].received_quantity);
    }
    console.log('');
    
    // Calculate what the overview should show
    console.log('📝 Step 3: Calculating overview data...');
    if (itemsData && itemsData.length > 0) {
      const totalItems = itemsData.length;
      const totalQuantity = itemsData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalReceived = itemsData.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
      const totalValue = itemsData.reduce((sum, item) => sum + (item.total_cost || 0), 0);
      
      console.log('   Items Count:', totalItems);
      console.log('   Total Quantity:', totalQuantity);
      console.log('   Total Received:', totalReceived);
      console.log('   Total Value:', totalValue);
      console.log('');
      
      console.log('🔧 SOLUTION IDENTIFIED:');
      console.log('=======================');
      console.log('The issue is that the overview tab is trying to display:');
      console.log('- purchaseOrder.items.length (but items are not loaded initially)');
      console.log('- purchaseOrder.items.reduce() calculations (but items array is empty)');
      console.log('');
      console.log('The fix is to load the items data immediately when the page loads,');
      console.log('not just when the user switches to the "items" tab.');
      console.log('');
      console.log('📋 RECOMMENDED FIX:');
      console.log('1. Load items data in the initial loadPurchaseOrder function');
      console.log('2. Update the overview tab to use the loaded items data');
      console.log('3. Ensure the items data is available for all tabs');
    } else {
      console.log('⚠️  No items found for this purchase order');
      console.log('This might be why the overview appears empty');
    }
    
  } catch (error) {
    console.error('❌ Fix analysis failed:', error);
  }
}

// Run the fix analysis
fixDetailsPageLoading();
