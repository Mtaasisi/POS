import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Finds products with incomplete data
 */
async function findIncompleteProducts() {
  try {
    console.log('🔍 Searching for products with incomplete data...');
    
    // Query for products with incomplete data
    const { data: incompleteProducts, error } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        description,
        lats_product_variants(
          id,
          sku,
          name,
          selling_price,
          cost_price,
          quantity,
          min_quantity,
          barcode
        )
      `)
      .or('description.is.null,description.eq.');

    if (error) {
      console.error('❌ Error finding incomplete products:', error);
      return [];
    }

    console.log(`📊 Found ${incompleteProducts?.length || 0} products with incomplete data`);
    return incompleteProducts || [];
  } catch (error) {
    console.error('❌ Error in findIncompleteProducts:', error);
    return [];
  }
}

/**
 * Auto-fixes a single product
 */
async function autoFixProduct(product) {
  try {
    console.log(`🔧 Fixing product: ${product.name} (${product.id})`);
    
    const updates = {};
    let fixCount = 0;

    // Fix product-level issues
    if (!product.description || product.description.trim() === '') {
      updates.description = 'Product description needed';
      fixCount++;
    }

    // Fix variant issues
    if (product.lats_product_variants && product.lats_product_variants.length > 0) {
      for (const variant of product.lats_product_variants) {
        const variantUpdates = {};

        // Fix selling price
        if (!variant.selling_price || variant.selling_price <= 0) {
          variantUpdates.selling_price = 99.99;
          fixCount++;
        }

        // Fix cost price
        if (variant.cost_price === null || variant.cost_price === undefined || variant.cost_price < 0) {
          variantUpdates.cost_price = 50.00;
          fixCount++;
        }

        // Fix quantity
        if (variant.quantity === null || variant.quantity === undefined || variant.quantity < 0) {
          variantUpdates.quantity = 0;
          fixCount++;
        }

        // Fix min quantity
        if (!variant.min_quantity || variant.min_quantity < 0) {
          variantUpdates.min_quantity = 5;
          fixCount++;
        }

        // Fix max quantity
        if (!variant.max_quantity || variant.max_quantity < 0) {
          variantUpdates.max_quantity = 100;
          fixCount++;
        }

        // Fix barcode
        if (!variant.barcode) {
          variantUpdates.barcode = `${variant.sku}-${Date.now()}`;
          fixCount++;
        }

        // Fix weight
        if (!variant.weight) {
          variantUpdates.weight = 0;
          fixCount++;
        }

        // Fix dimensions
        if (!variant.dimensions) {
          variantUpdates.dimensions = '';
          fixCount++;
        }

        // Update variant if there are changes
        if (Object.keys(variantUpdates).length > 0) {
          const { error: variantError } = await supabase
            .from('lats_product_variants')
            .update(variantUpdates)
            .eq('id', variant.id);

          if (variantError) {
            console.error(`❌ Error updating variant ${variant.sku}:`, variantError);
          } else {
            console.log(`✅ Updated variant ${variant.sku}`);
          }
        }
      }
    }

    // Update product if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: productError } = await supabase
        .from('lats_products')
        .update(updates)
        .eq('id', product.id);

      if (productError) {
        console.error(`❌ Error updating product ${product.name}:`, productError);
      } else {
        console.log(`✅ Updated product ${product.name}`);
      }
    }

    console.log(`🎉 Fixed ${fixCount} issues for product ${product.name}`);
    return fixCount;
  } catch (error) {
    console.error(`❌ Error auto-fixing product ${product.name}:`, error);
    return 0;
  }
}

/**
 * Main function to run the auto-fix process
 */
async function runAutoFix() {
  try {
    console.log('🚀 Starting automatic product data fix process...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Find incomplete products
    const incompleteProducts = await findIncompleteProducts();

    if (incompleteProducts.length === 0) {
      console.log('✅ No incomplete products found. All products are up to date!');
      return;
    }

    // Process each incomplete product
    let totalFixes = 0;
    let processedCount = 0;

    for (const product of incompleteProducts) {
      const fixCount = await autoFixProduct(product);
      totalFixes += fixCount;
      processedCount++;

      console.log(`📈 Progress: ${processedCount}/${incompleteProducts.length} products processed`);
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 AUTO-FIX SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Total products processed: ${processedCount}`);
    console.log(`Total fixes applied: ${totalFixes}`);
    console.log(`Average fixes per product: ${Math.round(totalFixes / processedCount)}`);
    console.log('=' .repeat(50));

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      productsProcessed: processedCount,
      totalFixes: totalFixes,
      averageFixesPerProduct: Math.round(totalFixes / processedCount),
      status: 'completed'
    };

    console.log('📄 Report generated:', JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('❌ Error in runAutoFix:', error);
  }
}

/**
 * Function to check data quality metrics
 */
async function checkDataQuality() {
  try {
    console.log('📊 Checking data quality metrics...');

    // Get total products
    const { count: totalProducts } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact', head: true });

    // Get products with complete data
    const { count: completeProducts } = await supabase
      .from('lats_products')
      .select('*', { count: 'exact', head: true })
      .not('description', 'is', null)
      .not('description', 'eq', '');

    // Get total variants
    const { count: totalVariants } = await supabase
      .from('lats_product_variants')
      .select('*', { count: 'exact', head: true });

    // Get variants with complete pricing
    const { count: completeVariants } = await supabase
      .from('lats_product_variants')
      .select('*', { count: 'exact', head: true })
      .gt('selling_price', 0)
      .gte('cost_price', 0)
      .gte('quantity', 0);

    const productCompleteness = Math.round((completeProducts / totalProducts) * 100);
    const variantCompleteness = Math.round((completeVariants / totalVariants) * 100);

    console.log('\n📈 DATA QUALITY METRICS:');
    console.log('=' .repeat(50));
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Complete Products: ${completeProducts} (${productCompleteness}%)`);
    console.log(`Total Variants: ${totalVariants}`);
    console.log(`Complete Variants: ${completeVariants} (${variantCompleteness}%)`);
    console.log(`Overall Data Quality: ${Math.round((productCompleteness + variantCompleteness) / 2)}%`);
    console.log('=' .repeat(50));

    return {
      totalProducts,
      completeProducts,
      productCompleteness,
      totalVariants,
      completeVariants,
      variantCompleteness,
      overallQuality: Math.round((productCompleteness + variantCompleteness) / 2)
    };

  } catch (error) {
    console.error('❌ Error checking data quality:', error);
    return null;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'auto-fix';

  switch (command) {
    case 'auto-fix':
      await runAutoFix();
      break;
    case 'check-quality':
      await checkDataQuality();
      break;
    case 'full':
      await checkDataQuality();
      console.log('\n');
      await runAutoFix();
      break;
    default:
      console.log('Usage: node auto-fix-incomplete-products.js [auto-fix|check-quality|full]');
      console.log('  auto-fix: Run the auto-fix process');
      console.log('  check-quality: Check data quality metrics');
      console.log('  full: Check quality and then run auto-fix');
  }
}

// Run the script
main().catch(console.error);
