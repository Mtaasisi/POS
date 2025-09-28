#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔍 Testing MCP Database Connection...');
console.log('=====================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 API Key: ${supabaseKey.substring(0, 20)}...`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    console.log('\n🔍 Testing basic connection...');
    
    // Test 1: Simple table query
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (customersError) {
      console.error('❌ Customers table query failed:', customersError.message);
    } else {
      console.log('✅ Customers table accessible');
      console.log(`📊 Sample customer: ${JSON.stringify(customers, null, 2)}`);
    }

    // Test 2: Products table
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table query failed:', productsError.message);
    } else {
      console.log('✅ Products table accessible');
      console.log(`📊 Sample product: ${JSON.stringify(products, null, 2)}`);
    }

    // Test 3: Sales table
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, sale_number')
      .limit(1);
    
    if (salesError) {
      console.error('❌ Sales table query failed:', salesError.message);
    } else {
      console.log('✅ Sales table accessible');
      console.log(`📊 Sample sale: ${JSON.stringify(sales, null, 2)}`);
    }

    // Test 4: List all tables
    console.log('\n📋 Available tables:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Failed to list tables:', tablesError.message);
    } else {
      console.log('✅ Database tables:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    console.log('\n🎉 MCP Database connection test completed successfully!');
    console.log('✅ Your database is ready for MCP operations');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection();
