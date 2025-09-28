const { createClient } = require('@supabase/supabase-js');

// Use the credentials from the scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentFixFinal() {
  try {
    console.log('🧪 Testing final payment performance fix...');
    
    // Test 1: Check if payment_providers table has data
    console.log('🔍 Test 1: Checking payment_providers table...');
    
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('id, name, type, provider_code, status')
      .limit(5);
    
    if (providersError) {
      console.log('❌ payment_providers table error:', providersError.message);
    } else {
      console.log('✅ payment_providers table accessible, found providers:', providers);
    }
    
    // Test 2: Check if payment_performance_metrics table exists
    console.log('🔍 Test 2: Checking payment_performance_metrics table...');
    
    const { data: metrics, error: metricsError } = await supabase
      .from('payment_performance_metrics')
      .select('id, transaction_type, amount, status')
      .limit(3);
    
    if (metricsError) {
      console.log('❌ payment_performance_metrics table error:', metricsError.message);
    } else {
      console.log('✅ payment_performance_metrics table accessible, found metrics:', metrics);
    }
    
    // Test 3: Test the record_payment_performance function
    console.log('🔍 Test 3: Testing record_payment_performance function...');
    
    try {
      const { data, error } = await supabase.rpc('record_payment_performance', {
        provider_name_param: 'Cash',
        transaction_id_param: null,
        transaction_type_param: 'customer_payment',
        amount_param: 2500,
        currency_param: 'TZS',
        status_param: 'success',
        response_time_ms_param: 800,
        error_message_param: null
      });
      
      if (error) {
        console.log('❌ Function test failed:', error.message);
        console.log('🔧 Please run the RLS fix: fix-payment-providers-rls.sql');
      } else {
        console.log('✅ Function works! Result:', data);
      }
      
    } catch (err) {
      console.log('❌ Function error:', err.message);
      console.log('🔧 Please run the RLS fix: fix-payment-providers-rls.sql');
    }
    
    // Test 4: Check if we can read the performance metrics
    console.log('🔍 Test 4: Checking performance metrics data...');
    
    const { data: performanceData, error: perfError } = await supabase
      .from('payment_performance_metrics')
      .select(`
        id,
        transaction_type,
        amount,
        currency,
        status,
        response_time_ms,
        created_at,
        payment_providers!inner(name, type)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (perfError) {
      console.log('❌ Performance metrics query error:', perfError.message);
    } else {
      console.log('✅ Performance metrics query successful, found records:', performanceData);
    }
    
    console.log('🎉 Payment performance function testing completed!');
    
    if (providers && providers.length > 0 && !metricsError) {
      console.log('✅ All systems working! Payment performance tracking is ready.');
    } else {
      console.log('⚠️ Some issues detected. Please run the RLS fix if needed.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentFixFinal();
