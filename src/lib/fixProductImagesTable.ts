import { supabase } from './supabaseClient';

/**
 * Fix the product_images table by adding missing columns
 */
export async function fixProductImagesTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Fixing product_images table...');

    // Step 1: Check if mime_type column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'product_images')
      .eq('column_name', 'mime_type');

    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return { success: false, message: 'Failed to check table structure' };
    }

    if (columns && columns.length === 0) {
      console.log('📝 mime_type column does not exist, adding it...');
      
      // Add mime_type column using SQL
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE product_images 
          ADD COLUMN mime_type TEXT DEFAULT 'image/jpeg';
        `
      });

      if (alterError) {
        console.error('❌ Failed to add mime_type column:', alterError);
        return { success: false, message: `Failed to add mime_type column: ${alterError.message}` };
      }

      console.log('✅ mime_type column added successfully');
    } else {
      console.log('✅ mime_type column already exists');
    }

    // Step 2: Update existing records to have a default mime_type
    const { error: updateError } = await supabase
      .from('product_images')
      .update({ mime_type: 'image/jpeg' })
      .is('mime_type', null);

    if (updateError) {
      console.warn('⚠️ Failed to update existing records:', updateError);
    } else {
      console.log('✅ Updated existing records with default mime_type');
    }

    return { 
      success: true, 
      message: 'Product images table fixed successfully' 
    };

  } catch (error) {
    console.error('❌ Error fixing product_images table:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Check the current structure of the product_images table
 */
export async function checkProductImagesTable(): Promise<{ success: boolean; columns: string[]; message: string }> {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'product_images')
      .order('ordinal_position');

    if (error) {
      return { success: false, columns: [], message: `Failed to check table: ${error.message}` };
    }

    const columnNames = columns?.map(col => col.column_name) || [];
    
    return { 
      success: true, 
      columns: columnNames,
      message: `Found ${columnNames.length} columns in product_images table` 
    };

  } catch (error) {
    return { 
      success: false, 
      columns: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
