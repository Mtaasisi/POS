// Test script to verify duplicate order functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDuplicateOrder() {
  console.log('🧪 Testing Duplicate Order Functionality...\n');
  
  try {
    // First, get a test order
    const { data: orders, error: fetchError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching test order:', fetchError);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found to test with');
      return;
    }
    
    const testOrder = orders[0];
    console.log('📋 Test Order:', {
      id: testOrder.id,
      order_number: testOrder.order_number,
      status: testOrder.status
    });
    
    // Test the duplicate function
    const { PurchaseOrderActionsService } = await import('./src/features/lats/services/purchaseOrderActionsService.ts');
    
    console.log('\n🔄 Attempting to duplicate order...');
    const result = await PurchaseOrderActionsService.duplicateOrder(testOrder.id);
    
    if (result.success) {
      console.log('✅ Duplicate order created successfully!');
      console.log('📋 New Order Details:', {
        id: result.data.id,
        order_number: result.data.order_number,
        status: result.data.status
      });
      
      // Clean up - delete the test duplicate
      console.log('\n🧹 Cleaning up test duplicate...');
      const { error: deleteError } = await supabase
        .from('lats_purchase_orders')
        .delete()
        .eq('id', result.data.id);
      
      if (deleteError) {
        console.warn('⚠️ Could not clean up test duplicate:', deleteError);
      } else {
        console.log('✅ Test duplicate cleaned up');
      }
    } else {
      console.error('❌ Duplicate order failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDuplicateOrder();
