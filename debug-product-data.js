import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductData() {
  console.log('🔍 Debugging product data...');
  
  try {
    // First, check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user ? user.email : 'No user');
    
    // Get products with basic info
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, category_id, brand_id, supplier_id, is_active, total_quantity, total_value')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    console.log('✅ Products found:', products?.length || 0);
    
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      console.log('📋 Product IDs:', productIds);
      
      // Get variants for these products
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('*')
        .in('product_id', productIds);
      
      if (variantsError) {
        console.error('❌ Error fetching variants:', variantsError);
        return;
      }
      
      console.log('✅ Variants found:', variants?.length || 0);
      
      // Group variants by product
      const variantsByProduct = {};
      variants?.forEach(variant => {
        if (!variantsByProduct[variant.product_id]) {
          variantsByProduct[variant.product_id] = [];
        }
        variantsByProduct[variant.product_id].push(variant);
      });
      
      // Show detailed info for each product
      products.forEach(product => {
        const productVariants = variantsByProduct[product.id] || [];
        const mainVariant = productVariants[0];
        
        console.log(`\n📦 Product: ${product.name} (${product.id})`);
        console.log(`   SKU: ${mainVariant?.sku || 'N/A'}`);
        console.log(`   Price: ${mainVariant?.selling_price || 0}`);
        console.log(`   Stock: ${productVariants.reduce((sum, v) => sum + (v.quantity || 0), 0)} units`);
        console.log(`   Variants: ${productVariants.length}`);
        console.log(`   Has Images: ${productVariants.length > 0 ? '✅' : '❌'}`);
        
        if (productVariants.length > 0) {
          console.log(`   📋 Variant details:`);
          productVariants.forEach((variant, index) => {
            console.log(`     ${index + 1}. ${variant.name} - SKU: ${variant.sku} - Price: ${variant.selling_price} - Stock: ${variant.quantity}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

debugProductData();
