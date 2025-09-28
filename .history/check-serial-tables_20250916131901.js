#!/usr/bin/env node

/**
 * Check Serial Number Tracking Tables
 * Verifies that all required tables for serial number management exist
 */

import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName, description) {
  console.log(`\n🔍 Checking ${description}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${description}: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ ${description}: Table exists and accessible`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

async function checkSerialNumberTables() {
  console.log('🚀 Serial Number Tracking Tables Check');
  console.log('=' .repeat(50));
  
  const tables = [
    { name: 'inventory_items', description: 'Inventory Items Table' },
    { name: 'serial_number_movements', description: 'Serial Number Movements Table' },
    { name: 'sale_inventory_items', description: 'Sale Inventory Items Table' },
    { name: 'lats_products', description: 'LATS Products Table' },
    { name: 'lats_product_variants', description: 'LATS Product Variants Table' },
    { name: 'lats_sales', description: 'LATS Sales Table' },
    { name: 'lats_customers', description: 'LATS Customers Table' }
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    const exists = await checkTable(table.name, table.description);
    if (!exists) {
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (allTablesExist) {
    console.log('✅ All serial number tracking tables are available');
    console.log('🔧 Serial Number Manager should work properly');
  } else {
    console.log('❌ Some tables are missing');
    console.log('⚠️  Serial Number Manager may not work properly');
    console.log('\n💡 To fix this:');
    console.log('   1. Run the serial number tracking migration:');
    console.log('      psql -f create-sale-inventory-items-table.sql');
    console.log('   2. Or apply the migration through Supabase dashboard');
  }
}

checkSerialNumberTables().catch(console.error);
