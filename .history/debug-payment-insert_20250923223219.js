import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugPaymentInsert() {
  console.log('🔍 Debugging Payment Insert Issues...');
  
  try {
    // Step 1: Check authentication
    console.log('\n📋 Step 1: Authentication Check...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No user authenticated');
      console.log('💡 This is the root cause of your 400 error!');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Make sure you are logged in to your application');
      console.log('2. Check if your session has expired');
      console.log('3. Try refreshing the page and logging in again');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: Test different insert scenarios
    console.log('\n📋 Step 2: Testing Insert Scenarios...');
    
    // Test 1: Minimal insert (what the original code was doing)
    console.log('\n🧪 Test 1: Minimal insert (original code)...');
    try {
      const minimalData = {
        customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        device_id: null,
        amount: 100.00,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed',
        payment_date: new Date().toISOString(),
        created_by: user.id
      };
      
      console.log('📤 Sending data:', JSON.stringify(minimalData, null, 2));
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('customer_payments')
        .insert([minimalData])
        .select();
      
      if (minimalError) {
        console.log('❌ Minimal insert failed:', minimalError.message);
        console.log('🔍 Error code:', minimalError.code);
        console.log('🔍 Error details:', minimalError.details);
        console.log('🔍 Error hint:', minimalError.hint);
        
        if (minimalError.message.includes('violates check constraint')) {
          console.log('💡 Check constraint violation - field values don\'t match allowed values');
        }
        if (minimalError.message.includes('violates foreign key constraint')) {
          console.log('💡 Foreign key violation - referenced IDs don\'t exist');
        }
        if (minimalError.message.includes('violates not-null constraint')) {
          console.log('💡 Not-null constraint violation - required field is missing');
        }
      } else {
        console.log('✅ Minimal insert successful!');
        console.log('📊 Result:', minimalResult);
        
        // Clean up
        if (minimalResult && minimalResult.length > 0) {
          await supabase
            .from('customer_payments')
            .delete()
            .eq('id', minimalResult[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ Minimal insert test failed:', err.message);
    }
    
    // Test 2: Full insert (with all new columns)
    console.log('\n🧪 Test 2: Full insert (with all columns)...');
    try {
      const fullData = {
        customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        device_id: null,
        amount: 100.00,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed',
        currency: 'TZS',
        payment_account_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        payment_method_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        reference: 'DEBUG_TEST_FULL',
        notes: 'Debug test with all columns',
        payment_date: new Date().toISOString(),
        created_by: user.id
      };
      
      console.log('📤 Sending data:', JSON.stringify(fullData, null, 2));
      
      const { data: fullResult, error: fullError } = await supabase
        .from('customer_payments')
        .insert([fullData])
        .select();
      
      if (fullError) {
        console.log('❌ Full insert failed:', fullError.message);
        console.log('🔍 Error code:', fullError.code);
        console.log('🔍 Error details:', fullError.details);
        console.log('🔍 Error hint:', fullError.hint);
      } else {
        console.log('✅ Full insert successful!');
        console.log('📊 Result:', fullResult);
        
        // Clean up
        if (fullResult && fullResult.length > 0) {
          await supabase
            .from('customer_payments')
            .delete()
            .eq('id', fullResult[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ Full insert test failed:', err.message);
    }
    
    // Step 3: Check table constraints
    console.log('\n📋 Step 3: Table Structure Check...');
    try {
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('customer_payments')
        .select('*')
        .limit(0);
      
      if (tableError) {
        console.log('❌ Cannot access table:', tableError.message);
      } else {
        console.log('✅ Table is accessible');
      }
    } catch (err) {
      console.log('❌ Table access test failed:', err.message);
    }
    
    // Step 4: Recommendations
    console.log('\n📋 Step 4: Recommendations...');
    console.log('');
    console.log('🔧 Based on the test results:');
    console.log('');
    console.log('1. If authentication tests pass but inserts fail:');
    console.log('   - Check if the dummy UUIDs exist in related tables');
    console.log('   - Verify field constraints (method values, etc.)');
    console.log('   - Make sure all required fields are provided');
    console.log('');
    console.log('2. If you\'re still getting 400 errors in your app:');
    console.log('   - Make sure you\'re using the updated repairPaymentService.ts');
    console.log('   - Check browser console for the exact error details');
    console.log('   - Verify you\'re logged in when making payments');
    console.log('');
    console.log('3. To fix the issue:');
    console.log('   - Use real customer IDs and payment account IDs');
    console.log('   - Ensure all required fields are included');
    console.log('   - Make sure the user is authenticated');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugPaymentInsert();
