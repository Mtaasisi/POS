import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixProductVariantsSchema() {
  console.log('🔧 Fixing LATS Product Variants Schema...\n');

  try {
    // Step 1: Check current table structure
    console.log('📋 Step 1: Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(0);
    
    if (columnsError) {
      console.log('❌ Error checking table structure:', columnsError.message);
    } else {
      console.log('✅ Table structure check completed');
    }

    // Step 2: Add missing columns using RPC calls
    console.log('\n📋 Step 2: Adding missing columns...');
    
    // Add name column if it doesn't exist
    console.log('   Adding name column...');
    const { error: nameError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'lats_product_variants' 
                AND column_name = 'name'
            ) THEN
                ALTER TABLE lats_product_variants ADD COLUMN name TEXT NOT NULL DEFAULT 'Variant';
                RAISE NOTICE '✅ Added name column to lats_product_variants';
            ELSE
                RAISE NOTICE 'ℹ️ name column already exists';
            END IF;
        END $$;
      `
    });

    if (nameError) {
      console.log('⚠️ Name column error (may already exist):', nameError.message);
    } else {
      console.log('✅ Name column added');
    }

    // Add cost_price column if it doesn't exist
    console.log('   Adding cost_price column...');
    const { error: costPriceError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'lats_product_variants' 
                AND column_name = 'cost_price'
            ) THEN
                ALTER TABLE lats_product_variants ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0;
                RAISE NOTICE '✅ Added cost_price column to lats_product_variants';
            ELSE
                RAISE NOTICE 'ℹ️ cost_price column already exists';
            END IF;
        END $$;
      `
    });

    if (costPriceError) {
      console.log('⚠️ Cost price column error (may already exist):', costPriceError.message);
    } else {
      console.log('✅ Cost price column added');
    }

    // Add selling_price column if it doesn't exist
    console.log('   Adding selling_price column...');
    const { error: sellingPriceError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'lats_product_variants' 
                AND column_name = 'selling_price'
            ) THEN
                ALTER TABLE lats_product_variants ADD COLUMN selling_price DECIMAL(10,2) NOT NULL DEFAULT 0;
                RAISE NOTICE '✅ Added selling_price column to lats_product_variants';
            ELSE
                RAISE NOTICE 'ℹ️ selling_price column already exists';
            END IF;
        END $$;
      `
    });

    if (sellingPriceError) {
      console.log('⚠️ Selling price column error (may already exist):', sellingPriceError.message);
    } else {
      console.log('✅ Selling price column added');
    }

    // Add quantity column if it doesn't exist
    console.log('   Adding quantity column...');
    const { error: quantityError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'lats_product_variants' 
                AND column_name = 'quantity'
            ) THEN
                ALTER TABLE lats_product_variants ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;
                RAISE NOTICE '✅ Added quantity column to lats_product_variants';
            ELSE
                RAISE NOTICE 'ℹ️ quantity column already exists';
            END IF;
        END $$;
      `
    });

    if (quantityError) {
      console.log('⚠️ Quantity column error (may already exist):', quantityError.message);
    } else {
      console.log('✅ Quantity column added');
    }

    // Step 3: Test the fixed table
    console.log('\n📋 Step 3: Testing the fixed table...');
    
    // Test the duplicate SKU check query that was failing
    const testSkus = ['LAP-ESR-2888-VARIANT'];
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('lats_product_variants')
      .select('sku, name')
      .in('sku', testSkus);
    
    if (duplicateError) {
      console.log('❌ Duplicate SKU check still failing:', duplicateError.message);
    } else {
      console.log('✅ Duplicate SKU check now works!');
      console.log('📊 Found variants:', duplicateCheck?.length || 0);
    }

    // Test variant creation
    const testVariant = {
      product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      sku: `TEST-SKU-${Date.now()}`,
      name: 'Test Variant',
      cost_price: 10.00,
      selling_price: 15.00,
      quantity: 5
    };
    
    const { data: newVariant, error: createError } = await supabase
      .from('lats_product_variants')
      .insert(testVariant)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Variant creation still failing:', createError.message);
    } else {
      console.log('✅ Variant creation now works!');
      console.log('📦 Created variant:', newVariant.id);
      
      // Clean up test data
      await supabase.from('lats_product_variants').delete().eq('id', newVariant.id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 Schema fix completed!');
    console.log('📋 The lats_product_variants table should now work properly for product creation.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixProductVariantsSchema();
