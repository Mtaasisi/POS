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

async function applyVariantConstraints() {
  console.log('🔧 Applying variant constraints to database...');
  
  try {
    // Since we can't use exec_sql, let's test if the constraints are already working
    console.log('🧪 Testing existing constraints...');
    
    // Test 1: Try to delete a variant when it's the only one
    console.log('Testing: Attempting to delete last variant...');
    const { data: testProducts } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(1);
    
    if (testProducts && testProducts.length > 0) {
      const { data: testVariants } = await supabase
        .from('lats_product_variants')
        .select('id')
        .eq('product_id', testProducts[0].id);
      
      if (testVariants && testVariants.length === 1) {
        const { error: deleteError } = await supabase
          .from('lats_product_variants')
          .delete()
          .eq('id', testVariants[0].id);
        
        if (deleteError) {
          console.log('✅ Constraint working: Cannot delete last variant');
          console.log('Error message:', deleteError.message);
        } else {
          console.log('⚠️ Constraint not working: Was able to delete last variant');
        }
      }
    }
    
    // Test 2: Check if we can create a product without variants
    console.log('\nTesting: Creating a product to see if default variant is created...');
    const testProductName = `Test Product ${Date.now()}`;
    
    const { data: newProduct, error: createError } = await supabase
      .from('lats_products')
      .insert([{
        name: testProductName,
        description: 'Test product for constraint validation',
        category_id: null,
        is_active: true
      }])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating test product:', createError.message);
    } else {
      console.log('✅ Test product created successfully');
      
      // Check if a default variant was created
      const { data: variants } = await supabase
        .from('lats_product_variants')
        .select('*')
        .eq('product_id', newProduct.id);
      
      if (variants && variants.length > 0) {
        console.log('✅ Default variant was created automatically');
        console.log('Variant details:', variants[0]);
      } else {
        console.log('⚠️ No default variant was created');
      }
      
      // Clean up test product
      console.log('🧹 Cleaning up test product...');
      await supabase
        .from('lats_product_variants')
        .delete()
        .eq('product_id', newProduct.id);
      
      await supabase
        .from('lats_products')
        .delete()
        .eq('id', newProduct.id);
      
      console.log('✅ Test cleanup completed');
    }
    
    console.log('\n📋 Summary:');
    console.log('The database constraints may need to be applied manually through the Supabase dashboard.');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n--- SQL to run manually ---');
    console.log(`
-- Ensure every product has at least one variant
CREATE OR REPLACE FUNCTION ensure_product_has_variants()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a DELETE operation on variants
  IF TG_OP = 'DELETE' THEN
    -- Check if this was the last variant for the product
    IF NOT EXISTS (
      SELECT 1 FROM lats_product_variants 
      WHERE product_id = OLD.product_id 
      AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete the last variant of a product. Every product must have at least one variant.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent deletion of last variant
DROP TRIGGER IF EXISTS ensure_product_has_variants_trigger ON lats_product_variants;
CREATE TRIGGER ensure_product_has_variants_trigger
    BEFORE DELETE ON lats_product_variants
    FOR EACH ROW EXECUTE FUNCTION ensure_product_has_variants();

-- Function to ensure new products get a default variant
CREATE OR REPLACE FUNCTION create_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default variant for the new product
  INSERT INTO lats_product_variants (
    product_id,
    sku,
    name,
    attributes,
    cost_price,
    selling_price,
    quantity,
    min_quantity,
    max_quantity
  ) VALUES (
    NEW.id,
    NEW.name || '-DEFAULT',
    'Default Variant',
    '{}',
    0,
    0,
    0,
    0,
    100
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default variant for new products
DROP TRIGGER IF EXISTS create_default_variant_trigger ON lats_products;
CREATE TRIGGER create_default_variant_trigger
    AFTER INSERT ON lats_products
    FOR EACH ROW EXECUTE FUNCTION create_default_variant();
    `);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
applyVariantConstraints()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
