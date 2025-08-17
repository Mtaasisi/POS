import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzE5NzQsImV4cCI6MjA1MTU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLatsDataFetching() {
  console.log('🔍 Verifying LATS Data Fetching from Database Tables...\n');

  try {
    // Test Categories
    console.log('📂 Testing Categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.error('❌ Categories Error:', categoriesError);
    } else {
      console.log(`✅ Categories: ${categories?.length || 0} records found`);
      if (categories && categories.length > 0) {
        console.log('   Sample category:', categories[0]);
      }
    }

    // Test Brands
    console.log('\n🏷️ Testing Brands table...');
    const { data: brands, error: brandsError } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(5);

    if (brandsError) {
      console.error('❌ Brands Error:', brandsError);
    } else {
      console.log(`✅ Brands: ${brands?.length || 0} records found`);
      if (brands && brands.length > 0) {
        console.log('   Sample brand:', brands[0]);
      }
    }

    // Test Suppliers
    console.log('\n🏢 Testing Suppliers table...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .limit(5);

    if (suppliersError) {
      console.error('❌ Suppliers Error:', suppliersError);
    } else {
      console.log(`✅ Suppliers: ${suppliers?.length || 0} records found`);
      if (suppliers && suppliers.length > 0) {
        console.log('   Sample supplier:', suppliers[0]);
      }
    }

    // Test Products with relationships
    console.log('\n📦 Testing Products table with relationships...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_brands(name),
        lats_suppliers(name),
        lats_product_variants(*)
      `)
      .limit(5);

    if (productsError) {
      console.error('❌ Products Error:', productsError);
    } else {
      console.log(`✅ Products: ${products?.length || 0} records found`);
      if (products && products.length > 0) {
        console.log('   Sample product:', {
          id: products[0].id,
          name: products[0].name,
          category: products[0].lats_categories?.name,
          brand: products[0].lats_brands?.name,
          supplier: products[0].lats_suppliers?.name,
          variants: products[0].lats_product_variants?.length || 0
        });
      }
    }

    // Test Product Variants
    console.log('\n🔧 Testing Product Variants table...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(5);

    if (variantsError) {
      console.error('❌ Product Variants Error:', variantsError);
    } else {
      console.log(`✅ Product Variants: ${variants?.length || 0} records found`);
      if (variants && variants.length > 0) {
        console.log('   Sample variant:', {
          id: variants[0].id,
          sku: variants[0].sku,
          name: variants[0].name,
          selling_price: variants[0].selling_price,
          quantity: variants[0].quantity
        });
      }
    }

    // Test Stock Movements
    console.log('\n📊 Testing Stock Movements table...');
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('*')
      .limit(5);

    if (stockError) {
      console.error('❌ Stock Movements Error:', stockError);
    } else {
      console.log(`✅ Stock Movements: ${stockMovements?.length || 0} records found`);
      if (stockMovements && stockMovements.length > 0) {
        console.log('   Sample stock movement:', {
          id: stockMovements[0].id,
          type: stockMovements[0].type,
          quantity: stockMovements[0].quantity,
          reason: stockMovements[0].reason
        });
      }
    }

    // Summary
    console.log('\n📈 Summary:');
    console.log(`   Categories: ${categories?.length || 0}`);
    console.log(`   Brands: ${brands?.length || 0}`);
    console.log(`   Suppliers: ${suppliers?.length || 0}`);
    console.log(`   Products: ${products?.length || 0}`);
    console.log(`   Product Variants: ${variants?.length || 0}`);
    console.log(`   Stock Movements: ${stockMovements?.length || 0}`);

    console.log('\n✅ LATS Data Fetching Verification Complete!');
    console.log('🎯 The POS and Product Inventory should now fetch from these LATS database tables.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyLatsDataFetching();
