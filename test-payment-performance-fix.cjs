const { createClient } = require('@supabase/supabase-js');

// Use the credentials from the scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentPerformanceFix() {
  try {
    console.log('🧪 Testing payment performance function fix...');
    
    // Test 1: Check if the function exists
    console.log('🔍 Test 1: Checking if record_payment_performance function exists...');
    
    try {
      const { data, error } = await supabase.rpc('record_payment_performance', {
        provider_name_param: 'Cash',
        transaction_id_param: null,
        transaction_type_param: 'test',
        amount_param: 100,
        currency_param: 'TZS',
        status_param: 'success',
        response_time_ms_param: 50,
        error_message_param: null
      });
      
      if (error) {
        console.log('❌ Function test failed:', error.message);
        return;
      }
      
      console.log('✅ Function exists and works! Result:', data);
      
    } catch (err) {
      console.log('❌ Function does not exist or has errors:', err.message);
      console.log('🔧 Please run the SQL from fix-payment-performance-function-simple.sql in your Supabase dashboard');
      return;
    }
    
    // Test 2: Check if payment_providers table has data
    console.log('🔍 Test 2: Checking payment_providers table...');
    
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('id, name, type')
      .limit(5);
    
    if (providersError) {
      console.log('❌ payment_providers table error:', providersError.message);
    } else {
      console.log('✅ payment_providers table accessible, found providers:', providers);
    }
    
    // Test 3: Check if payment_performance_metrics table exists
    console.log('🔍 Test 3: Checking payment_performance_metrics table...');
    
    const { data: metrics, error: metricsError } = await supabase
      .from('payment_performance_metrics')
      .select('id')
      .limit(1);
    
    if (metricsError) {
      console.log('❌ payment_performance_metrics table error:', metricsError.message);
    } else {
      console.log('✅ payment_performance_metrics table accessible');
    }
    
    // Test 4: Try a real payment function call
    console.log('🔍 Test 4: Testing payment function integration...');
    
    try {
      // This should work if the function is properly integrated
      const { data: testData, error: testError } = await supabase.rpc('record_payment_performance', {
        provider_name_param: 'M-Pesa',
        transaction_id_param: null,
        transaction_type_param: 'customer_payment',
        amount_param: 5000,
        currency_param: 'TZS',
        status_param: 'success',
        response_time_ms_param: 1200,
        error_message_param: null
      });
      
      if (testError) {
        console.log('❌ Integration test failed:', testError.message);
      } else {
        console.log('✅ Integration test passed! Payment performance recorded successfully');
      }
      
    } catch (err) {
      console.log('❌ Integration test error:', err.message);
    }
    
    console.log('🎉 Payment performance function testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentPerformanceFix();
