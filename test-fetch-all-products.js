/**
 * Test script to demonstrate fetching all products from the database
 * Run this with: node test-fetch-all-products.js
 */

// Import the fetchAllProducts function
import { fetchAllProducts, fetchAllProductsCount, fetchProductsByCategory } from './src/features/lats/lib/fetchAllProducts.ts';

async function testFetchAllProducts() {
  console.log('🚀 Starting test: Fetch All Products from Database');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get product counts
    console.log('\n📊 Test 1: Getting product counts...');
    const countResult = await fetchAllProductsCount();
    
    if (countResult.ok) {
      console.log('✅ Product counts retrieved successfully:');
      console.log(`   Total products: ${countResult.data.count}`);
      console.log(`   Active products: ${countResult.data.activeCount}`);
    } else {
      console.log('❌ Failed to get product counts:', countResult.message);
    }

    // Test 2: Fetch all products
    console.log('\n📦 Test 2: Fetching all products...');
    const productsResult = await fetchAllProducts();
    
    if (productsResult.ok) {
      console.log('✅ Products fetched successfully!');
      console.log(`   Total products retrieved: ${productsResult.data.length}`);
      
      if (productsResult.data.length > 0) {
        // Show sample product data
        const sampleProduct = productsResult.data[0];
        console.log('\n📋 Sample product data:');
        console.log(`   Name: ${sampleProduct.name}`);
        console.log(`   SKU: ${sampleProduct.sku}`);
        console.log(`   Category: ${sampleProduct.category?.name || 'No category'}`);
        console.log(`   Supplier: ${sampleProduct.supplier?.name || 'No supplier'}`);
        console.log(`   Price: ${sampleProduct.price}`);
        console.log(`   Stock: ${sampleProduct.totalQuantity}`);
        console.log(`   Variants: ${sampleProduct.variants?.length || 0}`);
        
        // Show summary statistics
        const stats = {
          totalProducts: productsResult.data.length,
          productsWithCategories: productsResult.data.filter(p => p.category).length,
          productsWithSuppliers: productsResult.data.filter(p => p.supplier).length,
          productsWithVariants: productsResult.data.filter(p => p.variants && p.variants.length > 0).length,
          totalStockValue: productsResult.data.reduce((sum, p) => sum + (p.totalValue || 0), 0),
          averagePrice: productsResult.data.reduce((sum, p) => sum + p.price, 0) / productsResult.data.length
        };
        
        console.log('\n📈 Summary Statistics:');
        console.log(`   Products with categories: ${stats.productsWithCategories}`);
        console.log(`   Products with suppliers: ${stats.productsWithSuppliers}`);
        console.log(`   Products with variants: ${stats.productsWithVariants}`);
        console.log(`   Total stock value: ${stats.totalStockValue.toLocaleString()} TZS`);
        console.log(`   Average price: ${stats.averagePrice.toLocaleString()} TZS`);
      }
    } else {
      console.log('❌ Failed to fetch products:', productsResult.message);
    }

    // Test 3: Fetch products by category (if we have categories)
    if (productsResult.ok && productsResult.data.length > 0) {
      const firstProductWithCategory = productsResult.data.find(p => p.category);
      if (firstProductWithCategory) {
        console.log(`\n🏷️ Test 3: Fetching products by category (${firstProductWithCategory.category.name})...`);
        const categoryResult = await fetchProductsByCategory(firstProductWithCategory.categoryId);
        
        if (categoryResult.ok) {
          console.log(`✅ Category products fetched: ${categoryResult.data.length} products`);
        } else {
          console.log('❌ Failed to fetch category products:', categoryResult.message);
        }
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test completed!');
}

// Run the test
testFetchAllProducts();