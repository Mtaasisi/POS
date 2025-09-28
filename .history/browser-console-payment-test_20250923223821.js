// =====================================================
// BROWSER CONSOLE PAYMENT TEST
// =====================================================
// Copy and paste this code into your browser console
// when you're logged in to your application

console.log('🧪 Browser Console Payment Test Starting...');

// Test 1: Check authentication
console.log('\n🔐 Step 1: Checking authentication...');
const { data: { user }, error: authError } = await supabase.auth.getUser();

console.log('🔍 Auth check result:', {
  hasUser: !!user,
  userEmail: user?.email,
  userId: user?.id,
  authError: authError?.message || 'None'
});

if (authError || !user) {
  console.error('❌ No user authenticated - this is the cause of 400 errors!');
  console.error('💡 SOLUTION: Make sure you are logged in to your application');
} else {
  console.log('✅ User authenticated:', user.email);
  
  // Test 2: Try to get real data
  console.log('\n🔍 Step 2: Getting real customer and account data...');
  
  try {
    // Get a real customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (customerError) {
      console.error('❌ Error fetching customers:', customerError.message);
    } else if (customers && customers.length > 0) {
      console.log('✅ Found customer:', customers[0]);
      
      // Get a real finance account
      const { data: accounts, error: accountError } = await supabase
        .from('finance_accounts')
        .select('id, name, currency')
        .limit(1);
      
      if (accountError) {
        console.error('❌ Error fetching finance accounts:', accountError.message);
      } else if (accounts && accounts.length > 0) {
        console.log('✅ Found finance account:', accounts[0]);
        
        // Test 3: Create payment with real data
        console.log('\n🧪 Step 3: Testing payment insert with real data...');
        
        const paymentData = {
          customer_id: customers[0].id,
          amount: 25.00,
          method: 'cash',
          payment_type: 'payment',
          status: 'completed',
          payment_date: new Date().toISOString(),
          created_by: user.id,
          currency: 'TZS',
          payment_account_id: accounts[0].id,
          payment_method_id: accounts[0].id,
          reference: 'BROWSER_CONSOLE_TEST',
          notes: 'Test payment from browser console'
        };
        
        console.log('📤 Payment data to insert:', JSON.stringify(paymentData, null, 2));
        
        const { data, error } = await supabase
          .from('customer_payments')
          .insert([paymentData])
          .select();
        
        if (error) {
          console.error('❌ Payment insert failed!');
          console.error('🔍 Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          // Analyze the error
          if (error.message.includes('row-level security policy')) {
            console.error('🚫 RLS Policy violation - user not authorized');
          }
          if (error.message.includes('violates check constraint')) {
            console.error('🚫 Check constraint violation - field values invalid');
          }
          if (error.message.includes('violates foreign key constraint')) {
            console.error('🚫 Foreign key violation - referenced IDs don\'t exist');
          }
          if (error.message.includes('violates not-null constraint')) {
            console.error('🚫 Not-null constraint violation - required field missing');
          }
        } else {
          console.log('✅ Payment inserted successfully!');
          console.log('📊 Inserted payment:', JSON.stringify(data, null, 2));
          
          // Clean up test data
          console.log('\n🧹 Cleaning up test data...');
          const { error: deleteError } = await supabase
            .from('customer_payments')
            .delete()
            .eq('id', data[0].id);
          
          if (deleteError) {
            console.error('⚠️ Error cleaning up:', deleteError.message);
          } else {
            console.log('✅ Test data cleaned up successfully');
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

console.log('\n🎉 Browser Console Payment Test Complete!');
console.log('\n💡 If the test was successful, your payment system is working correctly.');
console.log('💡 If you got errors, check the error messages above for specific issues.');
