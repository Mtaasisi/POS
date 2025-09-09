#!/usr/bin/env node

/**
 * Script to create a database trigger that automatically creates default variants
 * for products that don't have any variants
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAutoVariantTrigger() {
  console.log('🔧 Creating auto-variant trigger...\n');

  try {
    // Create a function that will be called by the trigger
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to create default variant for a product
        CREATE OR REPLACE FUNCTION create_default_variant_for_product()
        RETURNS TRIGGER AS $$
        DECLARE
          variant_count INTEGER;
          default_sku TEXT;
        BEGIN
          -- Check if the product already has variants
          SELECT COUNT(*) INTO variant_count
          FROM lats_product_variants
          WHERE product_id = NEW.id;
          
          -- If no variants exist, create a default one
          IF variant_count = 0 THEN
            -- Generate a unique SKU for the default variant
            default_sku := UPPER(REPLACE(REPLACE(NEW.name, ' ', ''), '-', '')) || '-DEFAULT-' || EXTRACT(EPOCH FROM NOW())::TEXT;
            
            -- Insert the default variant
            INSERT INTO lats_product_variants (
              product_id,
              sku,
              name,
              attributes,
              cost_price,
              selling_price,
              quantity,
              min_quantity,
              barcode,
              weight,
              dimensions,
              created_at,
              updated_at
            ) VALUES (
              NEW.id,
              default_sku,
              'Default',
              '{}',
              COALESCE(NEW.cost_price, 0),
              COALESCE(NEW.selling_price, 0),
              COALESCE(NEW.stock_quantity, 0),
              COALESCE(NEW.min_stock_level, 0),
              NULL,
              NULL,
              NULL,
              NOW(),
              NOW()
            );
            
            -- Log the creation
            RAISE NOTICE 'Created default variant for product: % (ID: %)', NEW.name, NEW.id;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.error('❌ Error creating function:', functionError);
      return;
    }

    console.log('✅ Function created successfully');

    // Create the trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS auto_create_default_variant_trigger ON lats_products;
        
        -- Create the trigger
        CREATE TRIGGER auto_create_default_variant_trigger
          AFTER INSERT ON lats_products
          FOR EACH ROW
          EXECUTE FUNCTION create_default_variant_for_product();
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }

    console.log('✅ Trigger created successfully');

    // Test the trigger by creating a test product
    console.log('\n🧪 Testing the trigger...');
    
    const testProduct = {
      name: `Test Product - ${Date.now()}`,
      description: 'Test product to verify auto-variant creation',
      is_active: true,
      total_quantity: 0,
      total_value: 0
    };

    const { data: createdProduct, error: testError } = await supabase
      .from('lats_products')
      .insert([testProduct])
      .select()
      .single();

    if (testError) {
      console.error('❌ Error creating test product:', testError);
      return;
    }

    console.log('✅ Test product created:', createdProduct.name);

    // Check if default variant was created
    const { data: variants, error: variantCheckError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', createdProduct.id);

    if (variantCheckError) {
      console.error('❌ Error checking variants:', variantCheckError);
      return;
    }

    if (variants && variants.length > 0) {
      console.log('✅ Default variant created automatically:', variants[0].name);
      console.log('   SKU:', variants[0].sku);
    } else {
      console.log('❌ No default variant was created');
    }

    // Clean up test product
    await supabase
      .from('lats_products')
      .delete()
      .eq('id', createdProduct.id);

    console.log('🧹 Test product cleaned up');

    console.log('\n✅ Auto-variant trigger setup completed successfully!');
    console.log('💡 The trigger will now automatically create default variants for all new products');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
createAutoVariantTrigger()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
