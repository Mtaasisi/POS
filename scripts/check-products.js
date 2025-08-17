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

const checkProducts = async () => {
  try {
    console.log('📦 Checking products table structure...');
    
    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('📋 Sample products:');
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ID: ${product.id}`);
        console.log(`     Name: ${product.name || 'NULL'}`);
        console.log(`     Description: ${product.description || 'NULL'}`);
        console.log(`     Category ID: ${product.category_id || 'NULL'}`);
        console.log(`     Brand ID: ${product.brand_id || 'NULL'}`);
        console.log(`     Is Active: ${product.is_active}`);
        console.log(`     Created At: ${product.created_at}`);
        console.log('');
      });
    }
    
    // Check product variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(5);
    
    if (variantsError) {
      console.error('❌ Error fetching variants:', variantsError);
      return;
    }
    
    console.log(`✅ Found ${variants.length} product variants`);
    
    if (variants.length > 0) {
      console.log('📋 Sample variants:');
      variants.forEach((variant, index) => {
        console.log(`  ${index + 1}. ID: ${variant.id}`);
        console.log(`     Product ID: ${variant.product_id}`);
        console.log(`     Name: ${variant.name || 'NULL'}`);
        console.log(`     SKU: ${variant.sku || 'NULL'}`);
        console.log(`     Cost Price: ${variant.cost_price}`);
        console.log(`     Selling Price: ${variant.selling_price}`);
        console.log(`     Quantity: ${variant.quantity}`);
        console.log('');
      });
    }
    
    // Check categories
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }
    
    console.log(`✅ Found ${categories.length} categories`);
    
    if (categories.length > 0) {
      console.log('📋 Sample categories:');
      categories.forEach((category, index) => {
        console.log(`  ${index + 1}. ID: ${category.id} - Name: ${category.name}`);
      });
    }
    
    // Check brands
    const { data: brands, error: brandsError } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(5);
    
    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }
    
    console.log(`✅ Found ${brands.length} brands`);
    
    if (brands.length > 0) {
      console.log('📋 Sample brands:');
      brands.forEach((brand, index) => {
        console.log(`  ${index + 1}. ID: ${brand.id} - Name: ${brand.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  }
};

// Run the script
checkProducts();
