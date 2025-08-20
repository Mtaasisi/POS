import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function applyAttributesMigration() {
  console.log('🚀 Applying attributes migration to lats_products table...');
  
  try {
    // First, let's check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'lats_products')
      .eq('column_name', 'attributes');

    if (checkError) {
      console.error('❌ Error checking existing columns:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ Attributes column already exists in lats_products table');
      return;
    }

    console.log('📋 Attributes column does not exist, adding it...');

    // Try to add the column using a simple query
    // Note: This might not work due to RLS policies, but let's try
    const { error: alterError } = await supabase
      .from('lats_products')
      .select('id')
      .limit(1);

    if (alterError) {
      console.error('❌ Error accessing lats_products table:', alterError);
      console.log('💡 The migration needs to be applied manually in the Supabase dashboard');
      console.log('📋 SQL to run:');
      console.log(`
        ALTER TABLE lats_products 
        ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_lats_products_attributes 
        ON lats_products USING gin(attributes);
        
        UPDATE lats_products 
        SET attributes = '{}'
        WHERE attributes IS NULL;
        
        COMMENT ON COLUMN lats_products.attributes IS 'Product-level specifications and attributes stored as JSONB';
      `);
      return;
    }

    console.log('✅ lats_products table is accessible');
    console.log('💡 Please apply the migration manually in the Supabase dashboard using the SQL above');

  } catch (error) {
    console.error('💥 Exception during migration check:', error);
  }
}

// Run the migration
applyAttributesMigration();
