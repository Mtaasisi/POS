// Test script to diagnose and fix the 406 Not Acceptable error
// This script tests the Supabase client configuration and API calls

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzQ4MDAsImV4cCI6MjA1MTA1MDgwMH0.8d246123'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseKey
    }
  }
});

// Test functions
async function testBasicConnection() {
  console.log('🔍 Testing basic Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic connection failed:', error);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    return true;
  } catch (err) {
    console.error('❌ Basic connection error:', err);
    return false;
  }
}

async function testSpecificSaleQuery() {
  console.log('🔍 Testing specific sale query...');
  
  const failingSaleId = '36487185-0673-4e03-83c2-26eba8d9fef7';
  
  try {
    // Test 1: Simple select
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_sales')
      .select('id, sale_number')
      .eq('id', failingSaleId)
      .single();
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      return false;
    }
    
    console.log('✅ Simple query successful:', simpleData);
    
    // Test 2: Complex query with joins
    const { data: complexData, error: complexError } = await supabase
      .from('lats_sales')
      .select(`
        id,
        sale_number,
        customer_id,
        total_amount,
        payment_method,
        status,
        created_at,
        lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', failingSaleId)
      .single();
    
    if (complexError) {
      console.error('❌ Complex query failed:', complexError);
      return false;
    }
    
    console.log('✅ Complex query successful:', complexData);
    return true;
  } catch (err) {
    console.error('❌ Query error:', err);
    return false;
  }
}

async function testAlternativeQueryMethods() {
  console.log('🔍 Testing alternative query methods...');
  
  const failingSaleId = '36487185-0673-4e03-83c2-26eba8d9fef7';
  
  try {
    // Method 1: Using .select() with explicit columns
    const { data: method1, error: error1 } = await supabase
      .from('lats_sales')
      .select('id,sale_number,created_at')
      .eq('id', failingSaleId);
    
    if (error1) {
      console.error('❌ Method 1 failed:', error1);
    } else {
      console.log('✅ Method 1 successful:', method1);
    }
    
    // Method 2: Using .select() with minimal columns
    const { data: method2, error: error2 } = await supabase
      .from('lats_sales')
      .select('id')
      .eq('id', failingSaleId);
    
    if (error2) {
      console.error('❌ Method 2 failed:', error2);
    } else {
      console.log('✅ Method 2 successful:', method2);
    }
    
    // Method 3: Using .select() with count
    const { count, error: error3 } = await supabase
      .from('lats_sales')
      .select('*', { count: 'exact', head: true })
      .eq('id', failingSaleId);
    
    if (error3) {
      console.error('❌ Method 3 failed:', error3);
    } else {
      console.log('✅ Method 3 successful, count:', count);
    }
    
    return !error1 && !error2 && !error3;
  } catch (err) {
    console.error('❌ Alternative methods error:', err);
    return false;
  }
}

async function testHeadersAndConfiguration() {
  console.log('🔍 Testing headers and configuration...');
  
  try {
    // Test with explicit headers
    const { data, error } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Headers test failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    console.log('✅ Headers test successful');
    return true;
  } catch (err) {
    console.error('❌ Headers test error:', err);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting 406 Error Diagnostic Tests...\n');
  
  const results = {
    basicConnection: false,
    specificSaleQuery: false,
    alternativeMethods: false,
    headersConfig: false
  };
  
  // Run all tests
  results.basicConnection = await testBasicConnection();
  console.log('');
  
  results.specificSaleQuery = await testSpecificSaleQuery();
  console.log('');
  
  results.alternativeMethods = await testAlternativeQueryMethods();
  console.log('');
  
  results.headersConfig = await testHeadersAndConfiguration();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('Basic Connection:', results.basicConnection ? '✅' : '❌');
  console.log('Specific Sale Query:', results.specificSaleQuery ? '✅' : '❌');
  console.log('Alternative Methods:', results.alternativeMethods ? '✅' : '❌');
  console.log('Headers Config:', results.headersConfig ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Result:', allPassed ? '✅ All tests passed' : '❌ Some tests failed');
  
  if (!allPassed) {
    console.log('\n💡 Recommendations:');
    if (!results.basicConnection) {
      console.log('- Check Supabase URL and API key configuration');
    }
    if (!results.specificSaleQuery) {
      console.log('- Check RLS policies and table permissions');
    }
    if (!results.alternativeMethods) {
      console.log('- Try different query formats or column selections');
    }
    if (!results.headersConfig) {
      console.log('- Verify Supabase client configuration and headers');
    }
  }
  
  return results;
}

// Export for use in other modules
export { runAllTests, testBasicConnection, testSpecificSaleQuery };

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  runAllTests();
} else if (typeof module !== 'undefined' && require.main === module) {
  // Node.js environment
  runAllTests();
}
