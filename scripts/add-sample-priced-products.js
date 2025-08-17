import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addSamplePricedProducts() {
  console.log('🔍 Adding sample products with proper prices...\n');
  
  try {
    // Sample products with realistic prices
    const sampleProducts = [
      {
        name: 'iPhone 15 Pro Max Test',
        description: 'Latest iPhone with titanium design and A17 Pro chip',
        category_id: null, // Will be set if categories exist
        brand_id: null,
        supplier_id: null,
        images: [],
        tags: ['smartphone', 'apple', 'premium'],
        is_active: true,
        total_quantity: 0,
        total_value: 0
      },
      {
        name: 'Samsung Galaxy S24 Ultra Test',
        description: 'Premium Android flagship with S Pen',
        category_id: null,
        brand_id: null,
        supplier_id: null,
        images: [],
        tags: ['smartphone', 'samsung', 'premium'],
        is_active: true,
        total_quantity: 0,
        total_value: 0
      },
      {
        name: 'MacBook Air M3 Test',
        description: 'Lightweight laptop with M3 chip',
        category_id: null,
        brand_id: null,
        supplier_id: null,
        images: [],
        tags: ['laptop', 'apple', 'macbook'],
        is_active: true,
        total_quantity: 0,
        total_value: 0
      },
      {
        name: 'AirPods Pro 2nd Gen Test',
        description: 'Wireless earbuds with active noise cancellation',
        category_id: null,
        brand_id: null,
        supplier_id: null,
        images: [],
        tags: ['audio', 'apple', 'wireless'],
        is_active: true,
        total_quantity: 0,
        total_value: 0
      }
    ];

    // Insert products
    console.log('📦 Adding products...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .insert(sampleProducts)
      .select();

    if (productsError) {
      console.error('❌ Error adding products:', productsError);
      return;
    }

    console.log(`✅ Added ${products.length} products`);

    // Add variants with proper prices
    const variants = [
      // iPhone 15 Pro Max variants
      {
        product_id: products[0].id,
        sku: 'IPHONE15PM-256GB',
        name: '256GB Titanium',
        attributes: { color: 'titanium', storage: '256GB' },
        cost_price: 1200000,
        selling_price: 1500000,
        quantity: 15,
        min_quantity: 5,
        max_quantity: 50,
        barcode: '123456789001'
      },
      {
        product_id: products[0].id,
        sku: 'IPHONE15PM-512GB',
        name: '512GB Titanium',
        attributes: { color: 'titanium', storage: '512GB' },
        cost_price: 1400000,
        selling_price: 1750000,
        quantity: 10,
        min_quantity: 3,
        max_quantity: 30,
        barcode: '123456789002'
      },
      
      // Samsung Galaxy S24 Ultra variants
      {
        product_id: products[1].id,
        sku: 'SAMSUNG-S24U-256GB',
        name: '256GB Phantom Black',
        attributes: { color: 'phantom-black', storage: '256GB' },
        cost_price: 1100000,
        selling_price: 1350000,
        quantity: 12,
        min_quantity: 4,
        max_quantity: 40,
        barcode: '123456789003'
      },
      {
        product_id: products[1].id,
        sku: 'SAMSUNG-S24U-512GB',
        name: '512GB Phantom Black',
        attributes: { color: 'phantom-black', storage: '512GB' },
        cost_price: 1300000,
        selling_price: 1600000,
        quantity: 8,
        min_quantity: 2,
        max_quantity: 25,
        barcode: '123456789004'
      },
      
      // MacBook Air M3 variants
      {
        product_id: products[2].id,
        sku: 'MACBOOK-AIR-M3-256GB',
        name: '256GB SSD',
        attributes: { storage: '256GB', color: 'space-gray' },
        cost_price: 1800000,
        selling_price: 2200000,
        quantity: 8,
        min_quantity: 2,
        max_quantity: 20,
        barcode: '123456789005'
      },
      {
        product_id: products[2].id,
        sku: 'MACBOOK-AIR-M3-512GB',
        name: '512GB SSD',
        attributes: { storage: '512GB', color: 'space-gray' },
        cost_price: 2200000,
        selling_price: 2700000,
        quantity: 5,
        min_quantity: 1,
        max_quantity: 15,
        barcode: '123456789006'
      },
      
      // AirPods Pro variants
      {
        product_id: products[3].id,
        sku: 'AIRPODS-PRO-2',
        name: 'Standard',
        attributes: { color: 'white' },
        cost_price: 280000,
        selling_price: 350000,
        quantity: 25,
        min_quantity: 10,
        max_quantity: 100,
        barcode: '123456789007'
      }
    ];

    console.log('🔧 Adding variants with prices...');
    const { data: variantData, error: variantsError } = await supabase
      .from('lats_product_variants')
      .insert(variants)
      .select();

    if (variantsError) {
      console.error('❌ Error adding variants:', variantsError);
      return;
    }

    console.log(`✅ Added ${variantData.length} variants with proper prices`);

    // Display the results
    console.log('\n📊 Sample products with prices added:');
    products.forEach((product, index) => {
      const productVariants = variantData.filter(v => v.product_id === product.id);
      console.log(`\n${index + 1}. ${product.name}:`);
      productVariants.forEach(variant => {
        console.log(`   - ${variant.name} (${variant.sku})`);
        console.log(`     Selling Price: TZS ${variant.selling_price.toLocaleString()}`);
        console.log(`     Cost Price: TZS ${variant.cost_price.toLocaleString()}`);
        console.log(`     Stock: ${variant.quantity} units`);
      });
    });

    console.log('\n🎉 Sample products with prices added successfully!');
    console.log('🌐 Open your application and navigate to a product detail page to see the prices.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSamplePricedProducts();
