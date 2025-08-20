#!/usr/bin/env node

/**
 * Script to remove product fields from the database
 * This script runs the migration to remove:
 * - weight
 * - dimensions  
 * - tags
 * - is_featured
 * - is_digital
 * - requires_shipping
 * - tax_rate
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
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeProductFields() {
  console.log('🚀 Starting removal of product fields...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241204000000_remove_product_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');
    
    // Execute the migration
    console.log('🔄 Executing migration...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🗑️  Removed fields:');
    console.log('   - weight');
    console.log('   - dimensions');
    console.log('   - tags');
    console.log('   - is_featured');
    console.log('   - is_digital');
    console.log('   - requires_shipping');
    console.log('   - tax_rate');
    
    // Verify the columns are removed
    console.log('\n🔍 Verifying column removal...');
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'lats_products')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
    } else {
      const columnNames = columns.map(col => col.column_name);
      const removedFields = ['weight', 'dimensions', 'tags', 'is_featured', 'is_digital', 'requires_shipping', 'tax_rate'];
      
      const stillExist = removedFields.filter(field => columnNames.includes(field));
      
      if (stillExist.length > 0) {
        console.warn('⚠️  Some fields still exist:', stillExist);
      } else {
        console.log('✅ All specified fields have been successfully removed!');
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
removeProductFields()
  .then(() => {
    console.log('\n🎉 Product field removal completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
