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

async function applyPaymentFix() {
  console.log('🔧 Applying purchase order payments foreign key fix...\n');

  try {
    // 1. Drop the existing foreign key constraint
    console.log('1. Dropping existing foreign key constraint...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE purchase_order_payments DROP CONSTRAINT IF EXISTS purchase_order_payments_created_by_fkey;'
    });
    
    if (dropError) {
      console.log('⚠️ Could not drop constraint (may not exist):', dropError.message);
    } else {
      console.log('✅ Dropped existing foreign key constraint');
    }

    // 2. Add the correct foreign key constraint
    console.log('\n2. Adding correct foreign key constraint...');
    const { error: addError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE purchase_order_payments ADD CONSTRAINT purchase_order_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE SET NULL;'
    });
    
    if (addError) {
      console.error('❌ Error adding foreign key constraint:', addError);
    } else {
      console.log('✅ Added correct foreign key constraint');
    }

    // 3. Test the fix by creating a test payment
    console.log('\n3. Testing payment creation...');
    
    // Get a test user ID from auth_users table
    const { data: users, error: usersError } = await supabase
      .from('auth_users')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found in auth_users table:', usersError);
      return;
    }
    
    const testUserId = users[0].id;
    console.log('🧪 Using test user ID:', testUserId);
    
    // Get test data
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
    
    // Test payment creation
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('purchase_order_payments')
      .insert({
        purchase_order_id: orders[0].id,
        payment_account_id: accounts[0].id,
        amount: 100,
        currency: orders[0].currency || 'TZS',
        payment_method: 'Cash',
        payment_method_id: accounts[0].id,
        reference: 'TEST-FIX-' + Date.now(),
        notes: 'Test payment after foreign key fix',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: testUserId
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Payment creation still failing:', paymentError);
    } else {
      console.log('✅ Test payment created successfully:', paymentRecord.id);
      
      // Clean up test payment
      await supabase
        .from('purchase_order_payments')
        .delete()
        .eq('id', paymentRecord.id);
      console.log('🧹 Test payment cleaned up');
    }

  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

applyPaymentFix().then(() => {
  console.log('\n🏁 Fix application complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix application failed:', error);
  process.exit(1);
});
