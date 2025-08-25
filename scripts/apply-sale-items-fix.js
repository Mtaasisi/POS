#!/usr/bin/env node

/**
 * Script to apply the foreign key constraint fix for lats_sale_items table
 * This fixes the 400 Bad Request errors when querying sales with items
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySaleItemsFix() {
  console.log('🔧 Applying foreign key constraint fix for lats_sale_items table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241225000003_fix_sale_items_foreign_keys.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Migration file loaded successfully');

    // Apply the migration
    console.log('🚀 Applying migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('lats_sale_items')
        .select('*')
        .limit(1);
      
      if (altError) {
        console.error('❌ Alternative approach also failed:', altError);
        console.log('\n💡 Manual steps required:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Open SQL Editor');
        console.log('3. Copy and paste the contents of: supabase/migrations/20241225000003_fix_sale_items_foreign_keys.sql');
        console.log('4. Click "Run" to execute the migration');
        console.log('5. Refresh your application');
        process.exit(1);
      }
    } else {
      console.log('✅ Migration applied successfully');
    }

    // Test the fix
    console.log('\n🧪 Testing the fix...');
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .limit(1);

    if (testError) {
      console.error('❌ Test query still failing:', testError);
      console.log('\n💡 The foreign key constraints may need to be applied manually.');
      console.log('Please run the migration manually in your Supabase Dashboard.');
    } else {
      console.log('✅ Test query successful!');
      console.log(`📊 Found ${testData?.length || 0} sales with proper relationships`);
      
      if (testData && testData.length > 0) {
        const sale = testData[0];
        console.log(`   - Sale ID: ${sale.id}`);
        console.log(`   - Sale Items: ${sale.lats_sale_items?.length || 0} items`);
        
        if (sale.lats_sale_items && sale.lats_sale_items.length > 0) {
          const item = sale.lats_sale_items[0];
          console.log(`   - First item has product: ${!!item.lats_products}`);
          console.log(`   - First item has variant: ${!!item.lats_product_variants}`);
        }
      }
    }

    console.log('\n🎉 Foreign key constraint fix completed!');
    console.log('✅ The 400 Bad Request errors should now be resolved.');

  } catch (error) {
    console.error('❌ Script failed:', error);
    console.log('\n💡 Manual steps required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/20241225000003_fix_sale_items_foreign_keys.sql');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. Refresh your application');
  }
}

// Run the fix
applySaleItemsFix().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
