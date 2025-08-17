#!/usr/bin/env node

/**
 * Add Initial Data Script
 * This script adds initial data to test the POS system
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function addInitialData() {
  try {
    console.log('🚀 Adding initial data for POS testing...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Check if we can access the tables
    console.log('🔍 Testing table access...');
    
    const { data: categories, error: catError } = await supabase
      .from('lats_categories')
      .select('*');
    
    if (catError) {
      console.log('❌ Cannot access categories table:', catError.message);
      console.log('\n📋 You need to add data manually through the Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select project: jxhzveborezjhsmzsgbc');
      console.log('3. Go to Table Editor');
      console.log('4. Add data to these tables:');
      console.log('   - lats_categories');
      console.log('   - lats_brands');
      console.log('   - lats_suppliers');
      console.log('   - lats_products');
      console.log('   - lats_product_variants');
      
      console.log('\n📋 Sample data to add:');
      console.log('\nCategories:');
      console.log('- Smartphones');
      console.log('- Laptops');
      console.log('- Accessories');
      
      console.log('\nBrands:');
      console.log('- Apple');
      console.log('- Samsung');
      console.log('- Dell');
      
      console.log('\nProducts:');
      console.log('- iPhone 14 Pro (Category: Smartphones, Brand: Apple)');
      console.log('- Samsung Galaxy S23 (Category: Smartphones, Brand: Samsung)');
      console.log('- MacBook Pro 14" (Category: Laptops, Brand: Apple)');
      
      console.log('\nProduct Variants:');
      console.log('- iPhone 14 Pro 128GB Black (Stock: 25, Price: 159999)');
      console.log('- Samsung Galaxy S23 256GB Black (Stock: 30, Price: 129999)');
      console.log('- MacBook Pro 14" 512GB Silver (Stock: 12, Price: 299999)');
      
      return;
    }
    
    console.log('✅ Can access database tables');
    console.log(`📊 Current categories: ${categories?.length || 0}`);
    
    if (categories && categories.length > 0) {
      console.log('\n✅ Data already exists!');
      console.log('\n📋 Available categories:');
      categories.forEach(cat => console.log(`  - ${cat.name}`));
      
      // Check products
      const { data: products } = await supabase
        .from('lats_products')
        .select('*');
      
      console.log(`📊 Current products: ${products?.length || 0}`);
      
      if (products && products.length > 0) {
        console.log('\n📋 Available products:');
        products.forEach(prod => console.log(`  - ${prod.name}`));
        
        // Check variants
        const { data: variants } = await supabase
          .from('lats_product_variants')
          .select('*');
        
        console.log(`📊 Current variants: ${variants?.length || 0}`);
        
        if (variants && variants.length > 0) {
          console.log('\n📋 Available variants with stock:');
          variants.forEach(variant => {
            console.log(`  - ${variant.sku}: ${variant.quantity} units (KES ${variant.selling_price})`);
          });
          
          console.log('\n🎉 Your POS system is ready with data!');
          console.log('\n📋 Next steps:');
          console.log('1. Open your application in the browser');
          console.log('2. Navigate to the POS section');
          console.log('3. Search for products to see them in the POS');
          console.log('4. Test adding items to cart and processing sales');
        }
      }
    } else {
      console.log('\n⚠️  No data found. You need to add data manually.');
      console.log('\n📋 Quick setup instructions:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select project: jxhzveborezjhsmzsgbc');
      console.log('3. Go to Table Editor');
      console.log('4. Add at least one category, brand, product, and variant');
      console.log('5. Refresh your application and test the POS');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the script
addInitialData();
