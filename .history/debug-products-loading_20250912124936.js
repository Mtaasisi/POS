#!/usr/bin/env node

// Debug script to test the exact same query that the application uses
// This will help identify if there's an issue with the data provider

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

async function debugProductsLoading() {
  console.log('🔍 Debugging products loading with exact application query...\n');

  try {
    // Test the exact query used in the application
    console.log('1. Testing exact application query...');
    const { data, error, count } = await supabase
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
        lats_suppliers(id, name, contact_person, email, phone, address, website, notes, created_at, updated_at),
        lats_store_shelves!store_shelf_id(
          id,
          name,
          code,
          storage_room_id,
          shelf_type,
          row_number,
          column_number,
          floor_level,
          is_refrigerated,
          requires_ladder,
          lats_storage_rooms(
            id,
            name,
            code,
            lats_store_locations(
              id,
              name,
              city
            )
          )
        )
      `, { count: 'exact' })
      .order('name')
      .range(0, 49); // page 1, limit 50 (0-49)
    
    if (error) {
      console.error('❌ Application query failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }
    
    console.log('✅ Application query successful');
    console.log('📊 Total products in database:', count || 0);
    console.log('📊 Products returned by query:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('📋 Sample product structure:');
      const sampleProduct = data[0];
      console.log('  - ID:', sampleProduct.id);
      console.log('  - Name:', sampleProduct.name);
      console.log('  - Category:', sampleProduct.lats_categories?.name || 'No category');
      console.log('  - Supplier:', sampleProduct.lats_suppliers?.name || 'No supplier');
      console.log('  - Is Active:', sampleProduct.is_active);
      console.log('  - Total Quantity:', sampleProduct.total_quantity);
      console.log('  - Has Images:', sampleProduct.images && sampleProduct.images.length > 0);
      console.log('  - Has Shelf:', !!sampleProduct.lats_store_shelves);
    }
    console.log('');

    // Test 2: Check for products with variants
    console.log('2. Testing products with variants...');
    const { data: productsWithVariants, error: variantsError } = await supabase
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
      .limit(5);
    
    if (variantsError) {
      console.error('❌ Products with variants query failed:', variantsError);
    } else {
      console.log('✅ Products with variants query successful');
      console.log('📊 Products with variants:', productsWithVariants?.length || 0);
      
      if (productsWithVariants && productsWithVariants.length > 0) {
        const productWithVariants = productsWithVariants.find(p => p.lats_product_variants && p.lats_product_variants.length > 0);
        if (productWithVariants) {
          console.log('📋 Sample product with variants:');
          console.log('  - Product:', productWithVariants.name);
          console.log('  - Variants count:', productWithVariants.lats_product_variants.length);
          console.log('  - First variant:', productWithVariants.lats_product_variants[0]);
        } else {
          console.log('⚠️  No products found with variants');
        }
      }
    }
    console.log('');

    // Test 3: Check for active products only
    console.log('3. Testing active products only...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('lats_products')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(10);
    
    if (activeError) {
      console.error('❌ Active products query failed:', activeError);
    } else {
      console.log('✅ Active products query successful');
      console.log('📊 Active products:', activeProducts?.length || 0);
    }
    console.log('');

    // Test 4: Check for products with stock
    console.log('4. Testing products with stock...');
    const { data: productsWithStock, error: stockError } = await supabase
      .from('lats_products')
      .select('id, name, total_quantity')
      .gt('total_quantity', 0)
      .limit(10);
    
    if (stockError) {
      console.error('❌ Products with stock query failed:', stockError);
    } else {
      console.log('✅ Products with stock query successful');
      console.log('📊 Products with stock:', productsWithStock?.length || 0);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugProductsLoading().then(() => {
  console.log('\n🏁 Products loading debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
