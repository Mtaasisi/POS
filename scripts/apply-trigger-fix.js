import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTriggerFix() {
  console.log('🔧 Applying product deletion trigger fix...');
  
  try {
    // Read the SQL fix
    const sqlFix = fs.readFileSync('scripts/fix-product-delete-trigger.sql', 'utf8');
    
    console.log('📋 SQL fix content:');
    console.log(sqlFix);
    
    // Apply the fix using rpc (we'll need to execute it as a function)
    // First, let's try to drop the existing trigger
    console.log('\n🗑️ Dropping existing trigger...');
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP TRIGGER IF EXISTS ensure_product_has_variants_trigger ON lats_product_variants;' 
    });
    
    if (dropError) {
      console.log('⚠️ Could not drop trigger via RPC, trying direct approach...');
    }
    
    // Let's try a different approach - create a new function that handles the deletion properly
    console.log('\n🔧 Creating new trigger function...');
    
    const newTriggerFunction = `
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
            -- Check if the product is being deleted (cascade)
            -- If the product still exists and this is the last variant, prevent deletion
            IF EXISTS (
              SELECT 1 FROM lats_products 
              WHERE id = OLD.product_id
            ) THEN
              RAISE EXCEPTION 'Cannot delete the last variant of a product. Every product must have at least one variant.';
            END IF;
            -- If product doesn't exist (being deleted), allow the variant deletion
          END IF;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Since we can't execute DDL via RPC easily, let's modify our approach
    // We'll update the deleteProduct function to handle this differently
    
    console.log('✅ Trigger fix prepared. The issue is that we need to modify the database schema.');
    console.log('📝 To fix this permanently, you need to run the SQL script in your Supabase dashboard:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Run the contents of scripts/fix-product-delete-trigger.sql');
    
  } catch (error) {
    console.error('❌ Error applying trigger fix:', error);
  }
}

applyTriggerFix();
