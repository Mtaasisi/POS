const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSaleItemsSchema() {
  try {
    console.log('🔧 Fixing lats_sale_items table schema...');
    
    // Check if price column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'lats_sale_items')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Failed to check table columns:', columnsError);
      return;
    }
    
    const columnNames = columns.map(col => col.column_name);
    console.log('📋 Current columns in lats_sale_items:', columnNames);
    
    if (columnNames.includes('price')) {
      console.log('✅ Price column already exists');
      return;
    }
    
    console.log('🔧 Adding price column to lats_sale_items table...');
    
    // Add the price column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_sale_items 
        ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
      `
    });
    
    if (addColumnError) {
      console.error('❌ Failed to add price column:', addColumnError);
      return;
    }
    
    console.log('✅ Price column added successfully');
    
    // Update existing records to calculate price from total_price / quantity
    console.log('🔧 Updating existing records...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE lats_sale_items 
        SET price = CASE 
          WHEN quantity > 0 THEN total_price / quantity 
          ELSE 0 
        END;
      `
    });
    
    if (updateError) {
      console.error('❌ Failed to update existing records:', updateError);
      return;
    }
    
    console.log('✅ Existing records updated successfully');
    
    // Remove the default
    const { error: removeDefaultError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_sale_items 
        ALTER COLUMN price DROP DEFAULT;
      `
    });
    
    if (removeDefaultError) {
      console.error('❌ Failed to remove default:', removeDefaultError);
      return;
    }
    
    console.log('✅ Default removed successfully');
    console.log('🎉 lats_sale_items table schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  }
}

fixSaleItemsSchema();
