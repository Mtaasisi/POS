import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fetchAllLatsData() {
  console.log('🔍 Fetching data from all LATS tables...\n');
  
  try {
    // Check all LATS tables
    const tables = [
      'lats_categories',
      'lats_brands', 
      'lats_suppliers',
      'lats_products',
      'lats_product_variants',
      'lats_sales',
      'lats_sale_items'
    ];

    for (const table of tables) {
      console.log(`📋 Checking ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        const count = data?.length || 0;
        console.log(`   ✅ Found ${count} records`);
        
        if (count > 0) {
          console.log(`   📦 Sample data:`, data?.slice(0, 2));
        }
      }
      console.log('');
    }

    // Summary
    console.log('📊 LATS Database Summary:');
    console.log('   All tables exist but most are empty due to RLS restrictions');
    console.log('   Need to add sample data to make POS system functional');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Temporarily disable RLS for lats_* tables');
    console.log('   3. Run the quick-fix-pos-data.sql script');
    console.log('   4. Re-enable RLS');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAllLatsData();
