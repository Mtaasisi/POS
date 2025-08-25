import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Find and fix the product with incomplete data
 */
async function fixIncompleteProduct() {
  try {
    console.log('🔍 Searching for products with incomplete data...');
    
    // First, let's find products that have no variants or variants with missing data
    const { data: products, error: productsError } = await supabase
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
      `);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`📊 Found ${products?.length || 0} total products`);

    // Find products with incomplete data
    const incompleteProducts = products?.filter(product => {
      const hasNoVariants = !product.lats_product_variants || product.lats_product_variants.length === 0;
      const hasIncompleteVariants = product.lats_product_variants?.some(variant => 
        !variant.sku || 
        !variant.selling_price || 
        variant.selling_price <= 0 ||
        variant.quantity === null ||
        variant.quantity === undefined
      );
      
      return hasNoVariants || hasIncompleteVariants;
    }) || [];

    console.log(`🔧 Found ${incompleteProducts.length} products with incomplete data`);

    if (incompleteProducts.length === 0) {
      console.log('✅ All products have complete data!');
      return;
    }

    // Fix each incomplete product
    for (const product of incompleteProducts) {
      console.log(`\n🔧 Fixing product: ${product.name} (${product.id})`);
      
      // Check if product has variants
      if (!product.lats_product_variants || product.lats_product_variants.length === 0) {
        console.log('  📦 Product has no variants, creating default variant...');
        
        // Create a default variant
        const defaultVariant = {
          product_id: product.id,
          sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-DEFAULT`,
          name: 'Default Variant',
          selling_price: 99999, // TSh 99,999
          cost_price: 50000,    // TSh 50,000
          quantity: 10,
          min_quantity: 5,
          barcode: `${product.name.replace(/\s+/g, '').toUpperCase()}${Date.now()}`
        };

        const { data: newVariant, error: variantError } = await supabase
          .from('lats_product_variants')
          .insert(defaultVariant)
          .select()
          .single();

        if (variantError) {
          console.error(`  ❌ Error creating variant:`, variantError);
        } else {
          console.log(`  ✅ Created variant: ${newVariant.sku}`);
        }
      } else {
        // Fix existing variants
        for (const variant of product.lats_product_variants) {
          console.log(`  🔄 Fixing variant: ${variant.sku || variant.name}`);
          
          const updates = {};

          // Fix SKU if missing
          if (!variant.sku || variant.sku.trim() === '') {
            updates.sku = `${product.name.replace(/\s+/g, '-').toUpperCase()}-${variant.name?.replace(/\s+/g, '-').toUpperCase() || 'VARIANT'}`;
            console.log(`    📝 Fixed SKU: ${updates.sku}`);
          }

          // Fix selling price if missing or zero
          if (!variant.selling_price || variant.selling_price <= 0) {
            updates.selling_price = 99999; // TSh 99,999
            console.log(`    💰 Fixed price: TSh ${updates.selling_price}`);
          }

          // Fix cost price if missing or negative
          if (variant.cost_price === null || variant.cost_price === undefined || variant.cost_price < 0) {
            updates.cost_price = 50000; // TSh 50,000
            console.log(`    💸 Fixed cost: TSh ${updates.cost_price}`);
          }

          // Fix quantity if missing or negative
          if (variant.quantity === null || variant.quantity === undefined || variant.quantity < 0) {
            updates.quantity = 10;
            console.log(`    📦 Fixed quantity: ${updates.quantity}`);
          }

          // Fix min quantity if missing or negative
          if (!variant.min_quantity || variant.min_quantity < 0) {
            updates.min_quantity = 5;
            console.log(`    📊 Fixed min quantity: ${updates.min_quantity}`);
          }

          // Fix barcode if missing
          if (!variant.barcode) {
            updates.barcode = `${variant.sku || product.name.replace(/\s+/g, '').toUpperCase()}${Date.now()}`;
            console.log(`    🏷️ Fixed barcode: ${updates.barcode}`);
          }

          // Apply updates if there are any
          if (Object.keys(updates).length > 0) {
            const { data: updatedVariant, error: updateError } = await supabase
              .from('lats_product_variants')
              .update(updates)
              .eq('id', variant.id)
              .select()
              .single();

            if (updateError) {
              console.error(`    ❌ Error updating variant:`, updateError);
            } else {
              console.log(`    ✅ Variant updated successfully`);
            }
          } else {
            console.log(`    ✅ Variant is already complete`);
          }
        }
      }
    }

    console.log('\n🎉 Product data fix completed!');
    
  } catch (error) {
    console.error('❌ Error in fixIncompleteProduct:', error);
  }
}

// Run the fix
fixIncompleteProduct();
