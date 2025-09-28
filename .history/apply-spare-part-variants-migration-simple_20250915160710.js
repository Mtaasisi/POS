#!/usr/bin/env node

/**
 * Apply Spare Part Variants Migration (Simplified Version)
 * 
 * This script creates the lats_spare_part_variants table and related structures
 * to support variants for spare parts, similar to product variants.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting Spare Part Variants Migration (Simplified)...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'create-spare-part-variants-table-simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`⚡ Executing ${statements.length} SQL statements...`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error(`   Statement: ${statement}`);
          throw error;
        }
      } catch (error) {
        // Some statements might fail if they already exist, which is okay
        if (error.message && (
          error.message.includes('already exists') || 
          error.message.includes('does not exist') ||
          error.message.includes('duplicate key')
        )) {
          console.log(`   ⚠️  Statement ${i + 1} skipped (already exists or not applicable)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration executed successfully');
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_part_variants');
    
    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
      throw tableError;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Table lats_spare_part_variants created successfully');
    } else {
      console.error('❌ Table lats_spare_part_variants was not created');
      throw new Error('Table creation verification failed');
    }
    
    // Test inserting a sample variant
    console.log('🧪 Testing table functionality...');
    const { data: testData, error: testError } = await supabase
      .from('lats_spare_part_variants')
      .insert({
        name: 'Test Variant',
        sku: 'TEST-001',
        variant_attributes: { test: true }
      })
      .select();
    
    if (testError) {
      console.error('❌ Error testing table:', testError);
      throw testError;
    }
    
    console.log('✅ Table functionality test passed');
    
    // Clean up test data
    await supabase
      .from('lats_spare_part_variants')
      .delete()
      .eq('sku', 'TEST-001');
    
    console.log('🎉 Spare Part Variants Migration completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • lats_spare_part_variants table');
    console.log('   • Indexes for performance');
    console.log('   • RLS policies for security');
    console.log('   • Triggers for updated_at timestamps');
    console.log('   • Metadata column in lats_spare_parts table');
    console.log('   • Image support for variants');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the variants functionality in your app');
    console.log('   2. Create some spare parts with variants');
    console.log('   3. Verify the API endpoints work correctly');
    
  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
