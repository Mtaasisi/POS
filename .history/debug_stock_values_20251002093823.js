#!/usr/bin/env node

/**
 * Debug Stock Values - Check what's causing high inventory values
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

async function debugStockValues() {
  console.log('🔍 Debugging Stock Values - Checking for data issues...\n');
  
  try {
    // Get all products with their variants and total_value
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        sku,
        is_active,
        total_quantity,
        total_value,
        lats_product_variants (
          id,
          name,
          sku,
          cost_price,
          selling_price,
          quantity,
          min_quantity
        )
      `)
      .eq('is_active', true);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`📦 Found ${products?.length || 0} active products\n`);

    let totalCalculatedValue = 0;
    let totalStoredValue = 0;
    let suspiciousProducts = [];
    let highValueProducts = [];

    console.log('🔍 Analyzing each product:\n');

    products?.forEach((product, index) => {
      const variants = product.lats_product_variants || [];
      let productCalculatedValue = 0;
      let productTotalQuantity = 0;

      console.log(`📦 Product ${index + 1}: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Stored total_value: ${formatCurrency(product.total_value || 0)}`);
      console.log(`   Stored total_quantity: ${product.total_quantity || 0}`);
      console.log(`   Variants: ${variants.length}`);

      variants.forEach((variant, vIndex) => {
        const costPrice = variant.cost_price || 0;
        const quantity = variant.quantity || 0;
        const variantValue = costPrice * quantity;
        
        productCalculatedValue += variantValue;
        productTotalQuantity += quantity;

        console.log(`     Variant ${vIndex + 1}: ${variant.name || 'Unnamed'}`);
        console.log(`       SKU: ${variant.sku}`);
        console.log(`       Cost Price: ${formatCurrency(costPrice)}`);
        console.log(`       Quantity: ${quantity}`);
        console.log(`       Value: ${formatCurrency(variantValue)}`);

        // Check for suspicious values
        if (costPrice > 1000000) { // Cost price over 1M TZS
          suspiciousProducts.push({
            product: product.name,
            variant: variant.name,
            issue: 'High cost price',
            value: costPrice,
            type: 'cost_price'
          });
        }

        if (quantity > 1000) { // Quantity over 1000
          suspiciousProducts.push({
            product: product.name,
            variant: variant.name,
            issue: 'High quantity',
            value: quantity,
            type: 'quantity'
          });
        }

        if (variantValue > 10000000) { // Variant value over 10M TZS
          suspiciousProducts.push({
            product: product.name,
            variant: variant.name,
            issue: 'High variant value',
            value: variantValue,
            type: 'variant_value'
          });
        }
      });

      console.log(`   Calculated total value: ${formatCurrency(productCalculatedValue)}`);
      console.log(`   Calculated total quantity: ${productTotalQuantity}`);
      console.log(`   Difference: ${formatCurrency(productCalculatedValue - (product.total_value || 0))}`);
      console.log('');

      totalCalculatedValue += productCalculatedValue;
      totalStoredValue += (product.total_value || 0);

      // Track high value products
      if (productCalculatedValue > 5000000) { // Over 5M TZS
        highValueProducts.push({
          name: product.name,
          sku: product.sku,
          calculatedValue: productCalculatedValue,
          storedValue: product.total_value || 0,
          variants: variants.length,
          totalQuantity: productTotalQuantity
        });
      }
    });

    console.log('📊 SUMMARY ANALYSIS');
    console.log('=' .repeat(50));
    console.log(`💰 Total Calculated Value: ${formatCurrency(totalCalculatedValue)}`);
    console.log(`💰 Total Stored Value: ${formatCurrency(totalStoredValue)}`);
    console.log(`📈 Difference: ${formatCurrency(totalCalculatedValue - totalStoredValue)}`);
    console.log(`📊 Average per product: ${formatCurrency(totalCalculatedValue / (products?.length || 1))}`);
    console.log('');

    if (suspiciousProducts.length > 0) {
      console.log('⚠️  SUSPICIOUS VALUES FOUND:');
      console.log('=' .repeat(50));
      suspiciousProducts.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product} - ${item.variant}`);
        console.log(`   Issue: ${item.issue}`);
        console.log(`   Value: ${formatCurrency(item.value)}`);
        console.log(`   Type: ${item.type}`);
        console.log('');
      });
    }

    if (highValueProducts.length > 0) {
      console.log('🏆 HIGH VALUE PRODUCTS (>5M TZS):');
      console.log('=' .repeat(50));
      highValueProducts
        .sort((a, b) => b.calculatedValue - a.calculatedValue)
        .forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   SKU: ${product.sku}`);
          console.log(`   Calculated Value: ${formatCurrency(product.calculatedValue)}`);
          console.log(`   Stored Value: ${formatCurrency(product.storedValue)}`);
          console.log(`   Variants: ${product.variants}`);
          console.log(`   Total Quantity: ${product.totalQuantity}`);
          console.log('');
        });
    }

    // Check for potential data issues
    console.log('🔍 POTENTIAL ISSUES TO CHECK:');
    console.log('=' .repeat(50));
    console.log('1. Currency units - Are prices in TZS or USD?');
    console.log('2. Decimal places - Are prices stored with correct precision?');
    console.log('3. Duplicate variants - Are there duplicate entries?');
    console.log('4. Test data - Are there test products with inflated values?');
    console.log('5. Unit conversion - Are quantities in correct units?');
    console.log('');

    // Check for duplicate SKUs
    const allSkus = [];
    products?.forEach(product => {
      product.lats_product_variants?.forEach(variant => {
        if (variant.sku) {
          allSkus.push(variant.sku);
        }
      });
    });

    const duplicateSkus = allSkus.filter((sku, index) => allSkus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      console.log('⚠️  DUPLICATE SKUs FOUND:');
      console.log(duplicateSkus);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error debugging stock values:', error);
  }
}

// Run the debug analysis
debugStockValues();
