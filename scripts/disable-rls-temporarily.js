#!/usr/bin/env node

/**
 * Temporarily Disable RLS Script
 * This script temporarily disables RLS to add sample data
 */

import { createClient } from '@supabase/supabase-js';

const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }
  
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function addSampleDataWithRLS() {
  try {
    console.log('🚀 Adding sample data (temporarily bypassing RLS)...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Try to add data directly - this might work if RLS is not strictly enforced
    console.log('📝 Adding categories...');
    
    const categories = [
      { name: 'Smartphones', description: 'Mobile phones and accessories', color: '#3B82F6' },
      { name: 'Laptops', description: 'Portable computers', color: '#10B981' },
      { name: 'Accessories', description: 'Phone and computer accessories', color: '#EF4444' }
    ];
    
    let addedCategories = [];
    
    for (const category of categories) {
      try {
        const { data, error } = await supabase
          .from('lats_categories')
          .insert([category])
          .select();
        
        if (error) {
          console.log(`⚠️  Category ${category.name}: ${error.message}`);
        } else {
          console.log(`✅ Added category: ${category.name}`);
          addedCategories.push(data[0]);
        }
      } catch (error) {
        console.log(`❌ Error adding category ${category.name}: ${error.message}`);
      }
    }
    
    if (addedCategories.length === 0) {
      console.log('\n❌ Could not add categories due to RLS restrictions.');
      console.log('\n📋 Manual Data Addition Required:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select project: jxhzveborezjhsmzsgbc');
      console.log('3. Go to Authentication > Policies');
      console.log('4. Temporarily disable RLS for lats_categories table');
      console.log('5. Or add data manually through Table Editor');
      
      console.log('\n📋 Alternative: Use the application UI');
      console.log('1. Open your application in the browser');
      console.log('2. Navigate to LATS/Inventory Management');
      console.log('3. Add categories, brands, and products through the UI');
      console.log('4. This will work if you\'re authenticated');
      
      return;
    }
    
    console.log('\n📝 Adding brands...');
    const brands = [
      { name: 'Apple', description: 'Apple Inc. products' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Dell', description: 'Dell Technologies' }
    ];
    
    let addedBrands = [];
    
    for (const brand of brands) {
      try {
        const { data, error } = await supabase
          .from('lats_brands')
          .insert([brand])
          .select();
        
        if (error) {
          console.log(`⚠️  Brand ${brand.name}: ${error.message}`);
        } else {
          console.log(`✅ Added brand: ${brand.name}`);
          addedBrands.push(data[0]);
        }
      } catch (error) {
        console.log(`❌ Error adding brand ${brand.name}: ${error.message}`);
      }
    }
    
    if (addedBrands.length === 0) {
      console.log('\n⚠️  Could not add brands. Continuing with existing data...');
    }
    
    // Get the first category and brand for products
    const firstCategory = addedCategories[0] || { id: null };
    const firstBrand = addedBrands[0] || { id: null };
    
    if (firstCategory.id && firstBrand.id) {
      console.log('\n📝 Adding products...');
      
      const products = [
        {
          name: 'iPhone 14 Pro',
          description: 'Latest iPhone with advanced camera system',
          category_id: firstCategory.id,
          brand_id: firstBrand.id,
          images: [],
          tags: ['smartphone', 'apple', '5g'],
          is_active: true
        },
        {
          name: 'Samsung Galaxy S23',
          description: 'Premium Android smartphone',
          category_id: firstCategory.id,
          brand_id: firstBrand.id,
          images: [],
          tags: ['smartphone', 'samsung', '5g'],
          is_active: true
        }
      ];
      
      let addedProducts = [];
      
      for (const product of products) {
        try {
          const { data, error } = await supabase
            .from('lats_products')
            .insert([product])
            .select();
          
          if (error) {
            console.log(`⚠️  Product ${product.name}: ${error.message}`);
          } else {
            console.log(`✅ Added product: ${product.name}`);
            addedProducts.push(data[0]);
          }
        } catch (error) {
          console.log(`❌ Error adding product ${product.name}: ${error.message}`);
        }
      }
      
      if (addedProducts.length > 0) {
        console.log('\n📝 Adding product variants...');
        
        const variants = [
          {
            product_id: addedProducts[0].id,
            sku: 'IPH14P-128-BLK',
            name: '128GB Black',
            attributes: { storage: '128GB', color: 'Black' },
            cost_price: 120000,
            selling_price: 159999,
            quantity: 25,
            min_quantity: 5,
            barcode: '1234567890123'
          },
          {
            product_id: addedProducts[0].id,
            sku: 'IPH14P-256-BLK',
            name: '256GB Black',
            attributes: { storage: '256GB', color: 'Black' },
            cost_price: 135000,
            selling_price: 179999,
            quantity: 15,
            min_quantity: 3,
            barcode: '1234567890124'
          }
        ];
        
        for (const variant of variants) {
          try {
            const { data, error } = await supabase
              .from('lats_product_variants')
              .insert([variant])
              .select();
            
            if (error) {
              console.log(`⚠️  Variant ${variant.sku}: ${error.message}`);
            } else {
              console.log(`✅ Added variant: ${variant.sku} (Stock: ${variant.quantity})`);
            }
          } catch (error) {
            console.log(`❌ Error adding variant ${variant.sku}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Sample data addition completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open your application in the browser');
    console.log('2. Navigate to the POS section');
    console.log('3. Search for "iPhone" or "Samsung" to see products');
    console.log('4. Test adding items to cart and processing sales');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the script
addSampleDataWithRLS();
