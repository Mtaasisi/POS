#!/usr/bin/env node

// Test Products Query to Debug 400 Error
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testing products query to debug 400 error...');

async function testProductsQuery() {
  try {
    // Test 1: Simple products query without joins
    console.log('\n📋 Test 1: Simple products query...');
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (simpleError) {
      console.log('❌ Simple products query failed:', simpleError.message);
    } else {
      console.log('✅ Simple products query works');
      console.log('📊 Found', simpleProducts?.length || 0, 'products');
    }
    
    // Test 2: Products with category join
    console.log('\n📋 Test 2: Products with category join...');
    const { data: productsWithCategory, error: categoryError } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*)
      `)
      .limit(1);
    
    if (categoryError) {
      console.log('❌ Products with category join failed:', categoryError.message);
    } else {
      console.log('✅ Products with category join works');
    }
    
    // Test 3: Products with supplier join
    console.log('\n📋 Test 3: Products with supplier join...');
    const { data: productsWithSupplier, error: supplierError } = await supabase
      .from('products')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .limit(1);
    
    if (supplierError) {
      console.log('❌ Products with supplier join failed:', supplierError.message);
    } else {
      console.log('✅ Products with supplier join works');
    }
    
    // Test 4: Products with variants join
    console.log('\n📋 Test 4: Products with variants join...');
    const { data: productsWithVariants, error: variantsError } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .limit(1);
    
    if (variantsError) {
      console.log('❌ Products with variants join failed:', variantsError.message);
    } else {
      console.log('✅ Products with variants join works');
    }
    
    // Test 5: Full query (the one causing the 400 error)
    console.log('\n📋 Test 5: Full query (the problematic one)...');
    const { data: fullProducts, error: fullError } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        supplier:suppliers(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name');
    
    if (fullError) {
      console.log('❌ Full products query failed:', fullError.message);
      console.log('🔍 Error details:', fullError);
    } else {
      console.log('✅ Full products query works');
      console.log('📊 Found', fullProducts?.length || 0, 'products');
    }
    
    console.log('\n🎯 Summary:');
    console.log('- If Test 1 fails: products table has issues');
    console.log('- If Test 2 fails: inventory_categories relationship issue');
    console.log('- If Test 3 fails: suppliers relationship issue');
    console.log('- If Test 4 fails: product_variants relationship issue');
    console.log('- If Test 5 fails: combination of issues');
    
  } catch (error) {
    console.error('❌ Error testing products query:', error);
  }
}

// Run the test
testProductsQuery(); 