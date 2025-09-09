#!/usr/bin/env node

/**
 * Comprehensive Price Fix and Inventory Value Correction
 * 
 * This script:
 * 1. Fixes products with zero selling prices
 * 2. Validates inventory value calculations
 * 3. Updates product total_value fields
 * 4. Ensures data consistency
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

async function comprehensivePriceFix() {
  console.log('🔍 [Comprehensive Fix] Starting comprehensive price and inventory fix...');
  
  if (DRY_RUN) {
    console.log('🧪 [Comprehensive Fix] DRY RUN MODE - No changes will be made');
  }

  try {
    // Step 1: Fix zero selling prices
    console.log('\n📝 Step 1: Fixing zero selling prices...');
    await fixZeroSellingPrices();

    // Step 2: Validate and fix inventory values
    console.log('\n📝 Step 2: Validating inventory values...');
    await validateInventoryValues();

    // Step 3: Update product total_value fields
    console.log('\n📝 Step 3: Updating product total_value fields...');
    await updateProductTotalValues();

    console.log('\n✅ [Comprehensive Fix] All fixes completed successfully!');

  } catch (error) {
    console.error('❌ [Comprehensive Fix] Error:', error);
  }
}

async function fixZeroSellingPrices() {
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
    console.error('❌ Error fetching variants:', fetchError);
    return;
  }

  console.log(`📦 Found ${variants?.length || 0} variants with zero selling price`);

  if (!variants || variants.length === 0) {
    console.log('✅ No variants need price fixing');
    return;
  }

  let fixedCount = 0;

  for (const variant of variants) {
    const costPrice = variant.cost_price || 0;
    const profitMargin = Math.random() * (DEFAULT_PROFIT_MARGIN_MAX - DEFAULT_PROFIT_MARGIN_MIN) + DEFAULT_PROFIT_MARGIN_MIN;
    const newSellingPrice = Math.round(costPrice * (1 + profitMargin));
    
    console.log(`🔧 Fixing ${variant.name || 'Default'} (${variant.sku}): TSh ${costPrice.toLocaleString()} → TSh ${newSellingPrice.toLocaleString()}`);

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('lats_product_variants')
        .update({ selling_price: newSellingPrice })
        .eq('id', variant.id);

      if (updateError) {
        console.error(`❌ Failed to update ${variant.sku}:`, updateError);
      } else {
        fixedCount++;
      }
    } else {
      fixedCount++;
    }
  }

  console.log(`✅ Fixed ${fixedCount} variants`);
}

async function validateInventoryValues() {
  // Get all products with their variants
  const { data: products, error: fetchError } = await supabase
    .from('lats_products')
    .select(`
      id,
      name,
      total_value,
      lats_product_variants(
        id,
        cost_price,
        quantity
      )
    `)
    .eq('is_active', true);

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError);
    return;
  }

  console.log(`📦 Validating ${products?.length || 0} products`);

  let correctedCount = 0;
  let totalCalculatedValue = 0;

  for (const product of products || []) {
    // Calculate actual total value from variants
    const calculatedValue = product.lats_product_variants?.reduce((sum, variant) => {
      const costPrice = variant.cost_price || 0;
      const quantity = variant.quantity || 0;
      return sum + (costPrice * quantity);
    }, 0) || 0;

    const storedValue = product.total_value || 0;
    totalCalculatedValue += calculatedValue;

    if (Math.abs(calculatedValue - storedValue) > 1) { // Allow for small rounding differences
      console.log(`🔧 ${product.name}: Stored TSh ${storedValue.toLocaleString()} → Calculated TSh ${calculatedValue.toLocaleString()}`);
      
      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('lats_products')
          .update({ total_value: calculatedValue })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Failed to update ${product.name}:`, updateError);
        } else {
          correctedCount++;
        }
      } else {
        correctedCount++;
      }
    }
  }

  console.log(`✅ Corrected ${correctedCount} products`);
  console.log(`💰 Total calculated inventory value: TSh ${totalCalculatedValue.toLocaleString()}`);
}

async function updateProductTotalValues() {
  // This function ensures all product total_value fields are up to date
  const { data: products, error: fetchError } = await supabase
    .from('lats_products')
    .select(`
      id,
      name,
      lats_product_variants(
        id,
        cost_price,
        quantity
      )
    `)
    .eq('is_active', true);

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError);
    return;
  }

  console.log(`📦 Updating total_value for ${products?.length || 0} products`);

  let updatedCount = 0;

  for (const product of products || []) {
    const totalValue = product.lats_product_variants?.reduce((sum, variant) => {
      const costPrice = variant.cost_price || 0;
      const quantity = variant.quantity || 0;
      return sum + (costPrice * quantity);
    }, 0) || 0;

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('lats_products')
        .update({ total_value: totalValue })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Failed to update ${product.name}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} products`);
}

// Run the comprehensive fix
comprehensivePriceFix()
  .then(() => {
    console.log('\n🎉 [Comprehensive Fix] Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [Comprehensive Fix] Script failed:', error);
    process.exit(1);
  });
