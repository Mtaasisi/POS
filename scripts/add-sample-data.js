#!/usr/bin/env node

/**
 * Add Sample Data Script
 * This script adds sample data to test the real data connection
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

async function addSampleData() {
  try {
    console.log('🚀 Adding sample data to LATS database...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // 1. Add Categories
    console.log('📝 Adding categories...');
    const categories = [
      { name: 'Smartphones', description: 'Mobile phones and accessories', color: '#3B82F6' },
      { name: 'Laptops', description: 'Portable computers', color: '#10B981' },
      { name: 'Tablets', description: 'Tablet computers', color: '#F59E0B' },
      { name: 'Accessories', description: 'Phone and computer accessories', color: '#EF4444' },
      { name: 'Repair Parts', description: 'Spare parts for repairs', color: '#8B5CF6' }
    ];
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('lats_categories')
        .insert([category])
        .select();
      
      if (error) {
        console.log(`⚠️  Category ${category.name} might already exist: ${error.message}`);
      } else {
        console.log(`✅ Added category: ${category.name}`);
      }
    }
    
    // 2. Add Brands
    console.log('📝 Adding brands...');
    const brands = [
      { name: 'Apple', description: 'Apple Inc. products', website: 'https://apple.com' },
      { name: 'Samsung', description: 'Samsung Electronics', website: 'https://samsung.com' },
      { name: 'Dell', description: 'Dell Technologies', website: 'https://dell.com' },
      { name: 'HP', description: 'Hewlett-Packard', website: 'https://hp.com' },
      { name: 'Lenovo', description: 'Lenovo Group', website: 'https://lenovo.com' }
    ];
    
    for (const brand of brands) {
      const { data, error } = await supabase
        .from('lats_brands')
        .insert([brand])
        .select();
      
      if (error) {
        console.log(`⚠️  Brand ${brand.name} might already exist: ${error.message}`);
      } else {
        console.log(`✅ Added brand: ${brand.name}`);
      }
    }
    
    // 3. Add Suppliers
    console.log('📝 Adding suppliers...');
    const suppliers = [
      { 
        name: 'Tech Supplies Ltd', 
        contact_person: 'John Doe', 
        email: 'john@techsupplies.com', 
        phone: '+254700000000',
        address: 'Nairobi, Kenya'
      },
      { 
        name: 'Mobile World', 
        contact_person: 'Jane Smith', 
        email: 'jane@mobileworld.com', 
        phone: '+254700000001',
        address: 'Mombasa, Kenya'
      },
      { 
        name: 'Computer Hub', 
        contact_person: 'Mike Johnson', 
        email: 'mike@computerhub.com', 
        phone: '+254700000002',
        address: 'Kisumu, Kenya'
      }
    ];
    
    for (const supplier of suppliers) {
      const { data, error } = await supabase
        .from('lats_suppliers')
        .insert([supplier])
        .select();
      
      if (error) {
        console.log(`⚠️  Supplier ${supplier.name} might already exist: ${error.message}`);
      } else {
        console.log(`✅ Added supplier: ${supplier.name}`);
      }
    }
    
    // 4. Get category and brand IDs for products
    console.log('🔍 Getting category and brand IDs...');
    
    const { data: categoriesData } = await supabase
      .from('lats_categories')
      .select('id, name');
    
    const { data: brandsData } = await supabase
      .from('lats_brands')
      .select('id, name');
    
    const { data: suppliersData } = await supabase
      .from('lats_suppliers')
      .select('id, name');
    
    const smartphoneCategory = categoriesData?.find(c => c.name === 'Smartphones');
    const laptopCategory = categoriesData?.find(c => c.name === 'Laptops');
    const accessoriesCategory = categoriesData?.find(c => c.name === 'Accessories');
    
    const appleBrand = brandsData?.find(b => b.name === 'Apple');
    const samsungBrand = brandsData?.find(b => b.name === 'Samsung');
    const dellBrand = brandsData?.find(b => b.name === 'Dell');
    
    const techSupplies = suppliersData?.find(s => s.name === 'Tech Supplies Ltd');
    
    // 5. Add Products
    console.log('📝 Adding products...');
    const products = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced camera system',
        category_id: smartphoneCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        images: ['https://example.com/iphone14pro.jpg'],
        tags: ['smartphone', 'apple', '5g', 'camera'],
        is_active: true
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone',
        category_id: smartphoneCategory?.id,
        brand_id: samsungBrand?.id,
        supplier_id: techSupplies?.id,
        images: ['https://example.com/galaxys23.jpg'],
        tags: ['smartphone', 'samsung', '5g', 'android'],
        is_active: true
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop for developers and creatives',
        category_id: laptopCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        images: ['https://example.com/macbookpro14.jpg'],
        tags: ['laptop', 'apple', 'macos', 'professional'],
        is_active: true
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultra-portable Windows laptop',
        category_id: laptopCategory?.id,
        brand_id: dellBrand?.id,
        supplier_id: techSupplies?.id,
        images: ['https://example.com/dellxps13.jpg'],
        tags: ['laptop', 'dell', 'windows', 'ultrabook'],
        is_active: true
      },
      {
        name: 'iPhone Screen Protector',
        description: 'Tempered glass screen protector for iPhone',
        category_id: accessoriesCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        images: ['https://example.com/screenprotector.jpg'],
        tags: ['accessory', 'screen protector', 'protection'],
        is_active: true
      }
    ];
    
    for (const product of products) {
      const { data, error } = await supabase
        .from('lats_products')
        .insert([product])
        .select();
      
      if (error) {
        console.log(`⚠️  Product ${product.name} might already exist: ${error.message}`);
      } else {
        console.log(`✅ Added product: ${product.name}`);
      }
    }
    
    // 6. Get product IDs for variants
    console.log('🔍 Getting product IDs for variants...');
    
    const { data: productsData } = await supabase
      .from('lats_products')
      .select('id, name');
    
    const iphone14Pro = productsData?.find(p => p.name === 'iPhone 14 Pro');
    const galaxyS23 = productsData?.find(p => p.name === 'Samsung Galaxy S23');
    const macbookPro = productsData?.find(p => p.name === 'MacBook Pro 14"');
    const dellXPS = productsData?.find(p => p.name === 'Dell XPS 13');
    const screenProtector = productsData?.find(p => p.name === 'iPhone Screen Protector');
    
    // 7. Add Product Variants with Stock
    console.log('📝 Adding product variants with stock...');
    const variants = [
      {
        product_id: iphone14Pro?.id,
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
        product_id: iphone14Pro?.id,
        sku: 'IPH14P-256-BLK',
        name: '256GB Black',
        attributes: { storage: '256GB', color: 'Black' },
        cost_price: 135000,
        selling_price: 179999,
        quantity: 15,
        min_quantity: 3,
        barcode: '1234567890124'
      },
      {
        product_id: galaxyS23?.id,
        sku: 'SAMS23-256-BLK',
        name: '256GB Black',
        attributes: { storage: '256GB', color: 'Black' },
        cost_price: 95000,
        selling_price: 129999,
        quantity: 30,
        min_quantity: 8,
        barcode: '1234567890125'
      },
      {
        product_id: macbookPro?.id,
        sku: 'MBP14-512-SLV',
        name: '512GB Silver',
        attributes: { storage: '512GB', color: 'Silver' },
        cost_price: 250000,
        selling_price: 299999,
        quantity: 12,
        min_quantity: 2,
        barcode: '1234567890126'
      },
      {
        product_id: dellXPS?.id,
        sku: 'DLLXPS-256-SLV',
        name: '256GB Silver',
        attributes: { storage: '256GB', color: 'Silver' },
        cost_price: 150000,
        selling_price: 189999,
        quantity: 18,
        min_quantity: 4,
        barcode: '1234567890127'
      },
      {
        product_id: screenProtector?.id,
        sku: 'SP-IPH-GLASS',
        name: 'Tempered Glass',
        attributes: { type: 'Tempered Glass', compatibility: 'iPhone 14 Pro' },
        cost_price: 800,
        selling_price: 2500,
        quantity: 100,
        min_quantity: 20,
        barcode: '1234567890128'
      }
    ];
    
    for (const variant of variants) {
      if (variant.product_id) {
        const { data, error } = await supabase
          .from('lats_product_variants')
          .insert([variant])
          .select();
        
        if (error) {
          console.log(`⚠️  Variant ${variant.sku} might already exist: ${error.message}`);
        } else {
          console.log(`✅ Added variant: ${variant.sku} (Stock: ${variant.quantity})`);
        }
      }
    }
    
    // 8. Verify the data
    console.log('\n🔍 Verifying sample data...');
    
    const { data: finalCategories } = await supabase
      .from('lats_categories')
      .select('*');
    
    const { data: finalBrands } = await supabase
      .from('lats_brands')
      .select('*');
    
    const { data: finalProducts } = await supabase
      .from('lats_products')
      .select('*');
    
    const { data: finalVariants } = await supabase
      .from('lats_product_variants')
      .select('*');
    
    console.log(`\n📊 Sample Data Summary:`);
    console.log(`✅ Categories: ${finalCategories?.length || 0}`);
    console.log(`✅ Brands: ${finalBrands?.length || 0}`);
    console.log(`✅ Products: ${finalProducts?.length || 0}`);
    console.log(`✅ Product Variants: ${finalVariants?.length || 0}`);
    
    if (finalVariants && finalVariants.length > 0) {
      const totalStock = finalVariants.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
      console.log(`✅ Total Stock Items: ${totalStock}`);
    }
    
    console.log('\n🎉 Sample data added successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the POS system to see real inventory data');
    console.log('2. Add your actual business data');
    console.log('3. Configure POS settings');
    console.log('4. Train users on the new system');
    
  } catch (error) {
    console.error('💥 Fatal error during sample data addition:', error);
    process.exit(1);
  }
}

// Run the script
addSampleData();
