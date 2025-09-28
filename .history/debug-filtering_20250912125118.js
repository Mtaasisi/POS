#!/usr/bin/env node

// Debug script to test the filtering logic
// This will help identify if the filtering is causing products to be filtered out

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

async function debugFiltering() {
  console.log('🔍 Debugging filtering logic...\n');

  try {
    // Get products and categories
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        description,
        category_id,
        is_active,
        lats_categories(id, name),
        lats_product_variants(
          id,
          quantity,
          cost_price,
          selling_price
        )
      `)
      .limit(10);
    
    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      return;
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('id, name')
      .limit(10);
    
    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError);
      return;
    }

    console.log('📊 Raw data:');
    console.log('  - Products:', products?.length || 0);
    console.log('  - Categories:', categories?.length || 0);
    console.log('');

    // Test filtering logic
    console.log('🔍 Testing filtering logic...\n');

    // Test 1: No filters (should return all products)
    console.log('1. No filters (default state):');
    let filtered = products || [];
    console.log(`   Result: ${filtered.length} products`);
    console.log('');

    // Test 2: Search filter with empty query
    console.log('2. Search filter with empty query:');
    const searchQuery = '';
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.lats_product_variants?.some(variant => 
          variant.sku?.toLowerCase().includes(query)
        ) ||
        product.lats_categories?.name.toLowerCase().includes(query)
      );
    }
    console.log(`   Result: ${filtered.length} products`);
    console.log('');

    // Test 3: Category filter with 'all'
    console.log('3. Category filter with "all":');
    const selectedCategory = 'all';
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        categories.find(c => c.id === product.category_id)?.name === selectedCategory
      );
    }
    console.log(`   Result: ${filtered.length} products`);
    console.log('');

    // Test 4: Status filter with 'all'
    console.log('4. Status filter with "all":');
    const selectedStatus = 'all';
    if (selectedStatus === 'in-stock') {
      filtered = filtered.filter(product => {
        const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
        return stock > 10;
      });
    } else if (selectedStatus === 'low-stock') {
      filtered = filtered.filter(product => {
        const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
        return stock > 0 && stock <= 10;
      });
    } else if (selectedStatus === 'out-of-stock') {
      filtered = filtered.filter(product => {
        const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
        return stock <= 0;
      });
    }
    console.log(`   Result: ${filtered.length} products`);
    console.log('');

    // Test 5: Check product structure
    console.log('5. Product structure analysis:');
    if (products && products.length > 0) {
      const sampleProduct = products[0];
      console.log('   Sample product structure:');
      console.log('     - ID:', sampleProduct.id);
      console.log('     - Name:', sampleProduct.name);
      console.log('     - Category ID:', sampleProduct.category_id);
      console.log('     - Category Name:', sampleProduct.lats_categories?.name || 'No category');
      console.log('     - Is Active:', sampleProduct.is_active);
      console.log('     - Variants:', sampleProduct.lats_product_variants?.length || 0);
      console.log('     - Total Stock:', sampleProduct.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0);
    }
    console.log('');

    // Test 6: Check for products with stock
    console.log('6. Products with stock analysis:');
    const productsWithStock = products?.filter(product => {
      const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return stock > 0;
    }) || [];
    console.log(`   Products with stock > 0: ${productsWithStock.length}`);
    
    const productsWithStock10 = products?.filter(product => {
      const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return stock > 10;
    }) || [];
    console.log(`   Products with stock > 10: ${productsWithStock10.length}`);
    
    const productsOutOfStock = products?.filter(product => {
      const stock = product.lats_product_variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      return stock <= 0;
    }) || [];
    console.log(`   Products out of stock: ${productsOutOfStock.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugFiltering().then(() => {
  console.log('\n🏁 Filtering debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
