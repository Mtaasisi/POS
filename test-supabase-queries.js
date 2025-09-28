// TEST SUPABASE QUERIES - JavaScript Test File
// This file contains test functions to verify the fixed queries work

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your actual URL and key)
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Basic lats_sales query (should work)
export const testBasicSalesQuery = async () => {
  console.log('🧪 Testing basic lats_sales query...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Basic sales query failed:', error);
      return false;
    }
    
    console.log('✅ Basic sales query successful:', data.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Basic sales query error:', error);
    return false;
  }
};

// Test 2: Sales with customers (should work)
export const testSalesWithCustomers = async () => {
  console.log('🧪 Testing sales with customers...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Sales with customers query failed:', error);
      return false;
    }
    
    console.log('✅ Sales with customers query successful:', data.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Sales with customers query error:', error);
    return false;
  }
};

// Test 3: Sales with sale items (should work)
export const testSalesWithItems = async () => {
  console.log('🧪 Testing sales with sale items...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Sales with items query failed:', error);
      return false;
    }
    
    console.log('✅ Sales with items query successful:', data.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Sales with items query error:', error);
    return false;
  }
};

// Test 4: Sales with products (should work)
export const testSalesWithProducts = async () => {
  console.log('🧪 Testing sales with products...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Sales with products query failed:', error);
      return false;
    }
    
    console.log('✅ Sales with products query successful:', data.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Sales with products query error:', error);
    return false;
  }
};

// Test 5: Sales with variants (should work)
export const testSalesWithVariants = async () => {
  console.log('🧪 Testing sales with variants...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Sales with variants query failed:', error);
      return false;
    }
    
    console.log('✅ Sales with variants query successful:', data.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Sales with variants query error:', error);
    return false;
  }
};

// Test 6: The problematic original query (should fail)
export const testOriginalProblematicQuery = async () => {
  console.log('🧪 Testing original problematic query (should fail)...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name),
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Original query failed as expected:', error.message);
      return false;
    }
    
    console.log('✅ Original query unexpectedly succeeded:', data.length, 'sales');
    return true;
  } catch (error) {
    console.log('❌ Original query failed as expected:', error.message);
    return false;
  }
};

// Test 7: Recommended working query
export const testRecommendedQuery = async () => {
  console.log('🧪 Testing recommended working query...');
  
  try {
    // Step 1: Get sales with customer info
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (salesError) {
      console.error('❌ Sales query failed:', salesError);
      return false;
    }
    
    // Step 2: Get sale items for these sales
    const saleIds = sales.map(sale => sale.id);
    
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_products(name, description),
        lats_product_variants(name, sku, attributes)
      `)
      .in('sale_id', saleIds);
    
    if (itemsError) {
      console.error('❌ Sale items query failed:', itemsError);
      return false;
    }
    
    // Step 3: Combine the data
    const salesWithItems = sales.map(sale => ({
      ...sale,
      sale_items: saleItems.filter(item => item.sale_id === sale.id)
    }));
    
    console.log('✅ Recommended query successful:', salesWithItems.length, 'sales');
    return true;
  } catch (error) {
    console.error('❌ Recommended query error:', error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running all Supabase query tests...\n');
  
  const tests = [
    { name: 'Basic Sales Query', fn: testBasicSalesQuery },
    { name: 'Sales with Customers', fn: testSalesWithCustomers },
    { name: 'Sales with Items', fn: testSalesWithItems },
    { name: 'Sales with Products', fn: testSalesWithProducts },
    { name: 'Sales with Variants', fn: testSalesWithVariants },
    { name: 'Original Problematic Query', fn: testOriginalProblematicQuery },
    { name: 'Recommended Working Query', fn: testRecommendedQuery }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  console.log('\n📊 Test Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your queries should work without 400 errors.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
  
  return results;
};

// Quick test function
export const quickTest = async () => {
  console.log('⚡ Running quick test...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Quick test failed:', error);
      return false;
    }
    
    console.log('✅ Quick test passed - Supabase connection is working');
    return true;
  } catch (error) {
    console.error('❌ Quick test error:', error);
    return false;
  }
};

// Export for use in your application
export default {
  testBasicSalesQuery,
  testSalesWithCustomers,
  testSalesWithItems,
  testSalesWithProducts,
  testSalesWithVariants,
  testOriginalProblematicQuery,
  testRecommendedQuery,
  runAllTests,
  quickTest
};
