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

async function fixSaleItemsVariantNullable() {
  console.log('🔧 Fixing lats_sale_items variant_id nullable constraint...');
  
  try {
    // Step 1: Drop the existing foreign key constraint
    console.log('📝 Step 1: Dropping existing foreign key constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_sale_items 
        DROP CONSTRAINT IF EXISTS lats_sale_items_variant_id_fkey;
      `
    });
    
    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return;
    }
    
    console.log('✅ Foreign key constraint dropped');
    
    // Step 2: Make variant_id nullable
    console.log('📝 Step 2: Making variant_id nullable...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_sale_items 
        ALTER COLUMN variant_id DROP NOT NULL;
      `
    });
    
    if (alterError) {
      console.error('❌ Error making variant_id nullable:', alterError);
      return;
    }
    
    console.log('✅ variant_id is now nullable');
    
    // Step 3: Re-add the foreign key constraint
    console.log('📝 Step 3: Re-adding foreign key constraint...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT lats_sale_items_variant_id_fkey 
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;
      `
    });
    
    if (addError) {
      console.error('❌ Error adding foreign key constraint:', addError);
      return;
    }
    
    console.log('✅ Foreign key constraint re-added');
    
    // Step 4: Add comment
    console.log('📝 Step 4: Adding column comment...');
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN lats_sale_items.variant_id IS 'Nullable variant ID - null for single-variant products or when variant is not specified';
      `
    });
    
    if (commentError) {
      console.log('⚠️ Warning: Could not add comment:', commentError);
    } else {
      console.log('✅ Column comment added');
    }
    
    // Step 5: Verify the change
    console.log('📝 Step 5: Verifying the change...');
    const { data: tableInfo, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable')
      .eq('table_name', 'lats_sale_items')
      .eq('column_name', 'variant_id');
    
    if (verifyError) {
      console.error('❌ Error verifying change:', verifyError);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      const column = tableInfo[0];
      console.log(`✅ Verification: variant_id is_nullable = ${column.is_nullable}`);
      
      if (column.is_nullable === 'YES') {
        console.log('🎉 Success! variant_id is now nullable');
        console.log('🔧 This should fix the 400 error when creating sale items without variants');
      } else {
        console.log('❌ variant_id is still NOT NULL - the fix may not have worked');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixSaleItemsVariantNullable()
  .then(() => {
    console.log('🏁 Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
