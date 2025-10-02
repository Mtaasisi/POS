#!/usr/bin/env node

/**
 * Simple Stock Value Calculator
 * Uses the existing Supabase client from your app
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the Supabase client configuration
const supabaseClientPath = join(__dirname, 'src/lib/supabaseClient.ts');
const supabaseClientCode = readFileSync(supabaseClientPath, 'utf8');

// Extract the configuration from the client code
const urlMatch = supabaseClientCode.match(/url:\s*['"`]([^'"`]+)['"`]/);
const keyMatch = supabaseClientCode.match(/key:\s*['"`]([^'"`]+)['"`]/);

if (!urlMatch || !keyMatch) {
  console.error('❌ Could not extract Supabase configuration from client code');
  process.exit(1);
}

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];

console.log('🔍 Using Supabase configuration:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Create a simple fetch-based client
async function querySupabase(table, select = '*', filters = {}) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  
  // Add select parameter
  if (select !== '*') {
    url.searchParams.set('select', select);
  }
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const response = await fetch(url.toString(), {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

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
    // First, let's test the connection with a simple query
    console.log('🔍 Testing database connection...');
    const testData = await querySupabase('lats_products', 'id, name', { 'is_active': 'eq.true', 'limit': '1' });
    console.log('✅ Database connection successful\n');
    
    // Get all active products with their variants
    console.log('📊 Fetching product data...');
    const products = await querySupabase('lats_products', `
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
      )
    `, { 'is_active': 'eq.true' });
    
    console.log(`📦 Found ${products.length} active products\n`);
    
    let totalProducts = 0;
    let totalVariants = 0;
    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let outOfStockProducts = 0;
    let lowStockProducts = 0;
    let wellStockedProducts = 0;
    
    const categoryBreakdown = {};
    const topProducts = [];
    
    products.forEach(product => {
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
      
      // Top products
      if (productCostValue > 0) {
        topProducts.push({
          name: product.name,
          sku: product.sku,
          quantity: productQuantity,
          costValue: productCostValue,
          retailValue: productRetailValue,
          potentialProfit: productRetailValue - productCostValue
        });
      }
    });
    
    // Sort top products by cost value
    topProducts.sort((a, b) => b.costValue - a.costValue);
    
    console.log('📊 STOCK VALUE ANALYSIS');
    console.log('=' .repeat(50));
    console.log(`📦 Total Products: ${formatNumber(totalProducts)}`);
    console.log(`🏷️  Total Variants: ${formatNumber(totalVariants)}`);
    console.log(`📊 Total Quantity: ${formatNumber(totalQuantity)}`);
    console.log(`💰 Total Cost Value: ${formatCurrency(totalCostValue)}`);
    console.log(`🛒 Total Retail Value: ${formatCurrency(totalRetailValue)}`);
    console.log(`📈 Potential Profit: ${formatCurrency(totalRetailValue - totalCostValue)}`);
    console.log(`📊 Profit Margin: ${totalRetailValue > 0 ? ((totalRetailValue - totalCostValue) / totalRetailValue * 100).toFixed(1) : 0}%`);
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
      console.log(`   Quantity: ${formatNumber(product.quantity)}`);
      console.log(`   Cost Value: ${formatCurrency(product.costValue)}`);
      console.log(`   Retail Value: ${formatCurrency(product.retailValue)}`);
      console.log(`   Potential Profit: ${formatCurrency(product.potentialProfit)}`);
      console.log('');
    });
    
    console.log('🎯 FINAL SUMMARY');
    console.log('=' .repeat(50));
    console.log(`💰 TOTAL STOCK VALUE: ${formatCurrency(totalCostValue)}`);
    console.log(`🛒 TOTAL RETAIL VALUE: ${formatCurrency(totalRetailValue)}`);
    console.log(`📈 POTENTIAL PROFIT: ${formatCurrency(totalRetailValue - totalCostValue)}`);
    console.log(`📊 PROFIT MARGIN: ${totalRetailValue > 0 ? ((totalRetailValue - totalCostValue) / totalRetailValue * 100).toFixed(1) : 0}%`);
    console.log(`📦 TOTAL PRODUCTS: ${formatNumber(totalProducts)}`);
    console.log(`🏷️  TOTAL VARIANTS: ${formatNumber(totalVariants)}`);
    console.log(`📊 TOTAL QUANTITY: ${formatNumber(totalQuantity)}`);
    
  } catch (error) {
    console.error('❌ Error calculating stock value:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the calculation
calculateStockValue();
