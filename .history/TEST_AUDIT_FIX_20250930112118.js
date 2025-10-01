// Test script to verify the audit 401 error fix
// Run this in your browser console after applying the SQL fix

async function testAuditLogging() {
  console.log('🧪 Testing audit logging fix...');
  
  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Test 2: Try to get a purchase order to test with
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number')
      .limit(1);
    
    if (poError || !purchaseOrders || purchaseOrders.length === 0) {
      console.error('❌ No purchase orders found:', poError);
      return;
    }
    
    const testOrderId = purchaseOrders[0].id;
    console.log('✅ Found test order:', testOrderId);
    
    // Test 3: Try using the helper function
    console.log('🧪 Testing helper function...');
    const { data: auditId, error: functionError } = await supabase.rpc('log_purchase_order_audit', {
      p_purchase_order_id: testOrderId,
      p_action: 'test_action',
      p_details: { test: true, timestamp: new Date().toISOString() },
      p_user_id: user.id
    });
    
    if (functionError) {
      console.warn('⚠️ Helper function failed:', functionError);
      
      // Test 4: Try direct insert as fallback
      console.log('🧪 Testing direct insert fallback...');
      const { error: insertError } = await supabase
        .from('purchase_order_audit')
        .insert({
          purchase_order_id: testOrderId,
          action: 'test_direct_insert',
          details: { test: true, method: 'direct_insert' },
          user_id: user.id,
          created_by: user.id,
          timestamp: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Direct insert also failed:', insertError);
        return;
      } else {
        console.log('✅ Direct insert succeeded');
      }
    } else {
      console.log('✅ Helper function succeeded, audit ID:', auditId);
    }
    
    // Test 5: Verify audit record was created
    const { data: auditRecords, error: fetchError } = await supabase
      .from('purchase_order_audit')
      .select('*')
      .eq('purchase_order_id', testOrderId)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Failed to fetch audit records:', fetchError);
      return;
    }
    
    if (auditRecords && auditRecords.length > 0) {
      console.log('✅ Audit record created successfully:', auditRecords[0]);
    } else {
      console.log('⚠️ No audit records found');
    }
    
    console.log('🎉 Audit logging test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuditLogging();
