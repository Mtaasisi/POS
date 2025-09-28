// Test script to verify database fixes are working
// Run this with: node test-database-fix.js

import { createClient } from '@supabase/supabase-js';

// Configuration - update these with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');
  
  try {
    // Test 1: Basic connection
    console.log('\n📊 Test 1: Basic Connection');
    const { data: healthData, error: healthError } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Basic connection failed:', healthError);
      return false;
    }
    console.log('✅ Basic connection successful');
    
    // Test 2: Count existing sales
    console.log('\n📊 Test 2: Count Existing Sales');
    const { count, error: countError } = await supabase
      .from('lats_sales')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
      return false;
    }
    console.log(`✅ Found ${count} existing sales`);
    
    // Test 3: Create test sale
    console.log('\n📊 Test 3: Create Test Sale');
    const testSaleData = {
      sale_number: 'MCP-TEST-' + Date.now(),
      total_amount: 1000,
      payment_method: 'cash',
      status: 'completed',
      customer_name: 'MCP Test Customer',
      customer_phone: '+255123456789',
      created_by: 'mcp-test-user'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('lats_sales')
      .insert(testSaleData)
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return false;
    }
    console.log('✅ Test sale created successfully:', insertData[0].id);
    
    // Test 4: Read the test sale
    console.log('\n📊 Test 4: Read Test Sale');
    const { data: readData, error: readError } = await supabase
      .from('lats_sales')
      .select('*')
      .eq('id', insertData[0].id);
    
    if (readError) {
      console.error('❌ Read test failed:', readError);
      return false;
    }
    console.log('✅ Test sale read successfully');
    
    // Test 5: Update the test sale
    console.log('\n📊 Test 5: Update Test Sale');
    const { data: updateData, error: updateError } = await supabase
      .from('lats_sales')
      .update({ total_amount: 1500, status: 'updated' })
      .eq('id', insertData[0].id)
      .select();
    
    if (updateError) {
      console.error('❌ Update test failed:', updateError);
      return false;
    }
    console.log('✅ Test sale updated successfully');
    
    // Test 6: Delete the test sale
    console.log('\n📊 Test 6: Delete Test Sale');
    const { error: deleteError } = await supabase
      .from('lats_sales')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.error('❌ Delete test failed:', deleteError);
      return false;
    }
    console.log('✅ Test sale deleted successfully');
    
    console.log('\n🎉 All tests passed! Database fixes are working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

async function testSaleItems() {
  console.log('\n🔍 Testing lats_sale_items table...');
  
  try {
    const { data, error } = await supabase
      .from('lats_sale_items')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Sale items test failed:', error);
      return false;
    }
    console.log('✅ Sale items table accessible');
    return true;
  } catch (error) {
    console.error('❌ Sale items test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting MCP Database Fix Tests...\n');
  
  const connectionTest = await testDatabaseConnection();
  const saleItemsTest = await testSaleItems();
  
  console.log('\n📋 Test Results Summary:');
  console.log(`Database Connection: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sale Items Access: ${saleItemsTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectionTest && saleItemsTest) {
    console.log('\n🎉 All tests passed! Your database is working correctly.');
    console.log('✅ Authentication issues resolved');
    console.log('✅ Permission issues resolved');
    console.log('✅ CRUD operations working');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    console.log('💡 Make sure you have applied the database fix SQL script.');
  }
}

// Run the tests
runAllTests().catch(console.error);
