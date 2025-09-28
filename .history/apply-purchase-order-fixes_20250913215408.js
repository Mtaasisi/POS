#!/usr/bin/env node

/**
 * Apply purchase order database fixes
 * This script applies the necessary migrations to fix purchase order errors
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  try {
    console.log(`📄 Applying migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error(`❌ Error applying ${migrationFile}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully applied ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Error reading/executing ${migrationFile}:`, error);
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

async function checkTablesExist() {
  try {
    console.log('🔍 Checking if required tables exist...');
    
    const tables = [
      'lats_purchase_orders',
      'lats_purchase_order_items',
      'purchase_order_payments',
      'purchase_order_messages',
      'purchase_order_audit',
      'purchase_order_quality_checks'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table} does not exist or is not accessible`);
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

async function main() {
  console.log('🚀 Starting purchase order database fixes...\n');
  
  // Test connection first
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  console.log('');
  
  // Apply migrations in order
  const migrations = [
    '20250131000045_create_update_updated_at_function.sql',
    '20250131000042_create_purchase_order_audit_table.sql',
    '20250131000043_create_purchase_order_quality_checks_table.sql',
    '20250131000044_fix_purchase_order_items_rls.sql'
  ];
  
  let allSuccessful = true;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      allSuccessful = false;
      console.error(`❌ Failed to apply ${migration}`);
    }
    console.log('');
  }
  
  if (allSuccessful) {
    console.log('✅ All migrations applied successfully!');
  } else {
    console.log('⚠️ Some migrations failed. Please check the errors above.');
  }
  
  console.log('');
  
  // Check tables
  await checkTablesExist();
  
  console.log('\n🎉 Purchase order database fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the purchase order functionality in your application');
  console.log('2. Check if the 400/404 errors are resolved');
  console.log('3. Verify that partial receive functionality works correctly');
}

main().catch(console.error);
