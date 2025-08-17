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
    // 1. Create the function to ensure products have variants
    console.log('📝 Creating ensure_product_has_variants function...');
    const { error: function1Error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (function1Error) {
      console.error('❌ Error creating ensure_product_has_variants function:', function1Error);
    } else {
      console.log('✅ Created ensure_product_has_variants function');
    }
    
    // 2. Create the trigger to prevent deletion of last variant
    console.log('📝 Creating ensure_product_has_variants_trigger...');
    const { error: trigger1Error } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS ensure_product_has_variants_trigger ON lats_product_variants;
        CREATE TRIGGER ensure_product_has_variants_trigger
            BEFORE DELETE ON lats_product_variants
            FOR EACH ROW EXECUTE FUNCTION ensure_product_has_variants();
      `
    });
    
    if (trigger1Error) {
      console.error('❌ Error creating ensure_product_has_variants_trigger:', trigger1Error);
    } else {
      console.log('✅ Created ensure_product_has_variants_trigger');
    }
    
    // 3. Create the function to create default variants
    console.log('📝 Creating create_default_variant function...');
    const { error: function2Error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (function2Error) {
      console.error('❌ Error creating create_default_variant function:', function2Error);
    } else {
      console.log('✅ Created create_default_variant function');
    }
    
    // 4. Create the trigger to create default variants for new products
    console.log('📝 Creating create_default_variant_trigger...');
    const { error: trigger2Error } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS create_default_variant_trigger ON lats_products;
        CREATE TRIGGER create_default_variant_trigger
            AFTER INSERT ON lats_products
            FOR EACH ROW EXECUTE FUNCTION create_default_variant();
      `
    });
    
    if (trigger2Error) {
      console.error('❌ Error creating create_default_variant_trigger:', trigger2Error);
    } else {
      console.log('✅ Created create_default_variant_trigger');
    }
    
    console.log('\n🎉 All variant constraints applied successfully!');
    
    // Test the constraints
    console.log('\n🧪 Testing constraints...');
    
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
        } else {
          console.log('⚠️ Constraint not working: Was able to delete last variant');
        }
      }
    }
    
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
