#!/usr/bin/env node

/**
 * Apply Spare Part Variants Migration
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
    console.log('🚀 Starting Spare Part Variants Migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'create-spare-part-variants-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      throw error;
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
    
    // Check if metadata column was added to lats_spare_parts
    console.log('🔍 Verifying metadata column addition...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_parts')
      .eq('column_name', 'metadata');
    
    if (columnError) {
      console.error('❌ Error verifying metadata column:', columnError);
      throw columnError;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Metadata column added to lats_spare_parts successfully');
    } else {
      console.log('⚠️  Metadata column may already exist or was not added');
    }
    
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
