import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file for:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');

  try {
    // Check LATS tables
    const latsTables = [
      'lats_categories',
      'lats_brands', 
      'lats_suppliers',
      'lats_products',
      'lats_product_variants',
      'lats_stock_movements'
    ];

    console.log('📊 LATS Tables Status:');
    for (const table of latsTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }



  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

checkDatabaseStatus();
