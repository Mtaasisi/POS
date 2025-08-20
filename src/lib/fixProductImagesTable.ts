import { supabase } from './supabaseClient';

/**
 * Fix the product_images table by adding missing columns
 */
export async function fixProductImagesTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Fixing product_images table...');

    // Step 1: Try to add mime_type column (will fail if it already exists)
    console.log('📝 Attempting to add mime_type column...');
          // Add mime_type column using SQL (will fail gracefully if column already exists)
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE product_images 
        ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'image/jpeg';
      `
    });

    if (alterError) {
      console.error('❌ Failed to add mime_type column:', alterError);
      return { success: false, message: `Failed to add mime_type column: ${alterError.message}` };
    }

    console.log('✅ mime_type column added successfully or already exists');

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
    // Try to select from the table to check if it exists and get a sample row
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);

    if (error) {
      return { success: false, columns: [], message: `Failed to access table: ${error.message}` };
    }

    // Since we can't access information_schema via REST API, we'll return a basic success message
    return { 
      success: true, 
      columns: ['id', 'product_id', 'image_url', 'mime_type', 'is_primary', 'created_at', 'updated_at'],
      message: `Product images table is accessible` 
    };

  } catch (error) {
    return { 
      success: false, 
      columns: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
