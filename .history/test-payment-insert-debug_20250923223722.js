import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPaymentInsert() {
  console.log('🧪 Testing Payment Insert with Debug Information...');
  
  try {
    // Step 1: Check authentication
    console.log('\n🔐 Step 1: Authentication Check...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 Auth check result:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      authError: authError?.message || 'None'
    });
    
    if (authError || !user) {
      console.log('❌ No user authenticated - this is the cause of 400 errors!');
      console.log('💡 SOLUTION: Log in to your application first');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: Test with minimal data (like your example)
    console.log('\n🧪 Step 2: Testing with minimal payment data...');
    
    const paymentData = {
      customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID - replace with real customer ID
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      payment_date: new Date().toISOString(),
      created_by: user.id,
      // Add the new required fields
      currency: 'TZS',
      payment_account_id: '00000000-0000-0000-0000-000000000000', // dummy UUID - replace with real account ID
      payment_method_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      reference: 'TEST_PAYMENT_DEBUG',
      notes: 'Debug test payment'
    };
    
    console.log('📤 Payment data to insert:', JSON.stringify(paymentData, null, 2));
    console.log('📋 Data types check:', {
      customer_id: typeof paymentData.customer_id,
      amount: typeof paymentData.amount,
      method: typeof paymentData.method,
      payment_type: typeof paymentData.payment_type,
      status: typeof paymentData.status,
      payment_date: typeof paymentData.payment_date,
      created_by: typeof paymentData.created_by,
      currency: typeof paymentData.currency,
      payment_account_id: typeof paymentData.payment_account_id,
      payment_method_id: typeof paymentData.payment_method_id,
      reference: typeof paymentData.reference,
      notes: typeof paymentData.notes
    });
    
    console.log('\n📡 Making Supabase request...');
    const { data, error } = await supabase
      .from('customer_payments')
      .insert([paymentData])
      .select();
    
    console.log('📡 Supabase response received');
    
    if (error) {
      console.error('❌ Payment insert failed!');
      console.error('🔍 Complete error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status,
        statusText: error.statusText
      });
      
      // Analyze the error
      if (error.message.includes('row-level security policy')) {
        console.error('🚫 RLS Policy violation - user not authorized');
        console.error('💡 This means the user is not properly authenticated');
      }
      
      if (error.message.includes('violates check constraint')) {
        console.error('🚫 Check constraint violation - field values invalid');
        console.error('💡 Check if method, status, or payment_type values are allowed');
        console.error('💡 Allowed values:');
        console.error('   - method: cash, card, transfer');
        console.error('   - payment_type: payment, deposit, refund');
        console.error('   - status: completed, pending, failed');
      }
      
      if (error.message.includes('violates foreign key constraint')) {
        console.error('🚫 Foreign key violation - referenced IDs don\'t exist');
        console.error('💡 The dummy UUIDs don\'t exist in related tables');
        console.error('💡 You need to use real customer_id and payment_account_id');
      }
      
      if (error.message.includes('violates not-null constraint')) {
        console.error('🚫 Not-null constraint violation - required field missing');
        console.error('💡 Check if all required fields are provided');
      }
      
      if (error.message.includes('duplicate key value')) {
        console.error('🚫 Duplicate key violation - record already exists');
      }
      
    } else {
      console.log('✅ Payment inserted successfully!');
      console.log('📊 Inserted payment data:', JSON.stringify(data, null, 2));
      
      // Clean up test data
      if (data && data.length > 0) {
        console.log('\n🧹 Cleaning up test data...');
        const { error: deleteError } = await supabase
          .from('customer_payments')
          .delete()
          .eq('id', data[0].id);
        
        if (deleteError) {
          console.error('⚠️ Error cleaning up test data:', deleteError.message);
        } else {
          console.log('✅ Test data cleaned up successfully');
        }
      }
    }
    
    // Step 3: Get real data for testing
    console.log('\n🔍 Step 3: Getting real data for testing...');
    
    try {
      // Get a real customer ID
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .limit(1);
      
      if (customerError) {
        console.log('⚠️ Could not fetch customers:', customerError.message);
      } else if (customers && customers.length > 0) {
        console.log('✅ Found real customer:', customers[0]);
        
        // Get a real finance account ID
        const { data: accounts, error: accountError } = await supabase
          .from('finance_accounts')
          .select('id, name, currency')
          .limit(1);
        
        if (accountError) {
          console.log('⚠️ Could not fetch finance accounts:', accountError.message);
        } else if (accounts && accounts.length > 0) {
          console.log('✅ Found real finance account:', accounts[0]);
          
          // Test with real data
          console.log('\n🧪 Step 4: Testing with real data...');
          
          const realPaymentData = {
            customer_id: customers[0].id,
            amount: 50.00,
            method: 'cash',
            payment_type: 'payment',
            status: 'completed',
            payment_date: new Date().toISOString(),
            created_by: user.id,
            currency: 'TZS',
            payment_account_id: accounts[0].id,
            payment_method_id: accounts[0].id,
            reference: 'REAL_DATA_TEST',
            notes: 'Test with real customer and account IDs'
          };
          
          console.log('📤 Real payment data:', JSON.stringify(realPaymentData, null, 2));
          
          const { data: realData, error: realError } = await supabase
            .from('customer_payments')
            .insert([realPaymentData])
            .select();
          
          if (realError) {
            console.error('❌ Real data insert failed:', realError.message);
          } else {
            console.log('✅ Real data insert successful!');
            console.log('📊 Real payment created:', JSON.stringify(realData, null, 2));
            
            // Clean up
            if (realData && realData.length > 0) {
              await supabase
                .from('customer_payments')
                .delete()
                .eq('id', realData[0].id);
              console.log('🧹 Real test data cleaned up');
            }
          }
        }
      }
    } catch (err) {
      console.log('⚠️ Error fetching real data:', err.message);
    }
    
    // Step 4: Recommendations
    console.log('\n📋 Step 4: Recommendations...');
    console.log('');
    console.log('🔧 To fix your 400 error:');
    console.log('');
    console.log('1. Make sure you\'re logged in to your application');
    console.log('2. Use real customer IDs and payment account IDs (not dummy UUIDs)');
    console.log('3. Include all required fields:');
    console.log('   - customer_id (must exist in customers table)');
    console.log('   - amount (number > 0)');
    console.log('   - method (cash, card, or transfer)');
    console.log('   - payment_type (payment, deposit, or refund)');
    console.log('   - status (completed, pending, or failed)');
    console.log('   - currency (TZS, USD, etc.)');
    console.log('   - payment_account_id (must exist in finance_accounts table)');
    console.log('   - payment_method_id');
    console.log('   - created_by (authenticated user ID)');
    console.log('');
    console.log('4. Check the browser console for detailed error messages');
    console.log('5. Use the debug logging in your payment service functions');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPaymentInsert();
