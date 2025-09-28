import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessageInsert() {
  try {
    console.log('🧪 Testing message insert...');
    
    // First, let's get a sample purchase order ID
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (poError || !purchaseOrders || purchaseOrders.length === 0) {
      console.log('❌ No purchase orders found or error:', poError?.message);
      return;
    }
    
    const testPurchaseOrderId = purchaseOrders[0].id;
    console.log('📋 Using purchase order ID:', testPurchaseOrderId);
    
    // Test the exact same insert that the service is trying to do
    const testMessage = {
      purchase_order_id: testPurchaseOrderId,
      sender: 'Test User',
      content: 'Test message from debug script',
      type: 'user',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Attempting to insert message:', testMessage);
    
    const { data, error } = await supabase
      .from('purchase_order_messages')
      .insert(testMessage)
      .select();
    
    if (error) {
      console.log('❌ Insert failed:', error);
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up the test message
      await supabase
        .from('purchase_order_messages')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test message cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testMessageInsert();
