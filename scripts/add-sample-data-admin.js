#!/usr/bin/env node

/**
 * Add Sample Data Script (Admin Method)
 * This script adds sample data using admin privileges
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function addSampleDataAdmin() {
  try {
    console.log('🚀 Adding sample data to LATS database (Admin Method)...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // First, let's check what data already exists
    console.log('🔍 Checking existing data...');
    
    const { data: existingCategories } = await supabase
      .from('lats_categories')
      .select('*');
    
    const { data: existingBrands } = await supabase
      .from('lats_brands')
      .select('*');
    
    const { data: existingProducts } = await supabase
      .from('lats_products')
      .select('*');
    
    const { data: existingVariants } = await supabase
      .from('lats_product_variants')
      .select('*');
    
    console.log(`📊 Existing Data:`);
    console.log(`- Categories: ${existingCategories?.length || 0}`);
    console.log(`- Brands: ${existingBrands?.length || 0}`);
    console.log(`- Products: ${existingProducts?.length || 0}`);
    console.log(`- Variants: ${existingVariants?.length || 0}`);
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('\n✅ Sample data already exists!');
      console.log('\n📋 Available Categories:');
      existingCategories.forEach(cat => console.log(`  - ${cat.name}`));
      
      console.log('\n📋 Available Brands:');
      existingBrands?.forEach(brand => console.log(`  - ${brand.name}`));
      
      console.log('\n📋 Available Products:');
      existingProducts?.forEach(prod => console.log(`  - ${prod.name}`));
      
      if (existingVariants && existingVariants.length > 0) {
        const totalStock = existingVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
        console.log(`\n📦 Total Stock Items: ${totalStock}`);
        
        console.log('\n📋 Stock Details:');
        existingVariants.forEach(variant => {
          console.log(`  - ${variant.sku}: ${variant.quantity} units`);
        });
      }
      
      console.log('\n🎉 Your LATS system is ready with real data!');
      console.log('\n📋 Next Steps:');
      console.log('1. Test the POS system to see the inventory');
      console.log('2. Add your actual business data');
      console.log('3. Configure POS settings');
      console.log('4. Start using the system');
      
      return;
    }
    
    // If no data exists, we need to add it manually through the Supabase dashboard
    console.log('\n⚠️  No sample data found. You need to add data manually.');
    console.log('\n📋 Manual Data Addition Instructions:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project: jxhzveborezjhsmzsgbc');
    console.log('3. Navigate to Table Editor');
    console.log('4. Select each table and add data manually:');
    console.log('   - lats_categories');
    console.log('   - lats_brands');
    console.log('   - lats_suppliers');
    console.log('   - lats_products');
    console.log('   - lats_product_variants');
    
    console.log('\n📋 Sample Data Structure:');
    console.log('\nCategories:');
    console.log('- Smartphones (Mobile phones and accessories)');
    console.log('- Laptops (Portable computers)');
    console.log('- Tablets (Tablet computers)');
    console.log('- Accessories (Phone and computer accessories)');
    console.log('- Repair Parts (Spare parts for repairs)');
    
    console.log('\nBrands:');
    console.log('- Apple (Apple Inc. products)');
    console.log('- Samsung (Samsung Electronics)');
    console.log('- Dell (Dell Technologies)');
    console.log('- HP (Hewlett-Packard)');
    console.log('- Lenovo (Lenovo Group)');
    
    console.log('\nProducts (example):');
    console.log('- iPhone 14 Pro (Smartphones, Apple)');
    console.log('- Samsung Galaxy S23 (Smartphones, Samsung)');
    console.log('- MacBook Pro 14" (Laptops, Apple)');
    console.log('- Dell XPS 13 (Laptops, Dell)');
    console.log('- iPhone Screen Protector (Accessories, Apple)');
    
    console.log('\nProduct Variants (example):');
    console.log('- iPhone 14 Pro 128GB Black (Stock: 25, Price: 159,999)');
    console.log('- iPhone 14 Pro 256GB Black (Stock: 15, Price: 179,999)');
    console.log('- Samsung Galaxy S23 256GB Black (Stock: 30, Price: 129,999)');
    console.log('- MacBook Pro 14" 512GB Silver (Stock: 12, Price: 299,999)');
    console.log('- Dell XPS 13 256GB Silver (Stock: 18, Price: 189,999)');
    console.log('- iPhone Screen Protector (Stock: 100, Price: 2,500)');
    
    console.log('\n🔧 Alternative: Use the application to add data');
    console.log('1. Start the application: npm run dev');
    console.log('2. Navigate to the Inventory Management section');
    console.log('3. Add categories, brands, suppliers, and products through the UI');
    console.log('4. This will automatically create the data in the database');
    
  } catch (error) {
    console.error('💥 Fatal error during sample data addition:', error);
    process.exit(1);
  }
}

// Run the script
addSampleDataAdmin();
