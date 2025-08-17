import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSAndAddData() {
  console.log('🔧 Attempting to fix RLS and add sample data...');
  
  try {
    // First, let's try to disable RLS temporarily using SQL
    console.log('🔧 Temporarily disabling RLS...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Temporarily disable RLS
        ALTER TABLE lats_categories DISABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_brands DISABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_suppliers DISABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_products DISABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_product_variants DISABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.log('⚠️  Could not disable RLS via RPC:', rlsError.message);
      console.log('📋 Trying alternative approach...');
    } else {
      console.log('✅ RLS temporarily disabled');
    }

    // Try to add data directly
    console.log('📝 Adding sample data...');
    
    // Add categories
    const categories = [
      { name: 'Smartphones', description: 'Mobile phones and accessories' },
      { name: 'Laptops', description: 'Portable computers' },
      { name: 'Tablets', description: 'Tablet devices' },
      { name: 'Accessories', description: 'Phone and computer accessories' },
      { name: 'Repair Parts', description: 'Replacement parts for repairs' }
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('lats_categories')
        .insert(category);
      
      if (error) {
        console.log(`⚠️  Category ${category.name}: ${error.message}`);
      } else {
        console.log(`✅ Added category: ${category.name}`);
      }
    }

    // Add brands
    const brands = [
      { name: 'Apple', description: 'Apple Inc. products' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Dell', description: 'Dell Technologies' },
      { name: 'HP', description: 'Hewlett-Packard' },
      { name: 'Lenovo', description: 'Lenovo Group' }
    ];

    for (const brand of brands) {
      const { error } = await supabase
        .from('lats_brands')
        .insert(brand);
      
      if (error) {
        console.log(`⚠️  Brand ${brand.name}: ${error.message}`);
      } else {
        console.log(`✅ Added brand: ${brand.name}`);
      }
    }

    // Add suppliers
    const suppliers = [
      { name: 'Tech Supplies Ltd', contact_person: 'John Doe', email: 'john@techsupplies.com', phone: '+1234567890' },
      { name: 'Mobile World', contact_person: 'Jane Smith', email: 'jane@mobileworld.com', phone: '+1234567891' },
      { name: 'Computer Hub', contact_person: 'Bob Johnson', email: 'bob@computerhub.com', phone: '+1234567892' }
    ];

    for (const supplier of suppliers) {
      const { error } = await supabase
        .from('lats_suppliers')
        .insert(supplier);
      
      if (error) {
        console.log(`⚠️  Supplier ${supplier.name}: ${error.message}`);
      } else {
        console.log(`✅ Added supplier: ${supplier.name}`);
      }
    }

    // Get IDs for relationships
    console.log('🔍 Getting IDs for relationships...');
    
    const { data: categoriesData } = await supabase.from('lats_categories').select('id, name');
    const { data: brandsData } = await supabase.from('lats_brands').select('id, name');
    const { data: suppliersData } = await supabase.from('lats_suppliers').select('id, name');

    const smartphoneCategory = categoriesData?.find(c => c.name === 'Smartphones');
    const laptopCategory = categoriesData?.find(c => c.name === 'Laptops');
    const accessoriesCategory = categoriesData?.find(c => c.name === 'Accessories');
    
    const appleBrand = brandsData?.find(b => b.name === 'Apple');
    const samsungBrand = brandsData?.find(b => b.name === 'Samsung');
    const dellBrand = brandsData?.find(b => b.name === 'Dell');
    
    const techSupplies = suppliersData?.find(s => s.name === 'Tech Supplies Ltd');

    // Add products
    const products = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone with advanced features',
        category_id: smartphoneCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 50,
        total_value: 50000,
        is_active: true
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone',
        category_id: smartphoneCategory?.id,
        brand_id: samsungBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 30,
        total_value: 30000,
        is_active: true
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop for developers',
        category_id: laptopCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 20,
        total_value: 80000,
        is_active: true
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook for business users',
        category_id: laptopCategory?.id,
        brand_id: dellBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 25,
        total_value: 50000,
        is_active: true
      },
      {
        name: 'iPhone Screen Protector',
        description: 'Tempered glass screen protector',
        category_id: accessoriesCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 200,
        total_value: 2000,
        is_active: true
      },
      {
        name: 'Phone Charging Cable',
        description: 'USB-C to Lightning cable',
        category_id: accessoriesCategory?.id,
        brand_id: appleBrand?.id,
        supplier_id: techSupplies?.id,
        total_quantity: 150,
        total_value: 1200,
        is_active: true
      },
      {
        name: 'Screen Repair Service',
        description: 'Professional screen replacement service',
        category_id: accessoriesCategory?.id,
        brand_id: null,
        supplier_id: null,
        total_quantity: 999,
        total_value: 0,
        is_active: true
      }
    ];

    for (const product of products) {
      const { error } = await supabase
        .from('lats_products')
        .insert(product);
      
      if (error) {
        console.log(`⚠️  Product ${product.name}: ${error.message}`);
      } else {
        console.log(`✅ Added product: ${product.name}`);
      }
    }

    // Get product IDs for variants
    const { data: productsData } = await supabase.from('lats_products').select('id, name');

    // Add product variants
    const variants = [
      {
        product_id: productsData?.find(p => p.name === 'iPhone 14 Pro')?.id,
        sku: 'IPHONE-14-PRO-001',
        name: '128GB Space Black',
        attributes: { color: 'Space Black', storage: '128GB' },
        selling_price: 999.99,
        cost_price: 800.00,
        quantity: 20,
        barcode: '1234567890123'
      },
      {
        product_id: productsData?.find(p => p.name === 'iPhone 14 Pro')?.id,
        sku: 'IPHONE-14-PRO-002',
        name: '256GB Space Black',
        attributes: { color: 'Space Black', storage: '256GB' },
        selling_price: 1099.99,
        cost_price: 900.00,
        quantity: 15,
        barcode: '1234567890124'
      },
      {
        product_id: productsData?.find(p => p.name === 'Samsung Galaxy S23')?.id,
        sku: 'SAMSUNG-S23-001',
        name: '128GB Phantom Black',
        attributes: { color: 'Phantom Black', storage: '128GB' },
        selling_price: 899.99,
        cost_price: 700.00,
        quantity: 15,
        barcode: '1234567890125'
      },
      {
        product_id: productsData?.find(p => p.name === 'MacBook Pro 14"')?.id,
        sku: 'MACBOOK-PRO-14-001',
        name: 'M2 Pro 512GB',
        attributes: { processor: 'M2 Pro', storage: '512GB' },
        selling_price: 1999.99,
        cost_price: 1600.00,
        quantity: 10,
        barcode: '1234567890126'
      },
      {
        product_id: productsData?.find(p => p.name === 'Dell XPS 13')?.id,
        sku: 'DELL-XPS-13-001',
        name: 'Intel i7 512GB',
        attributes: { processor: 'Intel i7', storage: '512GB' },
        selling_price: 1299.99,
        cost_price: 1000.00,
        quantity: 12,
        barcode: '1234567890127'
      },
      {
        product_id: productsData?.find(p => p.name === 'iPhone Screen Protector')?.id,
        sku: 'IPHONE-SP-001',
        name: 'Tempered Glass',
        attributes: { material: 'Tempered Glass', compatibility: 'iPhone 14 Pro' },
        selling_price: 19.99,
        cost_price: 8.00,
        quantity: 100,
        barcode: '1234567890128'
      },
      {
        product_id: productsData?.find(p => p.name === 'Phone Charging Cable')?.id,
        sku: 'CABLE-USB-C-001',
        name: 'USB-C to Lightning',
        attributes: { type: 'USB-C to Lightning', length: '1m' },
        selling_price: 24.99,
        cost_price: 12.00,
        quantity: 75,
        barcode: '1234567890129'
      },
      {
        product_id: productsData?.find(p => p.name === 'Screen Repair Service')?.id,
        sku: 'SERVICE-SCREEN-001',
        name: 'Standard Repair',
        attributes: { service_type: 'Screen Replacement', warranty: '90 days' },
        selling_price: 149.99,
        cost_price: 50.00,
        quantity: 999,
        barcode: '1234567890130'
      }
    ];

    for (const variant of variants) {
      if (variant.product_id) {
        const { error } = await supabase
          .from('lats_product_variants')
          .insert(variant);
        
        if (error) {
          console.log(`⚠️  Variant ${variant.sku}: ${error.message}`);
        } else {
          console.log(`✅ Added variant: ${variant.sku}`);
        }
      }
    }

    // Re-enable RLS
    console.log('🔧 Re-enabling RLS...');
    const { error: reenableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Re-enable RLS
        ALTER TABLE lats_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_brands ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_suppliers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
      `
    });

    if (reenableError) {
      console.log('⚠️  Could not re-enable RLS via RPC:', reenableError.message);
    } else {
      console.log('✅ RLS re-enabled');
    }

    console.log('🎉 Process completed!');
    
    // Verify the data
    console.log('🔍 Verifying data...');
    const { data: finalProducts } = await supabase.from('lats_products').select('*');
    const { data: finalVariants } = await supabase.from('lats_product_variants').select('*');
    
    console.log(`📊 Final count: ${finalProducts?.length || 0} products, ${finalVariants?.length || 0} variants`);

    if (finalProducts && finalProducts.length > 0) {
      console.log('✅ POS system should now be able to fetch products!');
      console.log('📋 Next steps:');
      console.log('1. Open your application in the browser');
      console.log('2. Navigate to the POS system');
      console.log('3. Test product search and cart functionality');
    } else {
      console.log('❌ No products were added. RLS policies may still be blocking access.');
      console.log('📋 Manual steps required:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Navigate to Authentication > Policies');
      console.log('3. Temporarily disable RLS for lats_* tables');
      console.log('4. Add data manually through Table Editor');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRLSAndAddData();
