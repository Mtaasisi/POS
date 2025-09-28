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

async function makeCreatedByNullable() {
  console.log('🔧 Making created_by field nullable...\n');

  try {
    // Test payment creation with null created_by
    console.log('🧪 Testing payment creation with null created_by...');
    
    const { data: accounts } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('is_payment_method', true)
      .limit(1);
    
    const { data: orders } = await supabase
      .from('lats_purchase_orders')
      .select('id, currency')
      .limit(1);
    
    if (!accounts || !orders) {
      console.error('❌ Missing test data');
      return;
    }
    
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('purchase_order_payments')
      .insert({
        purchase_order_id: orders[0].id,
        payment_account_id: accounts[0].id,
        amount: 100,
        currency: orders[0].currency || 'TZS',
        payment_method: 'Cash',
        payment_method_id: accounts[0].id,
        reference: 'TEST-NULL-' + Date.now(),
        notes: 'Test payment with null created_by',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: null
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Payment creation still failing:', paymentError);
      console.log('\n💡 The created_by field is still NOT NULL. You need to apply the migration manually:');
      console.log('   ALTER TABLE purchase_order_payments ALTER COLUMN created_by DROP NOT NULL;');
    } else {
      console.log('✅ Test payment created successfully with null created_by:', paymentRecord.id);
      
      // Clean up test payment
      await supabase
        .from('purchase_order_payments')
        .delete()
        .eq('id', paymentRecord.id);
      console.log('🧹 Test payment cleaned up');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeCreatedByNullable().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
