#!/usr/bin/env node

/**
 * Fetch Products from Database
 * Shows available products for Serial Number Manager
 */

import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchProducts() {
  console.log('🚀 Fetching Products from Database');
  console.log('=' .repeat(50));
  
  try {
    // Fetch products
    console.log('\n📦 Fetching LATS Products...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, sku, selling_price, stock_quantity, status, condition')
      .order('name');

    if (productsError) {
      console.log(`❌ Error fetching products: ${productsError.message}`);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found in database');
      return;
    }

    console.log(`✅ Found ${products.length} products:`);
    console.log('');

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: TSH ${product.selling_price?.toLocaleString() || 'N/A'}`);
      console.log(`   Stock: ${product.stock_quantity || 0}`);
      console.log(`   Status: ${product.status || 'N/A'}`);
      console.log(`   Condition: ${product.condition || 'N/A'}`);
      console.log(`   ID: ${product.id}`);
      console.log('');
    });

    // Fetch product variants
    console.log('\n🔧 Fetching Product Variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, name, sku, quantity, price')
      .order('product_id, name');

    if (variantsError) {
      console.log(`❌ Error fetching variants: ${variantsError.message}`);
    } else if (variants && variants.length > 0) {
      console.log(`✅ Found ${variants.length} product variants:`);
      console.log('');

      variants.forEach((variant, index) => {
        const product = products.find(p => p.id === variant.product_id);
        console.log(`${index + 1}. ${variant.name} (${product?.name || 'Unknown Product'})`);
        console.log(`   SKU: ${variant.sku}`);
        console.log(`   Price: TSH ${variant.price?.toLocaleString() || 'N/A'}`);
        console.log(`   Quantity: ${variant.quantity || 0}`);
        console.log(`   Product ID: ${variant.product_id}`);
        console.log(`   Variant ID: ${variant.id}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No product variants found');
    }

    // Check for existing serialized items
    console.log('\n📱 Checking Existing Serialized Items...');
    const { data: serialItems, error: serialError } = await supabase
      .from('inventory_items')
      .select(`
        id, 
        product_id, 
        variant_id, 
        serial_number, 
        imei, 
        status,
        product:lats_products(name, sku),
        variant:lats_product_variants(name, sku)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (serialError) {
      console.log(`❌ Error fetching serial items: ${serialError.message}`);
    } else if (serialItems && serialItems.length > 0) {
      console.log(`✅ Found ${serialItems.length} serialized items (showing latest 10):`);
      console.log('');

      serialItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.serial_number}`);
        console.log(`   Product: ${item.product?.name || 'Unknown'} (${item.product?.sku || 'N/A'})`);
        if (item.variant) {
          console.log(`   Variant: ${item.variant.name} (${item.variant.sku})`);
        }
        console.log(`   IMEI: ${item.imei || 'N/A'}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   ID: ${item.id}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No serialized items found yet');
      console.log('💡 You can start adding serial numbers using the Serial Number Manager');
    }

    console.log('=' .repeat(50));
    console.log('✅ Product fetch completed successfully');
    console.log('\n💡 Next steps:');
    console.log('   1. Use the Serial Number Manager to add serial numbers to products');
    console.log('   2. Select a product from the list above');
    console.log('   3. Add individual serial numbers or use bulk import');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchProducts().catch(console.error);
