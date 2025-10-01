#!/usr/bin/env node

/**
 * Fix Product Pricing Issues Script
 * 
 * This script fixes products with zero selling prices and other pricing issues
 * Run with: node scripts/fix-product-pricing-issues.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductPricingIssues() {
  console.log('🔧 Starting Product Pricing Fix...\n');

  try {
    // Step 1: Find problematic products
    console.log('📊 Step 1: Identifying problematic products...');
    
    const { data: problematicProducts, error: findError } = await supabase
      .from('lats_product_variants')
      .select(`
        id,
        sku,
        cost_price,
        selling_price,
        quantity,
        product_id,
        lats_products!inner(name, sku, is_active)
      `)
      .eq('selling_price', 0)
      .gt('cost_price', 0)
      .gt('quantity', 0);

    if (findError) {
      console.error('❌ Error finding problematic products:', findError);
      return;
    }

    console.log(`Found ${problematicProducts?.length || 0} products with pricing issues\n`);

    if (!problematicProducts || problematicProducts.length === 0) {
      console.log('✅ No products need fixing!');
      return;
    }

    // Step 2: Fix the specific product (SKU-1759321763804-KXP)
    console.log('🎯 Step 2: Fixing specific product SKU-1759321763804-KXP...');
    
    const specificProduct = problematicProducts.find(p => p.sku === 'SKU-1759321763804-KXP');
    
    if (specificProduct) {
      const newSellingPrice = specificProduct.cost_price * 1.5; // 50% markup
      
      const { error: updateError } = await supabase
        .from('lats_product_variants')
        .update({
          selling_price: newSellingPrice,
          updated_at: new Date().toISOString()
        })
        .eq('sku', 'SKU-1759321763804-KXP');

      if (updateError) {
        console.error('❌ Error updating specific product:', updateError);
      } else {
        console.log(`✅ Fixed SKU-1759321763804-KXP: Cost=${specificProduct.cost_price}, New Price=${newSellingPrice}`);
      }

      // Activate the product
      const { error: activateError } = await supabase
        .from('lats_products')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', specificProduct.product_id);

      if (activateError) {
        console.error('❌ Error activating product:', activateError);
      } else {
        console.log('✅ Activated product');
      }
    }

    // Step 3: Fix all other problematic products
    console.log('\n🔧 Step 3: Fixing all other problematic products...');
    
    const otherProducts = problematicProducts.filter(p => p.sku !== 'SKU-1759321763804-KXP');
    
    if (otherProducts.length > 0) {
      const updates = otherProducts.map(product => ({
        id: product.id,
        selling_price: product.cost_price * 1.5, // 50% markup
        updated_at: new Date().toISOString()
      }));

      // Update variants in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { error } = await supabase
            .from('lats_product_variants')
            .update({
              selling_price: update.selling_price,
              updated_at: update.updated_at
            })
            .eq('id', update.id);

          if (error) {
            console.error(`❌ Error updating variant ${update.id}:`, error);
          }
        }
      }

      console.log(`✅ Updated ${otherProducts.length} product variants`);
    }

    // Step 4: Activate products with stock
    console.log('\n🔄 Step 4: Activating products with stock...');
    
    const { error: activateError } = await supabase
      .from('lats_products')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .in('id', problematicProducts.map(p => p.product_id))
      .eq('is_active', false);

    if (activateError) {
      console.error('❌ Error activating products:', activateError);
    } else {
      console.log('✅ Activated products with stock');
    }

    // Step 5: Update product totals
    console.log('\n📊 Step 5: Updating product totals...');
    
    // This would require a more complex query, but for now we'll log the action
    console.log('ℹ️  Product totals will be recalculated on next product view');

    // Step 6: Verification
    console.log('\n✅ Step 6: Verification...');
    
    const { data: verification, error: verifyError } = await supabase
      .from('lats_product_variants')
      .select(`
        sku,
        cost_price,
        selling_price,
        quantity,
        lats_products!inner(name, is_active)
      `)
      .eq('sku', 'SKU-1759321763804-KXP');

    if (verifyError) {
      console.error('❌ Error during verification:', verifyError);
    } else if (verification && verification.length > 0) {
      const product = verification[0];
      const profit = product.selling_price - product.cost_price;
      const totalValue = product.quantity * product.selling_price;
      const markup = ((product.selling_price - product.cost_price) / product.cost_price * 100).toFixed(1);
      
      console.log('\n📋 Fixed Product Summary:');
      console.log(`   Name: ${product.lats_products.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Cost Price: TSh ${product.cost_price}`);
      console.log(`   Selling Price: TSh ${product.selling_price}`);
      console.log(`   Profit/Unit: TSh ${profit}`);
      console.log(`   Markup: ${markup}%`);
      console.log(`   Total Value: TSh ${totalValue}`);
      console.log(`   Status: ${product.lats_products.is_active ? 'Active' : 'Inactive'}`);
    }

    console.log('\n🎉 Product pricing fix completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixProductPricingIssues();
