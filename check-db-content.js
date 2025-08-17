import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseContent() {
  console.log('🔍 Checking database content...');
  
  try {
    // Check suppliers
    console.log('\n1. Checking suppliers...');
    const { data: suppliers, error: supplierError } = await supabase
      .from('lats_suppliers')
      .select('*');
    
    if (supplierError) {
      console.error('❌ Error querying suppliers:', supplierError);
    } else {
      console.log(`✅ Found ${suppliers.length} suppliers`);
      if (suppliers.length > 0) {
        console.log('Sample supplier:', suppliers[0]);
      }
    }

    // Check categories
    console.log('\n2. Checking categories...');
    const { data: categories, error: categoryError } = await supabase
      .from('lats_categories')
      .select('*');
    
    if (categoryError) {
      console.error('❌ Error querying categories:', categoryError);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
      if (categories.length > 0) {
        console.log('Sample category:', categories[0]);
      }
    }

    // Check products
    console.log('\n3. Checking products...');
    const { data: products, error: productError } = await supabase
      .from('lats_products')
      .select('*');
    
    if (productError) {
      console.error('❌ Error querying products:', productError);
    } else {
      console.log(`✅ Found ${products.length} products`);
      if (products.length > 0) {
        console.log('Sample product:', products[0]);
      }
    }

    // Check purchase orders
    console.log('\n4. Checking purchase orders...');
    const { data: orders, error: orderError } = await supabase
      .from('lats_purchase_orders')
      .select('*');
    
    if (orderError) {
      console.error('❌ Error querying purchase orders:', orderError);
    } else {
      console.log(`✅ Found ${orders.length} purchase orders`);
      if (orders.length > 0) {
        console.log('Sample order:', orders[0]);
      }
    }

    // Check purchase order items
    console.log('\n5. Checking purchase order items...');
    const { data: items, error: itemError } = await supabase
      .from('lats_purchase_order_items')
      .select('*');
    
    if (itemError) {
      console.error('❌ Error querying purchase order items:', itemError);
    } else {
      console.log(`✅ Found ${items.length} purchase order items`);
      if (items.length > 0) {
        console.log('Sample item:', items[0]);
      }
    }

    console.log('\n🎉 Database content check completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseContent();
