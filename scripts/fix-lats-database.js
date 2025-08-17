import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLatsDatabase() {
  console.log('🔧 Fixing LATS Database...\n');
  
  try {
    // Step 1: Add categories
    console.log('📂 Step 1: Adding categories...');
    
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
      if (categoriesError.code === '23505') { // Unique constraint violation
        console.log('ℹ️  Categories already exist, skipping...');
        const { data: existingCategories } = await supabase
          .from('lats_categories')
          .select('*');
        categories = existingCategories;
      } else {
        console.error('❌ Error adding categories:', categoriesError);
        return;
      }
    } else {
      console.log(`✅ Added ${categories.length} categories`);
    }
    
    // Step 2: Add brands
    console.log('\n🏷️  Step 2: Adding brands...');
    
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
      if (brandsError.code === '23505') { // Unique constraint violation
        console.log('ℹ️  Brands already exist, skipping...');
        const { data: existingBrands } = await supabase
          .from('lats_brands')
          .select('*');
        brands = existingBrands;
      } else {
        console.error('❌ Error adding brands:', brandsError);
        return;
      }
    } else {
      console.log(`✅ Added ${brands.length} brands`);
    }
    
    // Step 3: Add suppliers
    console.log('\n🏢 Step 3: Adding suppliers...');
    
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
      if (suppliersError.code === '23505') { // Unique constraint violation
        console.log('ℹ️  Suppliers already exist, skipping...');
        const { data: existingSuppliers } = await supabase
          .from('lats_suppliers')
          .select('*');
        suppliers = existingSuppliers;
      } else {
        console.error('❌ Error adding suppliers:', suppliersError);
        return;
      }
    } else {
      console.log(`✅ Added ${suppliers.length} suppliers`);
    }
    
    // Step 4: Add sample products
    console.log('\n📦 Step 4: Adding sample products...');
    
    const sampleProducts = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced camera system and A16 Bionic chip',
        category_id: categories.find(c => c.name === 'Smartphones')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        supplier_id: suppliers.find(s => s.name === 'Apple Inc.')?.id,
        images: ['📱'],
        tags: ['smartphone', 'apple', 'camera', 'premium', 'featured'],
        is_active: true,
        total_quantity: 40,
        total_value: 6400000.00
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Flagship Android smartphone with S Pen support',
        category_id: categories.find(c => c.name === 'Smartphones')?.id,
        brand_id: brands.find(b => b.name === 'Samsung')?.id,
        supplier_id: suppliers.find(s => s.name === 'Samsung Electronics')?.id,
        images: ['📱'],
        tags: ['smartphone', 'samsung', 'android', 's-pen'],
        is_active: true,
        total_quantity: 30,
        total_value: 3900000.00
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip and Liquid Retina display',
        category_id: categories.find(c => c.name === 'Laptops')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        supplier_id: suppliers.find(s => s.name === 'Apple Inc.')?.id,
        images: ['💻'],
        tags: ['laptop', 'apple', 'professional', 'm2', 'featured'],
        is_active: true,
        total_quantity: 12,
        total_value: 3600000.00
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook with InfinityEdge display and Intel processor',
        category_id: categories.find(c => c.name === 'Laptops')?.id,
        brand_id: brands.find(b => b.name === 'Dell')?.id,
        supplier_id: suppliers.find(s => s.name === 'Dell Technologies')?.id,
        images: ['💻'],
        tags: ['laptop', 'dell', 'ultrabook', 'intel'],
        is_active: true,
        total_quantity: 18,
        total_value: 3420000.00
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        category_id: categories.find(c => c.name === 'Accessories')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        supplier_id: suppliers.find(s => s.name === 'Apple Inc.')?.id,
        images: ['🎧'],
        tags: ['earbuds', 'apple', 'wireless', 'noise-cancellation', 'featured'],
        is_active: true,
        total_quantity: 25,
        total_value: 1150000.00
      }
    ];
    
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .insert(sampleProducts)
      .select();
    
    if (productsError) {
      if (productsError.code === '23505') { // Unique constraint violation
        console.log('ℹ️  Products already exist, skipping...');
        const { data: existingProducts } = await supabase
          .from('lats_products')
          .select('*');
        products = existingProducts;
      } else {
        console.error('❌ Error adding products:', productsError);
        return;
      }
    } else {
      console.log(`✅ Added ${products.length} products`);
    }
    
    // Step 5: Add product variants
    console.log('\n🔄 Step 5: Adding product variants...');
    
    const variants = [];
    
    // iPhone 14 Pro variants
    const iphone = products.find(p => p.name === 'iPhone 14 Pro');
    if (iphone) {
      variants.push(
        {
          product_id: iphone.id,
          sku: 'IPH14P-128',
          name: 'iPhone 14 Pro 128GB',
          attributes: { storage: '128GB', color: 'Black' },
          cost_price: 120000,
          selling_price: 159999,
          quantity: 25,
          min_quantity: 10,
          max_quantity: 50,
          barcode: '1234567890123'
        },
        {
          product_id: iphone.id,
          sku: 'IPH14P-256',
          name: 'iPhone 14 Pro 256GB',
          attributes: { storage: '256GB', color: 'Black' },
          cost_price: 135000,
          selling_price: 179999,
          quantity: 15,
          min_quantity: 8,
          max_quantity: 40,
          barcode: '1234567890124'
        }
      );
    }
    
    // Samsung Galaxy S23 variants
    const samsung = products.find(p => p.name === 'Samsung Galaxy S23');
    if (samsung) {
      variants.push({
        product_id: samsung.id,
        sku: 'SAMS23-256',
        name: 'Samsung Galaxy S23 256GB',
        attributes: { storage: '256GB', color: 'Black' },
        cost_price: 95000,
        selling_price: 129999,
        quantity: 30,
        min_quantity: 8,
        max_quantity: 40,
        barcode: '1234567890125'
      });
    }
    
    // MacBook Pro variants
    const macbook = products.find(p => p.name === 'MacBook Pro 14"');
    if (macbook) {
      variants.push({
        product_id: macbook.id,
        sku: 'MBP14-512',
        name: 'MacBook Pro 14" 512GB',
        attributes: { storage: '512GB', color: 'Space Gray' },
        cost_price: 280000,
        selling_price: 299999,
        quantity: 12,
        min_quantity: 5,
        max_quantity: 20,
        barcode: '1234567890126'
      });
    }
    
    // Dell XPS variants
    const dell = products.find(p => p.name === 'Dell XPS 13');
    if (dell) {
      variants.push({
        product_id: dell.id,
        sku: 'DXP13-512',
        name: 'Dell XPS 13 512GB',
        attributes: { storage: '512GB', color: 'Platinum Silver' },
        cost_price: 180000,
        selling_price: 189999,
        quantity: 18,
        min_quantity: 8,
        max_quantity: 30,
        barcode: '1234567890127'
      });
    }
    
    // AirPods Pro variants
    const airpods = products.find(p => p.name === 'AirPods Pro');
    if (airpods) {
      variants.push({
        product_id: airpods.id,
        sku: 'APP-001',
        name: 'AirPods Pro',
        attributes: { color: 'White' },
        cost_price: 85000,
        selling_price: 45999,
        quantity: 25,
        min_quantity: 10,
        max_quantity: 50,
        barcode: '1234567890128'
      });
    }
    
    if (variants.length > 0) {
      const { data: insertedVariants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .insert(variants)
        .select();
      
      if (variantsError) {
        if (variantsError.code === '23505') { // Unique constraint violation
          console.log('ℹ️  Variants already exist, skipping...');
        } else {
          console.error('❌ Error adding variants:', variantsError);
          return;
        }
      } else {
        console.log(`✅ Added ${insertedVariants.length} product variants`);
      }
    }
    
    // Step 6: Verify the fix
    console.log('\n✅ Step 6: Verifying the fix...');
    
    const { data: finalProducts, error: finalProductsError } = await supabase
      .from('lats_products')
      .select('id, name, total_quantity, total_value');
    
    if (finalProductsError) {
      console.error('❌ Error verifying products:', finalProductsError);
    } else {
      console.log(`✅ Database now has ${finalProducts.length} products`);
      finalProducts.forEach(product => {
        console.log(`   - ${product.name}: ${product.total_quantity} units, $${product.total_value}`);
      });
    }
    
    const { data: finalVariants, error: finalVariantsError } = await supabase
      .from('lats_product_variants')
      .select('id, name, sku, product_id');
    
    if (finalVariantsError) {
      console.error('❌ Error verifying variants:', finalVariantsError);
    } else {
      console.log(`✅ Database now has ${finalVariants.length} product variants`);
    }
    
    console.log('\n🎉 LATS Database fix completed successfully!');
    console.log('   The foreign key constraint violation should now be resolved.');
    
  } catch (error) {
    console.error('❌ Unexpected error during fix:', error);
  }
}

// Run the fix
fixLatsDatabase()
  .then(() => {
    console.log('\n✅ Database fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during database fix:', error);
    process.exit(1);
  });
