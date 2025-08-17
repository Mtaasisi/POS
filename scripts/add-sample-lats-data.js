import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzE5NzQsImV4cCI6MjA1MTU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleLatsData() {
  console.log('🚀 Adding Sample LATS Data to Database...\n');

  try {
    // 1. Add Categories
    console.log('📂 Adding Categories...');
    const categories = [
      { name: 'Smartphones', description: 'Mobile phones and accessories', color: '#3B82F6' },
      { name: 'Laptops', description: 'Portable computers and accessories', color: '#10B981' },
      { name: 'Tablets', description: 'Tablet computers and accessories', color: '#F59E0B' },
      { name: 'Accessories', description: 'Computer and phone accessories', color: '#8B5CF6' },
      { name: 'Wearables', description: 'Smartwatches and fitness trackers', color: '#EF4444' }
    ];

    const { data: addedCategories, error: categoriesError } = await supabase
      .from('lats_categories')
      .insert(categories)
      .select();

    if (categoriesError) {
      console.error('❌ Error adding categories:', categoriesError);
      return;
    }

    console.log(`✅ Added ${addedCategories.length} categories`);

    // 2. Add Brands
    console.log('\n🏷️ Adding Brands...');
    const brands = [
      { name: 'Apple', description: 'Premium technology products', website: 'https://apple.com' },
      { name: 'Samsung', description: 'Innovative mobile technology', website: 'https://samsung.com' },
      { name: 'Dell', description: 'Reliable computing solutions', website: 'https://dell.com' },
      { name: 'HP', description: 'Personal computing and printing', website: 'https://hp.com' },
      { name: 'Logitech', description: 'Computer peripherals and accessories', website: 'https://logitech.com' }
    ];

    const { data: addedBrands, error: brandsError } = await supabase
      .from('lats_brands')
      .insert(brands)
      .select();

    if (brandsError) {
      console.error('❌ Error adding brands:', brandsError);
      return;
    }

    console.log(`✅ Added ${addedBrands.length} brands`);

    // 3. Add Suppliers
    console.log('\n🏢 Adding Suppliers...');
    const suppliers = [
      { name: 'Tech Distributors Ltd', contactPerson: 'John Smith', email: 'john@techdist.com', phone: '+254700123456' },
      { name: 'Mobile World Kenya', contactPerson: 'Sarah Johnson', email: 'sarah@mobileworld.co.ke', phone: '+254700234567' },
      { name: 'Computer Solutions', contactPerson: 'Mike Davis', email: 'mike@computersolutions.com', phone: '+254700345678' },
      { name: 'Digital Hub Africa', contactPerson: 'Lisa Wang', email: 'lisa@digitalhub.africa', phone: '+254700456789' },
      { name: 'Gadget Pro Kenya', contactPerson: 'David Kim', email: 'david@gadgetpro.co.ke', phone: '+254700567890' }
    ];

    const { data: addedSuppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .insert(suppliers)
      .select();

    if (suppliersError) {
      console.error('❌ Error adding suppliers:', suppliersError);
      return;
    }

    console.log(`✅ Added ${addedSuppliers.length} suppliers`);

    // 4. Add Products
    console.log('\n📦 Adding Products...');
    const products = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced camera system and A16 Bionic chip',
        category_id: addedCategories[0].id, // Smartphones
        brand_id: addedBrands[0].id, // Apple
        supplier_id: addedSuppliers[0].id, // Tech Distributors
        images: ['iphone14pro.jpg'],
        tags: ['smartphone', 'apple', 'camera', 'premium', 'featured'],
        is_active: true
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Flagship Android smartphone with S Pen support',
        category_id: addedCategories[0].id, // Smartphones
        brand_id: addedBrands[1].id, // Samsung
        supplier_id: addedSuppliers[1].id, // Mobile World
        images: ['galaxys23.jpg'],
        tags: ['smartphone', 'samsung', 'android', 's-pen'],
        is_active: true
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip and Liquid Retina display',
        category_id: addedCategories[1].id, // Laptops
        brand_id: addedBrands[0].id, // Apple
        supplier_id: addedSuppliers[2].id, // Computer Solutions
        images: ['macbookpro14.jpg'],
        tags: ['laptop', 'apple', 'professional', 'm2', 'featured'],
        is_active: true
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook with InfinityEdge display and Intel processor',
        category_id: addedCategories[1].id, // Laptops
        brand_id: addedBrands[2].id, // Dell
        supplier_id: addedSuppliers[2].id, // Computer Solutions
        images: ['dellxps13.jpg'],
        tags: ['laptop', 'dell', 'ultrabook', 'intel'],
        is_active: true
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        category_id: addedCategories[3].id, // Accessories
        brand_id: addedBrands[0].id, // Apple
        supplier_id: addedSuppliers[3].id, // Digital Hub
        images: ['airpodspro.jpg'],
        tags: ['earbuds', 'apple', 'wireless', 'noise-cancellation', 'featured'],
        is_active: true
      }
    ];

    const { data: addedProducts, error: productsError } = await supabase
      .from('lats_products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('❌ Error adding products:', productsError);
      return;
    }

    console.log(`✅ Added ${addedProducts.length} products`);

    // 5. Add Product Variants
    console.log('\n🔧 Adding Product Variants...');
    const variants = [
      // iPhone 14 Pro variants
      {
        product_id: addedProducts[0].id,
        sku: 'IPH14P-128-BLK',
        name: 'iPhone 14 Pro 128GB Black',
        attributes: { color: 'Black', storage: '128GB' },
        cost_price: 120000,
        selling_price: 159999,
        quantity: 15,
        min_quantity: 5,
        barcode: '1234567890123'
      },
      {
        product_id: addedProducts[0].id,
        sku: 'IPH14P-256-BLK',
        name: 'iPhone 14 Pro 256GB Black',
        attributes: { color: 'Black', storage: '256GB' },
        cost_price: 135000,
        selling_price: 179999,
        quantity: 10,
        min_quantity: 3,
        barcode: '1234567890124'
      },
      // Samsung Galaxy S23 variants
      {
        product_id: addedProducts[1].id,
        sku: 'SAMS23-256-BLK',
        name: 'Samsung Galaxy S23 256GB Black',
        attributes: { color: 'Black', storage: '256GB' },
        cost_price: 95000,
        selling_price: 129999,
        quantity: 12,
        min_quantity: 4,
        barcode: '1234567890125'
      },
      // MacBook Pro variants
      {
        product_id: addedProducts[2].id,
        sku: 'MBP14-512-SLV',
        name: 'MacBook Pro 14" 512GB Silver',
        attributes: { color: 'Silver', storage: '512GB' },
        cost_price: 250000,
        selling_price: 299999,
        quantity: 8,
        min_quantity: 2,
        barcode: '1234567890126'
      },
      // Dell XPS variants
      {
        product_id: addedProducts[3].id,
        sku: 'DLLXPS-256-SLV',
        name: 'Dell XPS 13 256GB Silver',
        attributes: { color: 'Silver', storage: '256GB' },
        cost_price: 140000,
        selling_price: 189999,
        quantity: 10,
        min_quantity: 3,
        barcode: '1234567890127'
      },
      // AirPods Pro variants
      {
        product_id: addedProducts[4].id,
        sku: 'AIRPP-2-WHT',
        name: 'AirPods Pro 2nd Gen White',
        attributes: { color: 'White', generation: '2nd Gen' },
        cost_price: 35000,
        selling_price: 45999,
        quantity: 25,
        min_quantity: 8,
        barcode: '1234567890128'
      }
    ];

    const { data: addedVariants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .insert(variants)
      .select();

    if (variantsError) {
      console.error('❌ Error adding variants:', variantsError);
      return;
    }

    console.log(`✅ Added ${addedVariants.length} product variants`);

    // 6. Add Sample Stock Movements
    console.log('\n📊 Adding Sample Stock Movements...');
    const stockMovements = [
      {
        product_id: addedProducts[0].id,
        variant_id: addedVariants[0].id,
        type: 'in',
        quantity: 20,
        previous_quantity: 0,
        new_quantity: 20,
        reason: 'Initial stock',
        reference: 'INIT-001'
      },
      {
        product_id: addedProducts[0].id,
        variant_id: addedVariants[0].id,
        type: 'out',
        quantity: 5,
        previous_quantity: 20,
        new_quantity: 15,
        reason: 'Sales',
        reference: 'SALE-001'
      },
      {
        product_id: addedProducts[1].id,
        variant_id: addedVariants[2].id,
        type: 'in',
        quantity: 15,
        previous_quantity: 0,
        new_quantity: 15,
        reason: 'Initial stock',
        reference: 'INIT-002'
      },
      {
        product_id: addedProducts[1].id,
        variant_id: addedVariants[2].id,
        type: 'out',
        quantity: 3,
        previous_quantity: 15,
        new_quantity: 12,
        reason: 'Sales',
        reference: 'SALE-002'
      }
    ];

    const { data: addedMovements, error: movementsError } = await supabase
      .from('lats_stock_movements')
      .insert(stockMovements)
      .select();

    if (movementsError) {
      console.error('❌ Error adding stock movements:', movementsError);
      return;
    }

    console.log(`✅ Added ${addedMovements.length} stock movements`);

    // Summary
    console.log('\n🎉 Sample Data Added Successfully!');
    console.log('📈 Summary:');
    console.log(`   Categories: ${addedCategories.length}`);
    console.log(`   Brands: ${addedBrands.length}`);
    console.log(`   Suppliers: ${addedSuppliers.length}`);
    console.log(`   Products: ${addedProducts.length}`);
    console.log(`   Product Variants: ${addedVariants.length}`);
    console.log(`   Stock Movements: ${addedMovements.length}`);

    console.log('\n✅ The LATS database now contains sample data!');
    console.log('🎯 You can now test the Product Catalog and POS systems.');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

addSampleLatsData();
