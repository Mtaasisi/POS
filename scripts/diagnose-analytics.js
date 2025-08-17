const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseAnalytics() {
  console.log('🔍 Diagnosing Analytics Issues...\n');

  try {
    // Check 1: Are there any products?
    console.log('📦 Check 1: Products in database...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, is_active, total_quantity, total_value');

    if (productsError) {
      console.error('❌ Error getting products:', productsError);
    } else {
      console.log(`✅ Found ${products?.length || 0} products`);
      
      if (products && products.length > 0) {
        console.log('📋 Sample products:');
        products.slice(0, 3).forEach(product => {
          console.log(`  - ${product.name} (ID: ${product.id})`);
          console.log(`    Active: ${product.is_active}, Total Qty: ${product.total_quantity}, Total Value: $${product.total_value}`);
        });
      } else {
        console.log('⚠️  No products found in database!');
      }
    }

    // Check 2: Are there any variants?
    console.log('\n🏷️ Check 2: Product variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, name, quantity, cost_price, selling_price');

    if (variantsError) {
      console.error('❌ Error getting variants:', variantsError);
    } else {
      console.log(`✅ Found ${variants?.length || 0} variants`);
      
      if (variants && variants.length > 0) {
        console.log('📋 Sample variants:');
        variants.slice(0, 5).forEach(variant => {
          console.log(`  - ${variant.name} (Product ID: ${variant.product_id})`);
          console.log(`    Quantity: ${variant.quantity}, Cost: $${variant.cost_price}, Price: $${variant.selling_price}`);
        });
        
        // Check total quantity across all variants
        const totalVariantQuantity = variants.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
        console.log(`\n📊 Total quantity across all variants: ${totalVariantQuantity}`);
        
        // Check variants with zero quantity
        const zeroQuantityVariants = variants.filter(v => (v.quantity || 0) === 0);
        console.log(`⚠️  Variants with zero quantity: ${zeroQuantityVariants.length}`);
        
        // Check variants with positive quantity
        const positiveQuantityVariants = variants.filter(v => (v.quantity || 0) > 0);
        console.log(`✅ Variants with positive quantity: ${positiveQuantityVariants.length}`);
      } else {
        console.log('⚠️  No variants found in database!');
      }
    }

    // Check 3: Products with their variants
    console.log('\n🔗 Check 3: Products with their variants...');
    const { data: productsWithVariants, error: productsWithVariantsError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        is_active,
        total_quantity,
        total_value,
        variants:lats_product_variants(
          id,
          name,
          quantity,
          cost_price,
          selling_price
        )
      `)
      .limit(5);

    if (productsWithVariantsError) {
      console.error('❌ Error getting products with variants:', productsWithVariantsError);
    } else {
      console.log(`✅ Found ${productsWithVariants?.length || 0} products with variants data`);
      
      if (productsWithVariants && productsWithVariants.length > 0) {
        console.log('📋 Products with their variants:');
        productsWithVariants.forEach(product => {
          console.log(`\n📦 ${product.name} (ID: ${product.id})`);
          console.log(`   Active: ${product.is_active}`);
          console.log(`   Total Qty (from product): ${product.total_quantity}`);
          console.log(`   Total Value (from product): $${product.total_value}`);
          console.log(`   Variants: ${product.variants?.length || 0}`);
          
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
              console.log(`     - ${variant.name}: ${variant.quantity} units @ $${variant.cost_price}`);
            });
            
            // Calculate total stock for this product
            const productStock = product.variants.reduce((sum, variant) => 
              sum + (variant.quantity || 0), 0);
            console.log(`   Calculated total stock: ${productStock}`);
          } else {
            console.log(`     No variants found for this product`);
          }
        });
      }
    }

    // Check 4: Database connection and permissions
    console.log('\n🔌 Check 4: Database connection test...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('lats_products')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ Database connection issue:', testError);
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
    }

    // Check 5: Sample data insertion test
    console.log('\n🧪 Check 5: Testing data structure...');
    
    // Check if we can read from the variants table
    const { data: sampleVariants, error: sampleError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Cannot read from variants table:', sampleError);
    } else {
      console.log('✅ Can read from variants table');
      if (sampleVariants && sampleVariants.length > 0) {
        console.log('📋 Sample variant structure:', JSON.stringify(sampleVariants[0], null, 2));
      }
    }

    console.log('\n🎯 Summary:');
    console.log('If total stock is 0, it could be due to:');
    console.log('1. No products in the database');
    console.log('2. No variants for products');
    console.log('3. All variant quantities are set to 0');
    console.log('4. Database connection issues');
    console.log('5. Permission issues');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

// Run the diagnosis
diagnoseAnalytics();
