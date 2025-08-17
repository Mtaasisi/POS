import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const addSampleProducts = async () => {
  try {
    console.log('📦 Adding sample products...');
    
    // First, let's check if we have categories
    let { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }
    
    // If no categories exist, create them
    if (!categories || categories.length === 0) {
      console.log('📂 Creating sample categories...');
      const { data: newCategories, error: createCategoriesError } = await supabase
        .from('lats_categories')
        .insert([
          { name: 'Smartphones', description: 'Mobile phones and accessories' },
          { name: 'Laptops', description: 'Portable computers' },
          { name: 'Accessories', description: 'Device accessories' },
          { name: 'Wearables', description: 'Smart watches and fitness trackers' },
          { name: 'Tablets', description: 'Tablet computers' }
        ])
        .select();
      
      if (createCategoriesError) {
        console.error('❌ Error creating categories:', createCategoriesError);
        return;
      }
      
      categories = newCategories;
      console.log('✅ Created categories');
    }
    
    // Get brands
    const { data: brands, error: brandsError } = await supabase
      .from('lats_brands')
      .select('*');
    
    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }
    
    console.log(`✅ Found ${categories.length} categories and ${brands.length} brands`);
    
    // Sample products data
    const sampleProducts = [
      {
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone model with advanced camera system',
        category_id: categories.find(c => c.name === 'Smartphones')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        is_active: true
      },
      {
        name: 'Samsung Galaxy S23',
        description: 'Android flagship phone with powerful performance',
        category_id: categories.find(c => c.name === 'Smartphones')?.id,
        brand_id: brands.find(b => b.name === 'Samsung')?.id,
        is_active: true
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop for creative work',
        category_id: categories.find(c => c.name === 'Laptops')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        is_active: true
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook with premium design',
        category_id: categories.find(c => c.name === 'Laptops')?.id,
        brand_id: brands.find(b => b.name === 'Dell')?.id,
        is_active: true
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        category_id: categories.find(c => c.name === 'Accessories')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        is_active: true
      },
      {
        name: 'Samsung Galaxy Watch',
        description: 'Smart watch with health tracking',
        category_id: categories.find(c => c.name === 'Wearables')?.id,
        brand_id: brands.find(b => b.name === 'Samsung')?.id,
        is_active: true
      },
      {
        name: 'iPad Air',
        description: 'Tablet computer for productivity and creativity',
        category_id: categories.find(c => c.name === 'Tablets')?.id,
        brand_id: brands.find(b => b.name === 'Apple')?.id,
        is_active: true
      },
      {
        name: 'Logitech MX Master 3',
        description: 'Premium wireless mouse for professionals',
        category_id: categories.find(c => c.name === 'Accessories')?.id,
        brand_id: brands.find(b => b.name === 'Logitech')?.id,
        is_active: true
      }
    ];
    
    // Insert products
    console.log('📦 Inserting sample products...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .insert(sampleProducts)
      .select();
    
    if (productsError) {
      console.error('❌ Error inserting products:', productsError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${products.length} products`);
    
    // Create variants for each product
    console.log('🔄 Creating product variants...');
    const variants = [];
    
    products.forEach(product => {
      // Create a standard variant for each product
      const basePrice = Math.floor(Math.random() * 100000) + 50000; // 50k to 150k
      const costPrice = Math.floor(basePrice * 0.7); // 70% of selling price
      
      variants.push({
        product_id: product.id,
        sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-STD`,
        name: `${product.name} - Standard`,
        cost_price: costPrice,
        selling_price: basePrice,
        quantity: Math.floor(Math.random() * 50) + 10, // 10-60 units
        barcode: `BAR${Date.now()}${Math.floor(Math.random() * 1000)}`,
        attributes: {
          color: 'Standard',
          size: 'Standard',
          condition: 'New'
        }
      });
      
      // Create a premium variant for some products
      if (Math.random() > 0.5) {
        const premiumPrice = Math.floor(basePrice * 1.3); // 30% more
        const premiumCost = Math.floor(premiumPrice * 0.7);
        
        variants.push({
          product_id: product.id,
          sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-PREMIUM`,
          name: `${product.name} - Premium`,
          cost_price: premiumCost,
          selling_price: premiumPrice,
          quantity: Math.floor(Math.random() * 20) + 5, // 5-25 units
          barcode: `BAR${Date.now()}${Math.floor(Math.random() * 1000)}`,
          attributes: {
            color: 'Premium',
            size: 'Premium',
            condition: 'New'
          }
        });
      }
    });
    
    // Insert variants
    const { data: insertedVariants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .insert(variants)
      .select();
    
    if (variantsError) {
      console.error('❌ Error inserting variants:', variantsError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedVariants.length} product variants`);
    
    // Show summary
    console.log('🎉 Sample products added successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Variants: ${insertedVariants.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Brands: ${brands.length}`);
    
    console.log('\n📋 Sample products created:');
    products.forEach((product, index) => {
      const category = categories.find(c => c.id === product.category_id)?.name || 'Unknown';
      const brand = brands.find(b => b.id === product.brand_id)?.name || 'Unknown';
      console.log(`  ${index + 1}. ${product.name} (${brand} - ${category})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  }
};

// Run the script
addSampleProducts();
