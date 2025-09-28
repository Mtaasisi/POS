#!/usr/bin/env node

// Test script to verify products loading
// This will help identify if products are being loaded properly

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

async function testProductsLoading() {
  console.log('🔍 Testing products loading...\n');

  try {
    // Test 1: Check if lats_products table exists and has data
    console.log('1. Testing lats_products table...');
    const { data: productsData, error: productsError, count } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products table test failed:', productsError);
      return;
    }
    
    console.log('✅ Products table test successful');
    console.log('📊 Total products in database:', count || 0);
    console.log('📊 Sample products:', productsData?.length || 0);
    
    if (productsData && productsData.length > 0) {
      console.log('📋 Sample product structure:', Object.keys(productsData[0]).join(', '));
    }
    console.log('');

    // Test 2: Check product variants
    console.log('2. Testing product variants...');
    const { data: variantsData, error: variantsError, count: variantsCount } = await supabase
      .from('lats_product_variants')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (variantsError) {
      console.error('❌ Product variants test failed:', variantsError);
    } else {
      console.log('✅ Product variants test successful');
      console.log('📊 Total variants in database:', variantsCount || 0);
      console.log('📊 Sample variants:', variantsData?.length || 0);
    }
    console.log('');

    // Test 3: Test the complex products query used in the app
    console.log('3. Testing complex products query...');
    const { data: complexData, error: complexError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        description,
        category_id,
        supplier_id,
        images,
        tags,
        internal_notes,
        is_active,
        total_quantity,
        total_value,
        condition,
        store_shelf_id,
        attributes,
        created_at,
        updated_at,
        lats_categories(id, name, description, color, created_at, updated_at),
        lats_suppliers(id, name, contact_person, email, phone, address, website, notes, created_at, updated_at)
      `)
      .limit(3);
    
    if (complexError) {
      console.error('❌ Complex products query test failed:', complexError);
      console.error('Error details:', {
        message: complexError.message,
        details: complexError.details,
        hint: complexError.hint,
        code: complexError.code
      });
    } else {
      console.log('✅ Complex products query test successful');
      console.log('📊 Complex query results:', complexData?.length || 0);
      if (complexData && complexData.length > 0) {
        console.log('📋 Sample complex product:', JSON.stringify(complexData[0], null, 2));
      }
    }
    console.log('');

    // Test 4: Check if there are any products with variants
    console.log('4. Testing products with variants...');
    const { data: productsWithVariants, error: variantsError2 } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        lats_product_variants(
          id,
          name,
          quantity,
          cost_price,
          selling_price,
          min_quantity
        )
      `)
      .limit(3);
    
    if (variantsError2) {
      console.error('❌ Products with variants test failed:', variantsError2);
    } else {
      console.log('✅ Products with variants test successful');
      console.log('📊 Products with variants:', productsWithVariants?.length || 0);
      if (productsWithVariants && productsWithVariants.length > 0) {
        const productWithVariants = productsWithVariants.find(p => p.lats_product_variants && p.lats_product_variants.length > 0);
        if (productWithVariants) {
          console.log('📋 Sample product with variants:', JSON.stringify(productWithVariants, null, 2));
        } else {
          console.log('⚠️  No products found with variants');
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testProductsLoading().then(() => {
  console.log('\n🏁 Products loading test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
