const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241226000001_simple_fix_lats_products.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }

    console.log('✅ Migration completed successfully');

    // Test the table structure
    console.log('🧪 Testing table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'lats_products')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Failed to get table structure:', columnsError);
      return false;
    }

    console.log('📊 Current lats_products table structure:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test a simple query
    console.log('🧪 Testing simple query...');
    
    const { data: testData, error: testError } = await supabase
      .from('lats_products')
      .select('id, name, description, category_id, brand_id, supplier_id, images, is_active, total_quantity, total_value, condition, store_shelf, internal_notes, created_at, updated_at')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      return false;
    }

    console.log('✅ Test query successful');
    console.log('📋 Sample data:', testData);

    return true;

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database schema fix...');
  
  const success = await fixDatabaseSchema();
  
  if (success) {
    console.log('✅ Database schema fix completed successfully!');
    console.log('🔄 The 400 Bad Request errors should now be resolved.');
  } else {
    console.log('❌ Database schema fix failed.');
    process.exit(1);
  }
}

main();
