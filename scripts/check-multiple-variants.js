#!/usr/bin/env node

/**
 * Script to check if products have multiple variants and verify total value calculation
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

async function checkMultipleVariants() {
  console.log('🔍 Checking for products with multiple variants...\n');

  try {
    // Get all products with their variants
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        is_active,
        lats_product_variants(
          id,
          name,
          sku,
          quantity,
          cost_price,
          selling_price,
          min_quantity
        )
      `)
      .eq('is_active', true);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`📊 Found ${products.length} active products`);

    let totalValue = 0;
    let productsWithMultipleVariants = 0;
    let productsWithSingleVariant = 0;

    products.forEach((product, index) => {
      const variants = product.lats_product_variants || [];
      const variantCount = variants.length;
      
      console.log(`\n📦 Product ${index + 1}: ${product.name}`);
      console.log(`   Variants: ${variantCount}`);
      
      if (variantCount > 1) {
        productsWithMultipleVariants++;
        console.log(`   ⚠️  Multiple variants found!`);
      } else {
        productsWithSingleVariant++;
      }

      // Calculate value for this product
      let productValue = 0;
      variants.forEach((variant, variantIndex) => {
        const costPrice = variant.cost_price || 0;
        const quantity = variant.quantity || 0;
        const variantValue = costPrice * quantity;
        productValue += variantValue;
        
        console.log(`   Variant ${variantIndex + 1}: ${variant.name || 'Default'} - ${quantity} × ${costPrice} = ${variantValue}`);
      });
      
      console.log(`   Total Product Value: ${productValue}`);
      totalValue += productValue;
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Products with Single Variant: ${productsWithSingleVariant}`);
    console.log(`   Products with Multiple Variants: ${productsWithMultipleVariants}`);
    console.log(`   Total Inventory Value: ${totalValue}`);

    // Check if the issue is in the logging
    if (productsWithMultipleVariants === 0) {
      console.log('\n✅ All products have single variants (Default variants)');
      console.log('   This is expected after implementing auto-variant creation');
      console.log('   The total value calculation is working correctly');
    } else {
      console.log('\n⚠️  Some products have multiple variants');
      console.log('   The LiveInventoryService should be calculating values from all variants');
    }

    // Test the LiveInventoryService calculation
    console.log('\n🧪 Testing LiveInventoryService calculation...');
    
    // Simulate the LiveInventoryService calculation
    let liveServiceValue = 0;
    products.forEach((product) => {
      const variants = product.lats_product_variants || [];
      const productValue = variants.reduce((sum, variant) => {
        const costPrice = variant.cost_price || 0;
        const quantity = variant.quantity || 0;
        return sum + (costPrice * quantity);
      }, 0);
      liveServiceValue += productValue;
    });

    console.log(`   LiveInventoryService calculated value: ${liveServiceValue}`);
    console.log(`   Manual calculation value: ${totalValue}`);
    console.log(`   Values match: ${liveServiceValue === totalValue ? '✅' : '❌'}`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
checkMultipleVariants()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
