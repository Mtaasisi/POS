// Database Connection Test Script
import { supabase, testSupabaseConnection, checkConnectionHealth } from './src/lib/supabaseClient.ts';

async function runDatabaseTests() {
  console.log('🔍 Starting Database Connection Tests...\n');

  // Test 1: Basic Connection Test
  console.log('📡 Test 1: Basic Connection Test');
  const connectionTest = await testSupabaseConnection();
  console.log('Result:', connectionTest);
  console.log('');

  // Test 2: Health Check
  console.log('🏥 Test 2: Connection Health Check');
  const healthCheck = await checkConnectionHealth();
  console.log('Health Status:', healthCheck);
  console.log('');

  // Test 3: Test Spare Parts Table
  console.log('🔧 Test 3: Spare Parts Table Access');
  try {
    const { data, error, count } = await supabase
      .from('lats_spare_parts')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing spare parts table:', error);
    } else {
      console.log('✅ Spare parts table accessible');
      console.log(`📊 Total spare parts: ${count}`);
      console.log('📋 Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Exception accessing spare parts table:', err);
  }
  console.log('');

  // Test 4: Test Categories Table
  console.log('📂 Test 4: Categories Table Access');
  try {
    const { data, error, count } = await supabase
      .from('lats_categories')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing categories table:', error);
    } else {
      console.log('✅ Categories table accessible');
      console.log(`📊 Total categories: ${count}`);
      console.log('📋 Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Exception accessing categories table:', err);
  }
  console.log('');

  // Test 5: Test Suppliers Table
  console.log('🏢 Test 5: Suppliers Table Access');
  try {
    const { data, error, count } = await supabase
      .from('lats_suppliers')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing suppliers table:', error);
    } else {
      console.log('✅ Suppliers table accessible');
      console.log(`📊 Total suppliers: ${count}`);
      console.log('📋 Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Exception accessing suppliers table:', err);
  }
  console.log('');

  // Test 6: Test Auth Status
  console.log('🔐 Test 6: Authentication Status');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
    } else {
      console.log('✅ Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in');
    }
  } catch (err) {
    console.error('❌ Auth exception:', err);
  }
  console.log('');

  console.log('🏁 Database Connection Tests Complete!');
}

// Run the tests
runDatabaseTests().catch(console.error);
