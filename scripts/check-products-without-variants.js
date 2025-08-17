#!/usr/bin/env node

/**
 * Script to check for products that have no variants
 * This helps identify data integrity issues in the inventory
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsWithoutVariants() {
  console.log('🔍 Checking for products without variants...\n');

  try {
    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, category_id, brand_id, is_active')
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`📦 Found ${products.length} active products`);

    // Get all product IDs that have variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('product_id')
      .order('product_id');

    if (variantsError) {
      console.error('❌ Error fetching variants:', variantsError);
      return;
    }

    // Create a set of product IDs that have variants
    const productIdsWithVariants = new Set(variants.map(v => v.product_id));
    
    // Find products without variants
    const productsWithoutVariants = products.filter(product => 
      !productIdsWithVariants.has(product.id)
    );

    console.log(`\n📊 Analysis Results:`);
    console.log(`   • Total active products: ${products.length}`);
    console.log(`   • Products with variants: ${productIdsWithVariants.size}`);
    console.log(`   • Products without variants: ${productsWithoutVariants.length}`);
    console.log(`   • Data integrity: ${productsWithoutVariants.length === 0 ? '✅ Perfect' : '⚠️ Issues found'}`);

    if (productsWithoutVariants.length > 0) {
      console.log('\n⚠️ Products without variants:');
      console.log('   These products cannot be added to cart and need attention:');
      console.log('   ┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('   │ ID                                     │ Name                                │');
      console.log('   ├─────────────────────────────────────────────────────────────────────────────┤');
      
      productsWithoutVariants.forEach(product => {
        const id = product.id.substring(0, 8) + '...';
        const name = product.name.padEnd(32).substring(0, 32);
        console.log(`   │ ${id} │ ${name} │`);
      });
      
      console.log('   └─────────────────────────────────────────────────────────────────────────────┘');

      console.log('\n🔧 How to fix:');
      console.log('   1. Go to Inventory Management in the LATS dashboard');
      console.log('   2. Find each product listed above');
      console.log('   3. Add at least one variant with:');
      console.log('      - Name (e.g., "Default", "Standard", "Regular")');
      console.log('      - SKU (unique identifier)');
      console.log('      - Selling price');
      console.log('      - Cost price');
      console.log('      - Quantity (stock level)');
      console.log('   4. Save the product');

      console.log('\n💡 Quick fix options:');
      console.log('   • Run the add-sample-variants script to add default variants');
      console.log('   • Use the bulk variant creation feature in the UI');
      console.log('   • Delete products that are no longer needed');

      // Offer to create default variants
      console.log('\n🤖 Would you like to automatically create default variants for these products?');
      console.log('   This will add a "Default" variant with 0 stock and $0 price for each product.');
      console.log('   Run: node scripts/add-default-variants.js');
    } else {
      console.log('\n✅ All products have variants! No action needed.');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkProductsWithoutVariants()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
