import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkActualSchema() {
  console.log('🔧 Checking actual database schema...\n');
  
  try {
    // Check lats_products table structure
    console.log('📋 Checking lats_products table structure');
    
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products query failed:', productsError);
    } else if (products && products.length > 0) {
      console.log('✅ Products table structure:');
      const product = products[0];
      Object.keys(product).forEach(key => {
        console.log(`- ${key}: ${typeof product[key]} (${product[key]})`);
      });
    }
    
    // Check lats_product_variants table structure
    console.log('\n📋 Checking lats_product_variants table structure');
    
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(1);
    
    if (variantsError) {
      console.error('❌ Variants query failed:', variantsError);
    } else if (variants && variants.length > 0) {
      console.log('✅ Variants table structure:');
      const variant = variants[0];
      Object.keys(variant).forEach(key => {
        console.log(`- ${key}: ${typeof variant[key]} (${variant[key]})`);
      });
    }
    
    // Check lats_stock_movements table structure
    console.log('\n📋 Checking lats_stock_movements table structure');
    
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('*')
      .limit(1);
    
    if (stockError) {
      console.error('❌ Stock movements query failed:', stockError);
    } else if (stockMovements && stockMovements.length > 0) {
      console.log('✅ Stock movements table structure:');
      const stockMovement = stockMovements[0];
      Object.keys(stockMovement).forEach(key => {
        console.log(`- ${key}: ${typeof stockMovement[key]} (${stockMovement[key]})`);
      });
    }
    
    // Check product_images table structure
    console.log('\n📋 Checking product_images table structure');
    
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (imagesError) {
      console.error('❌ Product images query failed:', imagesError);
    } else if (images && images.length > 0) {
      console.log('✅ Product images table structure:');
      const image = images[0];
      Object.keys(image).forEach(key => {
        console.log(`- ${key}: ${typeof image[key]} (${image[key]})`);
      });
    }
    
    // Test simple queries without joins
    console.log('\n📋 Testing simple queries without joins');
    
    // Test products with basic fields
    const { data: simpleProducts, error: simpleProductsError } = await supabase
      .from('lats_products')
      .select('id, name, description, category_id, brand_id, supplier_id, is_active, is_featured, total_quantity, total_value')
      .limit(3);
    
    if (simpleProductsError) {
      console.error('❌ Simple products query failed:', simpleProductsError);
    } else {
      console.log('✅ Simple products query successful');
      console.log('📦 Sample products:');
      simpleProducts?.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (Category: ${product.category_id}, Brand: ${product.brand_id})`);
      });
    }
    
    // Test variants with basic fields
    const { data: simpleVariants, error: simpleVariantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, name, cost_price, selling_price, quantity')
      .limit(3);
    
    if (simpleVariantsError) {
      console.error('❌ Simple variants query failed:', simpleVariantsError);
    } else {
      console.log('✅ Simple variants query successful');
      console.log('📦 Sample variants:');
      simpleVariants?.forEach((variant, index) => {
        console.log(`${index + 1}. ${variant.name} (Product: ${variant.product_id}, Price: ${variant.selling_price})`);
      });
    }
    
    console.log('\n🎉 Schema check completed!');
    
  } catch (error) {
    console.error('💥 Schema check failed with exception:', error);
  }
}

// Run the check
checkActualSchema();
