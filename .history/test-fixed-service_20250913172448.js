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

async function testFixedService() {
  try {
    console.log('🧪 Testing fixed service methods...');
    
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
    
    // Test the fixed message insert (using the correct field mapping)
    const testMessage = {
      purchase_order_id: testPurchaseOrderId,
      sender: 'Test User',
      content: 'Test message with fixed field mapping',
      type: 'user',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Testing message insert with correct field mapping...');
    
    const { data: messageData, error: messageError } = await supabase
      .from('purchase_order_messages')
      .insert(testMessage)
      .select();
    
    if (messageError) {
      console.log('❌ Message insert failed:', messageError);
    } else {
      console.log('✅ Message insert successful:', messageData);
      
      // Test fetching messages
      console.log('📥 Testing message fetch...');
      const { data: fetchedMessages, error: fetchError } = await supabase
        .from('purchase_order_messages')
        .select('*')
        .eq('purchase_order_id', testPurchaseOrderId)
        .order('timestamp', { ascending: false });
      
      if (fetchError) {
        console.log('❌ Message fetch failed:', fetchError);
      } else {
        console.log('✅ Message fetch successful:', fetchedMessages);
      }
      
      // Clean up the test message
      await supabase
        .from('purchase_order_messages')
        .delete()
        .eq('id', messageData[0].id);
      console.log('🧹 Test message cleaned up');
    }
    
    // Test payment insert (if we have a finance account)
    console.log('');
    console.log('💰 Testing payment functionality...');
    
    const { data: financeAccounts, error: accountError } = await supabase
      .from('finance_accounts')
      .select('id')
      .limit(1);
    
    if (accountError || !financeAccounts || financeAccounts.length === 0) {
      console.log('⚠️ No finance accounts found, skipping payment test');
    } else {
      const testPayment = {
        purchase_order_id: testPurchaseOrderId,
        payment_account_id: financeAccounts[0].id,
        amount: 1000,
        currency: 'TZS',
        payment_method: 'CRDB',
        payment_method_id: 'test-method-id',
        reference: 'TEST-REF-001',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000' // Dummy user ID
      };
      
      console.log('📤 Testing payment insert...');
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('purchase_order_payments')
        .insert(testPayment)
        .select();
      
      if (paymentError) {
        console.log('❌ Payment insert failed:', paymentError);
      } else {
        console.log('✅ Payment insert successful:', paymentData);
        
        // Clean up the test payment
        await supabase
          .from('purchase_order_payments')
          .delete()
          .eq('id', paymentData[0].id);
        console.log('🧹 Test payment cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testFixedService();
