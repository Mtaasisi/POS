import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyLatsForeignKeyFix() {
  console.log('🔧 Applying LATS foreign key constraints fix...');
  console.log('📋 This will fix the 400 Bad Request errors when querying LATS sales data\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000003_fix_lats_foreign_keys.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded successfully');

    // Execute the migration
    console.log('\n🚀 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n💡 Alternative: Please run the SQL manually in your Supabase Dashboard');
      console.log('📄 Copy the contents of: supabase/migrations/20241201000003_fix_lats_foreign_keys.sql');
      return;
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Results:', data);

    // Test the fix
    console.log('\n🧪 Testing the fix...');
    await testLatsFix();

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.log('\n💡 Please run the SQL manually in your Supabase Dashboard');
    console.log('📄 Copy the contents of: supabase/migrations/20241201000003_fix_lats_foreign_keys.sql');
  }
}

async function testLatsFix() {
  try {
    // Test the exact query that was causing 400 errors
    console.log('🔍 Testing the query that was causing 400 errors...');
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, brand, model, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (salesError) {
      console.log(`❌ Query still failing: ${salesError.message}`);
      console.log('💡 The foreign key constraints may not have been applied correctly');
      return;
    }
    
    console.log(`✅ Query successful! Found ${salesData?.length || 0} sales records`);
    
    if (salesData && salesData.length > 0) {
      console.log('📊 Sample data structure:');
      console.log(JSON.stringify(salesData[0], null, 2));
    }

    console.log('\n🎉 LATS 400 error fix test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the fix
applyLatsForeignKeyFix();
