import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleData() {
  console.log('🚀 Adding sample LATS data...');
  
  try {
    // Add sample categories
    console.log('\n📂 Adding categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .insert([
        { name: 'Smartphones', description: 'Mobile phones and smartphones', color: '#3B82F6' },
        { name: 'Laptops', description: 'Portable computers and laptops', color: '#10B981' },
        { name: 'Accessories', description: 'Device accessories and peripherals', color: '#F59E0B' },
        { name: 'Wearables', description: 'Smartwatches and fitness trackers', color: '#8B5CF6' },
        { name: 'Tablets', description: 'Tablet computers and iPads', color: '#EF4444' },
        { name: 'Parts', description: 'Replacement parts and components', color: '#6B7280' },
        { name: 'Services', description: 'Repair and maintenance services', color: '#EC4899' }
      ])
      .select();

    if (categoriesError) {
      console.error('❌ Error adding categories:', categoriesError);
    } else {
      console.log('✅ Categories added:', categories?.length || 0);
    }

    // Add sample brands
    console.log('\n🏷️ Adding brands...');
    const { data: brands, error: brandsError } = await supabase
      .from('lats_brands')
      .insert([
        { name: 'Apple', description: 'Apple Inc. products', website: 'https://apple.com' },
        { name: 'Samsung', description: 'Samsung Electronics', website: 'https://samsung.com' },
        { name: 'Dell', description: 'Dell Technologies', website: 'https://dell.com' },
        { name: 'Logitech', description: 'Logitech International', website: 'https://logitech.com' },
        { name: 'Generic', description: 'Generic and third-party products', website: 'https://generic.com' },
        { name: 'Premium', description: 'Premium quality products', website: 'https://premium.com' }
      ])
      .select();

    if (brandsError) {
      console.error('❌ Error adding brands:', brandsError);
    } else {
      console.log('✅ Brands added:', brands?.length || 0);
    }

    // Add sample suppliers
    console.log('\n🏢 Adding suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .insert([
        { name: 'Apple Inc.', contact_person: 'Tim Cook', email: 'tim@apple.com', phone: '+1234567890', address: 'Cupertino, CA' },
        { name: 'Samsung Electronics', contact_person: 'Kim Hyun-suk', email: 'kim@samsung.com', phone: '+0987654321', address: 'Seoul, South Korea' },
        { name: 'Dell Technologies', contact_person: 'Michael Dell', email: 'michael@dell.com', phone: '+1122334455', address: 'Round Rock, TX' },
        { name: 'Logitech', contact_person: 'Bracken Darrell', email: 'bracken@logitech.com', phone: '+1555666777', address: 'Lausanne, Switzerland' },
        { name: 'Tech Supplies Ltd', contact_person: 'John Doe', email: 'john@techsupplies.com', phone: '+254700000000', address: 'Nairobi, Kenya' },
        { name: 'Local Vendor', contact_person: 'Jane Smith', email: 'jane@vendor.com', phone: '+254711111111', address: 'Mombasa, Kenya' }
      ])
      .select();

    if (suppliersError) {
      console.error('❌ Error adding suppliers:', suppliersError);
    } else {
      console.log('✅ Suppliers added:', suppliers?.length || 0);
    }

    // Get the IDs for relationships
    const { data: categoryData } = await supabase.from('lats_categories').select('id, name');
    const { data: brandData } = await supabase.from('lats_brands').select('id, name');
    const { data: supplierData } = await supabase.from('lats_suppliers').select('id, name');

    const categoryList = categoryData || [];
    const brandList = brandData || [];
    const supplierList = supplierData || [];

    // Helper function to get ID by name
    const getCategoryId = (name) => categoryList.find(c => c.name === name)?.id;
    const getBrandId = (name) => brandList.find(b => b.name === name)?.id;
    const getSupplierId = (name) => supplierList.find(s => s.name === name)?.id;

    // Add sample products
    console.log('\n📦 Adding products...');
    const products = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced camera system and A16 Bionic chip',
        category_id: getCategoryId('Smartphones'),
        brand_id: getBrandId('Apple'),
        supplier_id: getSupplierId('Apple Inc.'),
        images: ['📱'],
        tags: ['smartphone', 'apple', 'camera', 'premium', 'featured'],
        is_active: true,
        total_quantity: 40,
        total_value: 6400000.00
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Flagship Android smartphone with S Pen support',
        category_id: getCategoryId('Smartphones'),
        brand_id: getBrandId('Samsung'),
        supplier_id: getSupplierId('Samsung Electronics'),
        images: ['📱'],
        tags: ['smartphone', 'samsung', 'android', 's-pen'],
        is_active: true,
        total_quantity: 30,
        total_value: 3900000.00
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip and Liquid Retina display',
        category_id: getCategoryId('Laptops'),
        brand_id: getBrandId('Apple'),
        supplier_id: getSupplierId('Apple Inc.'),
        images: ['💻'],
        tags: ['laptop', 'apple', 'professional', 'm2', 'featured'],
        is_active: true,
        total_quantity: 12,
        total_value: 3600000.00
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook with InfinityEdge display and Intel processor',
        category_id: getCategoryId('Laptops'),
        brand_id: getBrandId('Dell'),
        supplier_id: getSupplierId('Dell Technologies'),
        images: ['💻'],
        tags: ['laptop', 'dell', 'ultrabook', 'intel'],
        is_active: true,
        total_quantity: 18,
        total_value: 3420000.00
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        category_id: getCategoryId('Accessories'),
        brand_id: getBrandId('Apple'),
        supplier_id: getSupplierId('Apple Inc.'),
        images: ['🎧'],
        tags: ['earbuds', 'apple', 'wireless', 'noise-cancellation', 'featured'],
        is_active: true,
        total_quantity: 25,
        total_value: 1150000.00
      },
      {
        name: 'Samsung Galaxy Watch',
        description: 'Smartwatch with health monitoring and fitness tracking',
        category_id: getCategoryId('Wearables'),
        brand_id: getBrandId('Samsung'),
        supplier_id: getSupplierId('Samsung Electronics'),
        images: ['⌚'],
        tags: ['smartwatch', 'samsung', 'health', 'fitness'],
        is_active: true,
        total_quantity: 18,
        total_value: 648000.00
      },
      {
        name: 'iPad Air',
        description: 'Lightweight tablet with M1 chip and all-day battery life',
        category_id: getCategoryId('Tablets'),
        brand_id: getBrandId('Apple'),
        supplier_id: getSupplierId('Apple Inc.'),
        images: ['📱'],
        tags: ['tablet', 'apple', 'm1', 'portable'],
        is_active: true,
        total_quantity: 20,
        total_value: 1800000.00
      },
      {
        name: 'Logitech MX Master 3',
        description: 'Premium wireless mouse with ergonomic design',
        category_id: getCategoryId('Accessories'),
        brand_id: getBrandId('Logitech'),
        supplier_id: getSupplierId('Logitech'),
        images: ['🖱️'],
        tags: ['mouse', 'logitech', 'wireless', 'ergonomic'],
        is_active: true,
        total_quantity: 30,
        total_value: 390000.00
      }
    ];

    const { data: productData, error: productsError } = await supabase
      .from('lats_products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('❌ Error adding products:', productsError);
    } else {
      console.log('✅ Products added:', productData?.length || 0);
    }

    // Add product variants
    console.log('\n🔧 Adding product variants...');
    if (productData && productData.length > 0) {
      const variants = [];
      
      productData.forEach(product => {
        // Add main variant for each product
        variants.push({
          product_id: product.id,
          sku: `${product.name.replace(/\s+/g, '').toUpperCase()}-001`,
          name: 'Standard',
          attributes: { color: 'black', size: 'standard' },
          cost_price: Math.round(product.total_value / product.total_quantity * 0.7), // 70% of selling price
          selling_price: Math.round(product.total_value / product.total_quantity),
          quantity: product.total_quantity,
          min_quantity: 5,
          max_quantity: 100,
          barcode: `123456789${product.id.slice(-3)}`
        });
      });

      const { data: variantData, error: variantsError } = await supabase
        .from('lats_product_variants')
        .insert(variants)
        .select();

      if (variantsError) {
        console.error('❌ Error adding variants:', variantsError);
      } else {
        console.log('✅ Variants added:', variantData?.length || 0);
      }
    }

    console.log('\n🎉 Sample data added successfully!');
    
    // Verify the data
    console.log('\n🔍 Verifying data...');
    const { data: finalProducts } = await supabase.from('lats_products').select('*');
    const { data: finalCategories } = await supabase.from('lats_categories').select('*');
    const { data: finalBrands } = await supabase.from('lats_brands').select('*');
    const { data: finalSuppliers } = await supabase.from('lats_suppliers').select('*');
    const { data: finalVariants } = await supabase.from('lats_product_variants').select('*');

    console.log(`📊 Final counts:`);
    console.log(`   Products: ${finalProducts?.length || 0}`);
    console.log(`   Categories: ${finalCategories?.length || 0}`);
    console.log(`   Brands: ${finalBrands?.length || 0}`);
    console.log(`   Suppliers: ${finalSuppliers?.length || 0}`);
    console.log(`   Variants: ${finalVariants?.length || 0}`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

addSampleData();
