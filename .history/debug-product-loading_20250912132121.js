// Debug script to check product loading issues
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductLoading() {
  console.log('🔍 Debugging product loading issues...\n');

  try {
    // 1. Check if the specific product exists
    const specificProductId = '65b6d2e0-9300-42d6-b8d5-8b5bbed759c1';
    console.log(`1. Checking if product ${specificProductId} exists...`);
    
    const { data: specificProduct, error: specificError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', specificProductId)
      .single();

    if (specificError) {
      console.log(`❌ Product ${specificProductId} not found:`, specificError.message);
    } else {
      console.log(`✅ Product ${specificProductId} found:`, specificProduct.name);
    }

    // 2. Check total products count
    console.log('\n2. Checking total products count...');
    const { count: totalProducts, error: countError } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error counting products:', countError.message);
    } else {
      console.log(`✅ Total products in database: ${totalProducts}`);
    }

    // 3. Get first 5 products to see if any exist
    console.log('\n3. Checking first 5 products...');
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('lats_products')
      .select('id, name, sku, created_at')
      .limit(5)
      .order('created_at', { ascending: false });

    if (sampleError) {
      console.log('❌ Error fetching sample products:', sampleError.message);
    } else {
      console.log(`✅ Sample products (${sampleProducts.length}):`);
      sampleProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.id})`);
      });
    }

    // 4. Check categories
    console.log('\n4. Checking categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('id, name')
      .limit(5);

    if (categoriesError) {
      console.log('❌ Error fetching categories:', categoriesError.message);
    } else {
      console.log(`✅ Categories (${categories.length}):`);
      categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.id})`);
      });
    }

    // 5. Check suppliers
    console.log('\n5. Checking suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('id, name')
      .limit(5);

    if (suppliersError) {
      console.log('❌ Error fetching suppliers:', suppliersError.message);
    } else {
      console.log(`✅ Suppliers (${suppliers.length}):`);
      suppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.name} (${supplier.id})`);
      });
    }

    // 6. Check stock movements table
    console.log('\n6. Checking stock movements table...');
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('id, product_id, type, quantity')
      .limit(5);

    if (stockError) {
      console.log('❌ Error fetching stock movements:', stockError.message);
    } else {
      console.log(`✅ Stock movements (${stockMovements.length}):`);
      stockMovements.forEach((movement, index) => {
        console.log(`   ${index + 1}. Product ${movement.product_id} - ${movement.type} ${movement.quantity}`);
      });
    }

    // 7. Check product variants
    console.log('\n7. Checking product variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, name, quantity')
      .limit(5);

    if (variantsError) {
      console.log('❌ Error fetching variants:', variantsError.message);
    } else {
      console.log(`✅ Product variants (${variants.length}):`);
      variants.forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.name} (Product: ${variant.product_id}) - Qty: ${variant.quantity}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugProductLoading().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
