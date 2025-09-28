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

async function testPaymentService() {
  console.log('🧪 Testing Payment Service with actual data...\n');

  try {
    // Test with the exact data from the logs
    const testData = {
      purchaseOrderId: '286e5379-4508-4645-be6e-64a275d028ee',
      paymentAccountId: 'deb92580-95dd-4018-9f6a-134b2157716c',
      amount: 1000,
      currency: 'USD',
      paymentMethod: 'Cash',
      paymentMethodId: 'deb92580-95dd-4018-9f6a-134b2157716c',
      reference: 'TEST-' + Date.now(),
      notes: 'Test payment',
      createdBy: 'test-user-id'
    };

    console.log('📋 Test data:', testData);

    // Step 1: Validate payment account
    console.log('\n1. Validating payment account...');
    const { data: paymentAccount, error: accountError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('id', testData.paymentAccountId)
      .single();

    if (accountError || !paymentAccount) {
      console.error('❌ Payment account not found:', accountError);
      return;
    }
    console.log('✅ Payment account found:', paymentAccount.name, 'Balance:', paymentAccount.balance);

    // Step 2: Check account balance
    console.log('\n2. Checking account balance...');
    if (paymentAccount.balance < testData.amount) {
      console.error(`❌ Insufficient balance. Available: ${paymentAccount.currency} ${paymentAccount.balance.toLocaleString()}`);
      return;
    }
    console.log('✅ Sufficient balance available');

    // Step 3: Get valid user ID
    console.log('\n3. Getting valid user ID...');
    const { data: validUser, error: userError } = await supabase
      .from('auth_users')
      .select('id')
      .limit(1)
      .single();

    if (userError || !validUser) {
      console.error('❌ No valid user found in auth_users table:', userError);
      return;
    }
    console.log('✅ Valid user ID found:', validUser.id);

    // Step 4: Create payment record
    console.log('\n4. Creating payment record...');
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('purchase_order_payments')
      .insert({
        purchase_order_id: testData.purchaseOrderId,
        payment_account_id: testData.paymentAccountId,
        amount: testData.amount,
        currency: testData.currency,
        payment_method: testData.paymentMethod,
        payment_method_id: testData.paymentMethodId,
        reference: testData.reference,
        notes: testData.notes,
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: validUser.id
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Payment creation failed:', paymentError);
      console.error('❌ Error details:', JSON.stringify(paymentError, null, 2));
    } else {
      console.log('✅ Payment created successfully:', paymentRecord.id);
      
      // Step 5: Update account balance
      console.log('\n5. Updating account balance...');
      const { error: balanceError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: paymentAccount.balance - testData.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', testData.paymentAccountId);

      if (balanceError) {
        console.error('⚠️ Error updating account balance:', balanceError);
      } else {
        console.log('✅ Account balance updated successfully');
      }

      // Clean up test payment
      console.log('\n6. Cleaning up test payment...');
      await supabase
        .from('purchase_order_payments')
        .delete()
        .eq('id', paymentRecord.id);
      console.log('✅ Test payment cleaned up');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPaymentService().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
