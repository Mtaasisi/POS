import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fetchLatsProducts() {
  console.log('🔍 Fetching data from lats_products table...\n');
  
  try {
    // Fetch all products with related data
    const { data: products, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_brands(name),
        lats_suppliers(name),
        lats_product_variants(*)
      `)
      .order('name');

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('📭 No products found in lats_products table');
      console.log('\n📋 To add sample products, run:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Temporarily disable RLS for lats_* tables');
      console.log('3. Run the quick-fix-pos-data.sql script');
      console.log('4. Re-enable RLS');
      return;
    }

    console.log(`✅ Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Description: ${product.description || 'N/A'}`);
      console.log(`   Category: ${product.lats_categories?.name || 'N/A'}`);
      console.log(`   Brand: ${product.lats_brands?.name || 'N/A'}`);
      console.log(`   Supplier: ${product.lats_suppliers?.name || 'N/A'}`);
      console.log(`   Quantity: ${product.total_quantity || 0}`);
      console.log(`   Value: $${product.total_value || 0}`);
      console.log(`   Active: ${product.is_active ? 'Yes' : 'No'}`);
      console.log(`   Variants: ${product.lats_product_variants?.length || 0}`);
      
      if (product.lats_product_variants && product.lats_product_variants.length > 0) {
        console.log('   Variant Details:');
        product.lats_product_variants.forEach(variant => {
          console.log(`     - ${variant.sku}: ${variant.name} ($${variant.selling_price})`);
        });
      }
      console.log('');
    });

    // Summary statistics
    const activeProducts = products.filter(p => p.is_active);
    const totalValue = products.reduce((sum, p) => sum + (p.total_value || 0), 0);
    const totalQuantity = products.reduce((sum, p) => sum + (p.total_quantity || 0), 0);
    const totalVariants = products.reduce((sum, p) => sum + (p.lats_product_variants?.length || 0), 0);

    console.log('📊 Summary:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Active Products: ${activeProducts.length}`);
    console.log(`   Total Variants: ${totalVariants}`);
    console.log(`   Total Quantity: ${totalQuantity}`);
    console.log(`   Total Value: $${totalValue.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchLatsProducts();
