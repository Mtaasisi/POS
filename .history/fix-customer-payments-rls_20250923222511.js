import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixCustomerPaymentsRLS() {
  console.log('🚀 Fixing Customer Payments RLS Policy...');
  
  try {
    // Step 1: Test current authentication
    console.log('📋 Step 1: Testing authentication...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
      console.log('💡 You need to be logged in to test RLS policies');
      console.log('');
      console.log('🔧 Manual Fix Required:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project: jxhzveborezjhsmzsgbc');
      console.log('3. Navigate to Authentication > Policies');
      console.log('4. Find the customer_payments table');
      console.log('5. Update the policy to allow INSERT operations');
      console.log('');
      console.log('Or run this SQL in the SQL Editor:');
      console.log('');
      console.log('-- Drop existing restrictive policy');
      console.log('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;');
      console.log('');
      console.log('-- Create new permissive policy for authenticated users');
      console.log('CREATE POLICY "Enable all access for authenticated users" ON customer_payments');
      console.log('    FOR ALL USING (auth.role() = \'authenticated\');');
      console.log('');
      return;
    }
    
    if (!user) {
      console.log('⚠️  No user logged in');
      console.log('💡 Please log in to your app first, then test payments');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: Test current RLS policy
    console.log('\n📋 Step 2: Testing current RLS policy...');
    
    try {
      // Try to insert a test payment
      const { data: insertData, error: insertError } = await supabase
        .from('customer_payments')
        .insert([{
          customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID for testing
          amount: 100.00,
          method: 'cash',
          payment_type: 'payment',
          status: 'completed',
          currency: 'TZS',
          reference: 'RLS_TEST_PAYMENT'
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        
        if (insertError.message.includes('row-level security policy')) {
          console.log('💡 RLS policy is blocking the insert');
          console.log('');
          console.log('🔧 Manual Fix Required:');
          console.log('1. Go to https://supabase.com/dashboard');
          console.log('2. Select your project: jxhzveborezjhsmzsgbc');
          console.log('3. Navigate to Authentication > Policies');
          console.log('4. Find the customer_payments table');
          console.log('5. Update the policy to allow INSERT operations');
          console.log('');
          console.log('Or run this SQL in the SQL Editor:');
          console.log('');
          console.log('-- Drop existing restrictive policy');
          console.log('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;');
          console.log('');
          console.log('-- Create new permissive policy for authenticated users');
          console.log('CREATE POLICY "Enable all access for authenticated users" ON customer_payments');
          console.log('    FOR ALL USING (auth.role() = \'authenticated\');');
        }
      } else {
        console.log('✅ Insert successful - RLS policy is working correctly');
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('customer_payments')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ RLS test failed:', err.message);
    }
    
    // Step 3: Check if we can read existing data
    console.log('\n📋 Step 3: Testing read access...');
    
    try {
      const { data: readData, error: readError } = await supabase
        .from('customer_payments')
        .select('id, amount, method')
        .limit(1);
      
      if (readError) {
        console.log('❌ Read failed:', readError.message);
      } else {
        console.log('✅ Read access working');
        console.log(`📊 Found ${readData?.length || 0} existing payment records`);
      }
    } catch (err) {
      console.log('❌ Read test failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the RLS fix test
fixCustomerPaymentsRLS();
