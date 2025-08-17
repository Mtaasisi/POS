import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSaleItems() {
  console.log('🛒 Adding Sale Items to Existing Sales...\n');

  try {
    // First, let's check if we have any products
    console.log('📦 Checking for products...');
    let { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(5);

    if (productsError || !products || products.length === 0) {
      console.log('⚠️ No products found, creating sample products...');
      
      // Create sample categories first
      const { data: categories, error: categoriesError } = await supabase
        .from('lats_categories')
        .insert([
          { name: 'Smartphones', description: 'Mobile phones' },
          { name: 'Accessories', description: 'Device accessories' }
        ])
        .select();

      if (categoriesError) {
        console.error('❌ Error creating categories:', categoriesError);
        return;
      }

      // Create sample brands
      const { data: brands, error: brandsError } = await supabase
        .from('lats_brands')
        .insert([
          { name: 'Apple', description: 'Apple Inc.' },
          { name: 'Generic', description: 'Generic brand' }
        ])
        .select();

      if (brandsError) {
        console.error('❌ Error creating brands:', brandsError);
        return;
      }

      // Create sample products
      const { data: newProducts, error: newProductsError } = await supabase
        .from('lats_products')
        .insert([
          {
            name: 'iPhone 14 Pro',
            description: 'Latest iPhone model',
            category_id: categories[0].id,
            brand_id: brands[0].id,
            is_active: true
          },
          {
            name: 'AirPods Pro',
            description: 'Wireless earbuds',
            category_id: categories[1].id,
            brand_id: brands[0].id,
            is_active: true
          },
          {
            name: 'Phone Case',
            description: 'Protective phone case',
            category_id: categories[1].id,
            brand_id: brands[1].id,
            is_active: true
          }
        ])
        .select();

      if (newProductsError) {
        console.error('❌ Error creating products:', newProductsError);
        return;
      }

      products = newProducts;
      console.log('✅ Created sample products');
    }

    console.log(`✅ Found ${products.length} products`);

    // Create product variants
    console.log('📦 Creating product variants...');
    const variants = [];
    for (const product of products) {
      const { data: variant, error: variantError } = await supabase
        .from('lats_product_variants')
        .insert({
          product_id: product.id,
          sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-V1`,
          name: `${product.name} - Standard`,
          cost_price: Math.floor(Math.random() * 30000) + 10000,
          selling_price: Math.floor(Math.random() * 80000) + 40000,
          quantity: Math.floor(Math.random() * 50) + 10
        })
        .select()
        .single();

      if (variantError) {
        console.error(`❌ Error creating variant for ${product.name}:`, variantError);
        continue;
      }

      variants.push(variant);
    }

    console.log(`✅ Created ${variants.length} product variants`);

    // Get existing sales
    console.log('💰 Getting existing sales...');
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, total_amount')
      .limit(10);

    if (salesError) {
      console.error('❌ Error fetching sales:', salesError);
      return;
    }

    console.log(`✅ Found ${sales.length} sales`);

    // Add sale items to each sale
    console.log('🛒 Adding sale items...');
    let itemsAdded = 0;

    for (const sale of sales) {
      // Add 1-3 items per sale
      const numItems = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numItems; i++) {
        const variant = variants[Math.floor(Math.random() * variants.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const price = variant.selling_price;
        const totalPrice = price * quantity;

        const { error: itemError } = await supabase
          .from('lats_sale_items')
          .insert({
            sale_id: sale.id,
            product_id: variant.product_id,
            variant_id: variant.id,
            quantity: quantity,
            total_price: totalPrice
          });

        if (itemError) {
          console.error('❌ Error creating sale item:', itemError);
        } else {
          itemsAdded++;
        }
      }
    }

    console.log(`✅ Added ${itemsAdded} sale items to ${sales.length} sales`);
    console.log('\n🎉 Sale items added successfully!');
    console.log('\n📊 The Sales Analytics page should now show real data.');
    console.log('📍 Navigate to: /lats/sales-analytics');

  } catch (error) {
    console.error('❌ Error adding sale items:', error);
  }
}

addSaleItems();
