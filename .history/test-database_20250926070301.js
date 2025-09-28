#!/usr/bin/env node

// Simple script to test database connectivity and check table structure
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing database connectivity and structure...');
  
  try {
    // Test 1: Check if lats_sales table exists and has data
    console.log('\n📊 Testing lats_sales table...');
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, created_at')
      .limit(5);
    
    if (salesError) {
      console.log('❌ lats_sales error:', salesError.message);
    } else {
      console.log('✅ lats_sales table accessible, found', salesData?.length || 0, 'records');
    }

    // Test 2: Check if lats_sale_items table exists
    console.log('\n📋 Testing lats_sale_items table...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('id, sale_id, product_id')
      .limit(5);
    
    if (itemsError) {
      console.log('❌ lats_sale_items error:', itemsError.message);
    } else {
      console.log('✅ lats_sale_items table accessible, found', itemsData?.length || 0, 'records');
    }

    // Test 3: Check if lats_products table exists
    console.log('\n🏷️  Testing lats_products table...');
    const { data: productsData, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, description')
      .limit(5);
    
    if (productsError) {
      console.log('❌ lats_products error:', productsError.message);
    } else {
      console.log('✅ lats_products table accessible, found', productsData?.length || 0, 'records');
    }

    // Test 4: Check if lats_product_variants table exists
    console.log('\n🔧 Testing lats_product_variants table...');
    const { data: variantsData, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, name, sku, attributes')
      .limit(5);
    
    if (variantsError) {
      console.log('❌ lats_product_variants error:', variantsError.message);
    } else {
      console.log('✅ lats_product_variants table accessible, found', variantsData?.length || 0, 'records');
    }

    // Test 5: Test the exact failing query
    console.log('\n🧪 Testing the exact failing query...');
    const { data: complexData, error: complexError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (complexError) {
      console.log('❌ Complex query error:', complexError.message);
      console.log('🔍 Error details:', complexError);
    } else {
      console.log('✅ Complex query successful! Found', complexData?.length || 0, 'records');
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

// Run the test
testDatabase();
