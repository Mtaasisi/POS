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

async function createSystemUser() {
  console.log('🔧 Creating system user...\n');

  try {
    // Create system user
    const { data: systemUser, error: systemUserError } = await supabase
      .from('auth_users')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'system@lats.com',
        username: 'system',
        name: 'System User',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (systemUserError) {
      console.error('❌ Error creating system user:', systemUserError);
    } else {
      console.log('✅ System user created/updated:', systemUser);
    }

    // Test payment creation
    console.log('\n🧪 Testing payment creation...');
    
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
        reference: 'TEST-SYSTEM-' + Date.now(),
        notes: 'Test payment with system user',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: '00000000-0000-0000-0000-000000000000'
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
    console.error('❌ Error:', error);
  }
}

createSystemUser().then(() => {
  console.log('\n🏁 System user creation complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ System user creation failed:', error);
  process.exit(1);
});
