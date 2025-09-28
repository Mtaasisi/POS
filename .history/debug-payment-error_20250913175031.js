import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaymentError() {
  console.log('🔍 Debugging Payment Error...\n');

  try {
    // 1. Check if purchase_order_payments table exists
    console.log('1. Checking purchase_order_payments table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('purchase_order_payments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ purchase_order_payments table error:', tableError);
    } else {
      console.log('✅ purchase_order_payments table exists');
    }

    // 2. Check if finance_accounts table exists and has data
    console.log('\n2. Checking finance_accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('is_payment_method', true)
      .eq('is_active', true);
    
    if (accountsError) {
      console.error('❌ finance_accounts table error:', accountsError);
    } else {
      console.log('✅ finance_accounts table exists');
      console.log(`📊 Found ${accounts?.length || 0} payment accounts:`, accounts?.map(a => ({ id: a.id, name: a.name, balance: a.balance, currency: a.currency })));
    }

    // 3. Check if lats_purchase_orders table exists
    console.log('\n3. Checking lats_purchase_orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, total_amount, currency')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ lats_purchase_orders table error:', ordersError);
    } else {
      console.log('✅ lats_purchase_orders table exists');
      console.log(`📊 Found ${orders?.length || 0} purchase orders:`, orders?.map(o => ({ id: o.id, orderNumber: o.order_number, totalAmount: o.total_amount, currency: o.currency })));
    }

    // 4. Test a simple payment creation with mock data
    console.log('\n4. Testing payment creation...');
    
    if (accounts && accounts.length > 0 && orders && orders.length > 0) {
      const testAccount = accounts[0];
      const testOrder = orders[0];
      
      console.log(`🧪 Testing with account: ${testAccount.name} (${testAccount.id})`);
      console.log(`🧪 Testing with order: ${testOrder.order_number} (${testOrder.id})`);
      
      // Test payment creation
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('purchase_order_payments')
        .insert({
          purchase_order_id: testOrder.id,
          payment_account_id: testAccount.id,
          amount: 100,
          currency: testOrder.currency || 'TZS',
          payment_method: 'Cash',
          payment_method_id: testAccount.id,
          reference: 'TEST-' + Date.now(),
          notes: 'Test payment for debugging',
          status: 'completed',
          payment_date: new Date().toISOString(),
          created_by: '00000000-0000-0000-0000-000000000000' // Mock user ID
        })
        .select()
        .single();

      if (paymentError) {
        console.error('❌ Payment creation error:', paymentError);
        console.error('❌ Error details:', JSON.stringify(paymentError, null, 2));
      } else {
        console.log('✅ Test payment created successfully:', paymentRecord);
        
        // Clean up test payment
        await supabase
          .from('purchase_order_payments')
          .delete()
          .eq('id', paymentRecord.id);
        console.log('🧹 Test payment cleaned up');
      }
    } else {
      console.log('⚠️ Cannot test payment creation - missing test data');
    }

    // 5. Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'purchase_order_payments' });
    
    if (policiesError) {
      console.log('⚠️ Could not check RLS policies (function may not exist)');
    } else {
      console.log('📋 RLS policies:', policies);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug function
debugPaymentError().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
