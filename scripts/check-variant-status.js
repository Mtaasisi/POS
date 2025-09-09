#!/usr/bin/env node

/**
 * Check Variant Status Script
 * 
 * This script checks the status of specific variants to verify pricing and stock
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVariantStatus() {
  console.log('🔍 [Variant Check] Checking variant status...');

  try {
    // Check for variants with the specific SKU pattern or similar issues
    const { data: variants, error: fetchError } = await supabase
      .from('lats_product_variants')
      .select(`
        id,
        name,
        sku,
        cost_price,
        selling_price,
        quantity,
        lats_products!inner(
          id,
          name,
          is_active
        )
      `)
      .or('selling_price.eq.0,cost_price.gt.0')
      .eq('lats_products.is_active', true)
      .order('cost_price', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching variants:', fetchError);
      return;
    }

    console.log(`📦 Found ${variants?.length || 0} variants to check\n`);

    if (!variants || variants.length === 0) {
      console.log('✅ No variants need checking');
      return;
    }

    let totalInventoryValue = 0;
    let zeroSellingPriceCount = 0;
    let outOfStockCount = 0;

    console.log('📊 Variant Status Report:');
    console.log('=' .repeat(80));

    for (const variant of variants) {
      const costPrice = variant.cost_price || 0;
      const sellingPrice = variant.selling_price || 0;
      const stockQuantity = variant.quantity || 0;
      const variantValue = costPrice * stockQuantity;
      
      totalInventoryValue += variantValue;

      // Status indicators
      const status = [];
      if (sellingPrice === 0) {
        status.push('❌ Zero Selling Price');
        zeroSellingPriceCount++;
      }
      if (stockQuantity === 0) {
        status.push('📦 Out of Stock');
        outOfStockCount++;
      }
      if (sellingPrice > 0 && stockQuantity > 0) {
        status.push('✅ OK');
      }

      console.log(`\n🔸 ${variant.name || 'Default Variant'}`);
      console.log(`   Product: ${variant.lats_products.name}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Cost Price: TSh ${costPrice.toLocaleString()}`);
      console.log(`   Selling Price: TSh ${sellingPrice.toLocaleString()}`);
      console.log(`   Stock: ${stockQuantity} units`);
      console.log(`   Value: TSh ${variantValue.toLocaleString()}`);
      console.log(`   Status: ${status.join(', ')}`);

      if (sellingPrice > 0 && costPrice > 0) {
        const profitMargin = ((sellingPrice - costPrice) / costPrice) * 100;
        console.log(`   Profit Margin: ${profitMargin.toFixed(1)}%`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('📊 Summary:');
    console.log(`   Total Variants: ${variants.length}`);
    console.log(`   Zero Selling Price: ${zeroSellingPriceCount}`);
    console.log(`   Out of Stock: ${outOfStockCount}`);
    console.log(`   Total Inventory Value: TSh ${totalInventoryValue.toLocaleString()}`);

    // Check if the specific variant mentioned is found
    const specificVariant = variants.find(v => v.sku === 'SKU-1756712789391-V81');
    if (specificVariant) {
      console.log('\n🎯 Found the specific variant you mentioned:');
      console.log(`   SKU: ${specificVariant.sku}`);
      console.log(`   Cost: TSh ${specificVariant.cost_price.toLocaleString()}`);
      console.log(`   Selling Price: TSh ${specificVariant.selling_price.toLocaleString()}`);
      console.log(`   Stock: ${specificVariant.quantity} units`);
      console.log(`   Value Contribution: TSh ${(specificVariant.cost_price * specificVariant.quantity).toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkVariantStatus()
  .then(() => {
    console.log('\n🎉 [Variant Check] Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [Variant Check] Script failed:', error);
    process.exit(1);
  });
