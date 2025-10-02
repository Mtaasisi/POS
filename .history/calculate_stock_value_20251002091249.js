#!/usr/bin/env node

/**
 * Stock Value Calculator
 * Calculates total stock value from your LATS database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Helper function to format numbers
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-TZ').format(num);
};

async function calculateStockValue() {
  console.log('🔍 Calculating total stock value from your LATS database...\n');
  
  try {
    // Method 1: Calculate from Product Variants (Most Accurate)
    console.log('📊 Method 1: Product Variants Analysis');
    console.log('=' .repeat(50));
    
    const { data: variantData, error: variantError } = await supabase
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
          is_active
        ),
        lats_categories (
          name
        ),
        lats_brands (
          name
        )
      `)
      .eq('is_active', true);

    if (variantError) {
      console.error('❌ Error fetching product data:', variantError);
      return;
    }

    let totalProducts = 0;
    let totalVariants = 0;
    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let outOfStockProducts = 0;
    let lowStockProducts = 0;
    let wellStockedProducts = 0;

    const categoryBreakdown = {};
    const brandBreakdown = {};
    const topProducts = [];

    variantData?.forEach(product => {
      if (!product.is_active) return;
      
      totalProducts++;
      const variants = product.lats_product_variants?.filter(v => v.is_active) || [];
      totalVariants += variants.length;

      let productQuantity = 0;
      let productCostValue = 0;
      let productRetailValue = 0;

      variants.forEach(variant => {
        const quantity = variant.quantity || 0;
        const costPrice = variant.cost_price || 0;
        const sellingPrice = variant.selling_price || 0;

        productQuantity += quantity;
        productCostValue += costPrice * quantity;
        productRetailValue += sellingPrice * quantity;
      });

      totalQuantity += productQuantity;
      totalCostValue += productCostValue;
      totalRetailValue += productRetailValue;

      // Stock status analysis
      if (productQuantity === 0) {
        outOfStockProducts++;
      } else if (productQuantity <= 5) {
        lowStockProducts++;
      } else {
        wellStockedProducts++;
      }

      // Category breakdown
      const categoryName = product.lats_categories?.name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          products: 0,
          quantity: 0,
          costValue: 0,
          retailValue: 0
        };
      }
      categoryBreakdown[categoryName].products++;
      categoryBreakdown[categoryName].quantity += productQuantity;
      categoryBreakdown[categoryName].costValue += productCostValue;
      categoryBreakdown[categoryName].retailValue += productRetailValue;

      // Brand breakdown
      const brandName = product.lats_brands?.name || 'No Brand';
      if (!brandBreakdown[brandName]) {
        brandBreakdown[brandName] = {
          products: 0,
          quantity: 0,
          costValue: 0,
          retailValue: 0
        };
      }
      brandBreakdown[brandName].products++;
      brandBreakdown[brandName].quantity += productQuantity;
      brandBreakdown[brandName].costValue += productCostValue;
      brandBreakdown[brandName].retailValue += productRetailValue;

      // Top products
      if (productCostValue > 0) {
        topProducts.push({
          name: product.name,
          sku: product.sku,
          category: categoryName,
          brand: brandName,
          quantity: productQuantity,
          costValue: productCostValue,
          retailValue: productRetailValue,
          potentialProfit: productRetailValue - productCostValue
        });
      }
    });

    // Sort top products by cost value
    topProducts.sort((a, b) => b.costValue - a.costValue);

    console.log(`📦 Total Products: ${formatNumber(totalProducts)}`);
    console.log(`🏷️  Total Variants: ${formatNumber(totalVariants)}`);
    console.log(`📊 Total Quantity: ${formatNumber(totalQuantity)}`);
    console.log(`💰 Total Cost Value: ${formatCurrency(totalCostValue)}`);
    console.log(`🛒 Total Retail Value: ${formatCurrency(totalRetailValue)}`);
    console.log(`📈 Potential Profit: ${formatCurrency(totalRetailValue - totalCostValue)}`);
    console.log(`📊 Profit Margin: ${((totalRetailValue - totalCostValue) / totalRetailValue * 100).toFixed(1)}%`);
    console.log('');

    // Stock status summary
    console.log('📊 Stock Status Summary');
    console.log('=' .repeat(30));
    console.log(`❌ Out of Stock: ${outOfStockProducts} products`);
    console.log(`⚠️  Low Stock (≤5): ${lowStockProducts} products`);
    console.log(`✅ Well Stocked (>5): ${wellStockedProducts} products`);
    console.log('');

    // Top 10 most valuable products
    console.log('🏆 Top 10 Most Valuable Products');
    console.log('=' .repeat(50));
    topProducts.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Category: ${product.category} | Brand: ${product.brand}`);
      console.log(`   Quantity: ${formatNumber(product.quantity)}`);
      console.log(`   Cost Value: ${formatCurrency(product.costValue)}`);
      console.log(`   Retail Value: ${formatCurrency(product.retailValue)}`);
      console.log(`   Potential Profit: ${formatCurrency(product.potentialProfit)}`);
      console.log('');
    });

    // Category breakdown
    console.log('📂 Category Breakdown');
    console.log('=' .repeat(40));
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b.costValue - a.costValue);
    
    sortedCategories.forEach(([category, data]) => {
      console.log(`${category}:`);
      console.log(`  Products: ${data.products}`);
      console.log(`  Quantity: ${formatNumber(data.quantity)}`);
      console.log(`  Cost Value: ${formatCurrency(data.costValue)}`);
      console.log(`  Retail Value: ${formatCurrency(data.retailValue)}`);
      console.log('');
    });

    // Brand breakdown
    console.log('🏷️  Brand Breakdown');
    console.log('=' .repeat(40));
    const sortedBrands = Object.entries(brandBreakdown)
      .sort(([,a], [,b]) => b.costValue - a.costValue);
    
    sortedBrands.forEach(([brand, data]) => {
      console.log(`${brand}:`);
      console.log(`  Products: ${data.products}`);
      console.log(`  Quantity: ${formatNumber(data.quantity)}`);
      console.log(`  Cost Value: ${formatCurrency(data.costValue)}`);
      console.log(`  Retail Value: ${formatCurrency(data.retailValue)}`);
      console.log('');
    });

    // Method 2: Check inventory items (serial number tracking)
    console.log('🔍 Method 2: Inventory Items Analysis');
    console.log('=' .repeat(50));
    
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_items')
      .select(`
        id,
        serial_number,
        status,
        cost_price,
        selling_price,
        lats_products!inner (
          id,
          name,
          is_active
        )
      `)
      .eq('lats_products.is_active', true);

    if (inventoryError) {
      console.log('⚠️  Inventory items table not accessible or empty');
    } else {
      let availableItems = 0;
      let soldItems = 0;
      let damagedItems = 0;
      let availableCostValue = 0;
      let availableRetailValue = 0;

      inventoryData?.forEach(item => {
        if (item.status === 'available') {
          availableItems++;
          availableCostValue += item.cost_price || 0;
          availableRetailValue += item.selling_price || 0;
        } else if (item.status === 'sold') {
          soldItems++;
        } else if (item.status === 'damaged') {
          damagedItems++;
        }
      });

      console.log(`📦 Total Inventory Items: ${formatNumber(inventoryData?.length || 0)}`);
      console.log(`✅ Available Items: ${formatNumber(availableItems)}`);
      console.log(`💰 Available Cost Value: ${formatCurrency(availableCostValue)}`);
      console.log(`🛒 Available Retail Value: ${formatCurrency(availableRetailValue)}`);
      console.log(`✅ Sold Items: ${formatNumber(soldItems)}`);
      console.log(`❌ Damaged Items: ${formatNumber(damagedItems)}`);
    }

    console.log('\n🎯 SUMMARY');
    console.log('=' .repeat(50));
    console.log(`💰 TOTAL STOCK VALUE: ${formatCurrency(totalCostValue)}`);
    console.log(`🛒 TOTAL RETAIL VALUE: ${formatCurrency(totalRetailValue)}`);
    console.log(`📈 POTENTIAL PROFIT: ${formatCurrency(totalRetailValue - totalCostValue)}`);
    console.log(`📊 PROFIT MARGIN: ${((totalRetailValue - totalCostValue) / totalRetailValue * 100).toFixed(1)}%`);
    console.log(`📦 TOTAL PRODUCTS: ${formatNumber(totalProducts)}`);
    console.log(`🏷️  TOTAL VARIANTS: ${formatNumber(totalVariants)}`);
    console.log(`📊 TOTAL QUANTITY: ${formatNumber(totalQuantity)}`);

  } catch (error) {
    console.error('❌ Error calculating stock value:', error);
  }
}

// Run the calculation
calculateStockValue();
