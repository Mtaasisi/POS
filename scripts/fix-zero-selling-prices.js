#!/usr/bin/env node

/**
 * Automatic Fix for Products with Zero Selling Prices
 * 
 * This script finds all product variants that have:
 * - Cost price > 0
 * - Selling price = 0
 * - Stock quantity > 0 (optional)
 * 
 * And automatically sets a reasonable selling price based on cost price
 * with a default profit margin of 30-50%
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

// Configuration
const DEFAULT_PROFIT_MARGIN_MIN = 0.30; // 30% minimum profit margin
const DEFAULT_PROFIT_MARGIN_MAX = 0.50; // 50% maximum profit margin
const DRY_RUN = process.argv.includes('--dry-run');

async function fixZeroSellingPrices() {
  console.log('🔍 [Price Fix] Starting automatic price fix for products with zero selling prices...');
  
  if (DRY_RUN) {
    console.log('🧪 [Price Fix] DRY RUN MODE - No changes will be made');
  }

  try {
    // Find all variants with zero selling price but positive cost price
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
      .gt('cost_price', 0)
      .eq('selling_price', 0)
      .eq('lats_products.is_active', true);

    if (fetchError) {
      console.error('❌ [Price Fix] Error fetching variants:', fetchError);
      return;
    }

    console.log(`📦 [Price Fix] Found ${variants?.length || 0} variants with zero selling price`);

    if (!variants || variants.length === 0) {
      console.log('✅ [Price Fix] No variants need price fixing');
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;

    for (const variant of variants) {
      const costPrice = variant.cost_price || 0;
      const currentSellingPrice = variant.selling_price || 0;
      const stockQuantity = variant.quantity || 0;
      
      // Calculate new selling price with profit margin
      const profitMargin = Math.random() * (DEFAULT_PROFIT_MARGIN_MAX - DEFAULT_PROFIT_MARGIN_MIN) + DEFAULT_PROFIT_MARGIN_MIN;
      const newSellingPrice = Math.round(costPrice * (1 + profitMargin));
      
      console.log(`\n🔧 [Price Fix] Processing variant: ${variant.name || 'Default'}`);
      console.log(`   Product: ${variant.lats_products.name}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Cost Price: TSh ${costPrice.toLocaleString()}`);
      console.log(`   Current Selling Price: TSh ${currentSellingPrice.toLocaleString()}`);
      console.log(`   Stock: ${stockQuantity} units`);
      console.log(`   New Selling Price: TSh ${newSellingPrice.toLocaleString()} (${(profitMargin * 100).toFixed(1)}% margin)`);

      if (DRY_RUN) {
        console.log(`   🧪 [DRY RUN] Would update selling price to TSh ${newSellingPrice.toLocaleString()}`);
        fixedCount++;
        continue;
      }

      // Update the selling price
      const { error: updateError } = await supabase
        .from('lats_product_variants')
        .update({ selling_price: newSellingPrice })
        .eq('id', variant.id);

      if (updateError) {
        console.error(`   ❌ [Price Fix] Failed to update variant ${variant.sku}:`, updateError);
        skippedCount++;
      } else {
        console.log(`   ✅ [Price Fix] Successfully updated selling price`);
        fixedCount++;
      }
    }

    console.log(`\n📊 [Price Fix] Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} variants`);
    console.log(`   ⏭️  Skipped: ${skippedCount} variants`);
    console.log(`   📦 Total processed: ${variants.length} variants`);

    if (DRY_RUN) {
      console.log(`\n🧪 [DRY RUN] To apply these changes, run the script without --dry-run flag`);
    } else {
      console.log(`\n✅ [Price Fix] Automatic price fix completed successfully!`);
    }

  } catch (error) {
    console.error('❌ [Price Fix] Unexpected error:', error);
  }
}

// Run the fix
fixZeroSellingPrices()
  .then(() => {
    console.log('\n🎉 [Price Fix] Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [Price Fix] Script failed:', error);
    process.exit(1);
  });
