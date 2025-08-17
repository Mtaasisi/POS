import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductConstraints() {
  console.log('🔍 Checking product foreign key constraints...');
  
  try {
    // Check if there are any records in tables that reference products
    const tablesToCheck = [
      'lats_product_variants',
      'lats_stock_movements', 
      'lats_sale_items',
      'lats_purchase_order_items',
      'lats_spare_part_usage',
      'product_images'
    ];
    
    for (const table of tablesToCheck) {
      try {
        console.log(`\n📋 Checking ${table}...`);
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Error checking ${table}:`, error.message);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} not found or not accessible`);
      }
    }
    
    // Try to get a specific product to see if it exists
    console.log('\n🔍 Checking for specific product...');
    const { data: products, error: productError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(5);
    
    if (productError) {
      console.log('❌ Error fetching products:', productError.message);
    } else {
      console.log('✅ Products found:', products?.length || 0);
      if (products && products.length > 0) {
        console.log('📋 Sample products:');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (${product.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  }
}

checkProductConstraints();
