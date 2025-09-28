const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPurchaseOrderPaymentsQuery() {
  try {
    console.log('🔍 Testing Purchase Order payments query...');
    
    // Test the simplified query
    const { data: poPayments, error: poPaymentsError } = await supabase
      .from('purchase_order_payments')
      .select(`
        *,
        lats_purchase_orders(
          order_number,
          total_amount,
          status,
          supplier_id
        ),
        finance_accounts(name)
      `)
      .order('payment_date', { ascending: false })
      .limit(10);
    
    if (poPaymentsError) {
      console.log('❌ Query still fails:', poPaymentsError.message);
    } else {
      console.log('✅ Query now works! Found', poPayments?.length || 0, 'records');
      if (poPayments && poPayments.length > 0) {
        console.log('Sample record:', JSON.stringify(poPayments[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPurchaseOrderPaymentsQuery();
