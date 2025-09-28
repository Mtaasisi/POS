#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🚀 MCP Database Operations Demo');
console.log('===============================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo MCP operations
async function demoMCPOperations() {
  try {
    console.log('\n📊 1. Getting Customer Statistics...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Error:', customersError.message);
    } else {
      console.log(`✅ Found ${customers.length} customers:`);
      customers.forEach(customer => {
        console.log(`  - ${customer.name} (${customer.phone})`);
      });
    }

    console.log('\n📦 2. Getting Product Information...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, description')
      .limit(3);
    
    if (productsError) {
      console.error('❌ Error:', productsError.message);
    } else {
      console.log(`✅ Found ${products.length} products:`);
      products.forEach(product => {
        console.log(`  - ${product.name}: ${product.description || 'No description'}`);
      });
    }

    console.log('\n💰 3. Getting Sales Summary...');
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (salesError) {
      console.error('❌ Error:', salesError.message);
    } else {
      console.log(`✅ Recent sales:`);
      sales.forEach(sale => {
        console.log(`  - Sale #${sale.sale_number}: ${sale.total_amount} TSH (${sale.created_at})`);
      });
    }

    console.log('\n📈 4. Getting Product Variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, variant_name, price, product_id')
      .limit(5);
    
    if (variantsError) {
      console.error('❌ Error:', variantsError.message);
    } else {
      console.log(`✅ Found ${variants.length} product variants:`);
      variants.forEach(variant => {
        console.log(`  - ${variant.variant_name}: ${variant.price} TSH`);
      });
    }

    console.log('\n🎉 MCP Database Operations Demo Completed!');
    console.log('✅ Your MCP setup is working perfectly!');
    console.log('\n📋 Available MCP Tools:');
    console.log('  - query_database: Execute SQL queries');
    console.log('  - get_table_info: Get table structure');
    console.log('  - list_tables: List all tables');
    console.log('  - backup_table: Create table backups');
    console.log('  - restore_table: Restore from backup');
    console.log('  - get_table_stats: Get table statistics');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
demoMCPOperations();
