#!/usr/bin/env node

/**
 * Script to add default variants for products that have no variants
 * This fixes data integrity issues in the inventory
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

async function addDefaultVariants() {
  console.log('🔧 Adding default variants for products without variants...\n');

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

    console.log(`📊 Found ${productsWithoutVariants.length} products without variants`);

    if (productsWithoutVariants.length === 0) {
      console.log('✅ All products already have variants! No action needed.');
      return;
    }

    // Ask for confirmation
    console.log('\n⚠️ This will add default variants for the following products:');
    productsWithoutVariants.forEach(product => {
      console.log(`   • ${product.name}`);
    });

    console.log('\n📝 Default variant settings:');
    console.log('   • Name: "Default"');
    console.log('   • SKU: Product ID + "-DEFAULT"');
    console.log('   • Selling Price: $0.00');
    console.log('   • Cost Price: $0.00');
    console.log('   • Quantity: 0 (out of stock)');
    console.log('   • Barcode: null');

    // In a real implementation, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    console.log('\n🔄 Adding default variants...');

    let successCount = 0;
    let errorCount = 0;

    for (const product of productsWithoutVariants) {
      try {
        const defaultVariant = {
          product_id: product.id,
          name: 'Default',
          sku: `${product.id}-DEFAULT`,
          selling_price: 0,
          cost_price: 0,
          quantity: 0,
          min_quantity: 0,
          barcode: null,
          weight: null,
          dimensions: null,
          attributes: {}
        };

        const { data: newVariant, error: insertError } = await supabase
          .from('lats_product_variants')
          .insert([defaultVariant])
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Failed to add variant for "${product.name}":`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Added default variant for "${product.name}" (ID: ${newVariant.id})`);
          successCount++;
        }

        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Results:');
    console.log(`   • Successfully added variants: ${successCount}`);
    console.log(`   • Failed to add variants: ${errorCount}`);
    console.log(`   • Total processed: ${productsWithoutVariants.length}`);

    if (successCount > 0) {
      console.log('\n✅ Default variants added successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Go to Inventory Management in the LATS dashboard');
      console.log('   2. Update the default variants with proper prices and stock levels');
      console.log('   3. Add additional variants as needed');
      console.log('   4. Test adding products to cart in the POS system');
    }

    if (errorCount > 0) {
      console.log('\n⚠️ Some variants could not be added. Check the error messages above.');
      console.log('   You may need to manually add variants for those products.');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
addDefaultVariants()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
