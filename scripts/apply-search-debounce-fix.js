const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSearchDebounceTimeField() {
  console.log('🚀 Adding search_debounce_time field to lats_pos_search_filter_settings table...');
  
  try {
    // Add the search_debounce_time column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_pos_search_filter_settings 
        ADD COLUMN IF NOT EXISTS search_debounce_time INTEGER DEFAULT 300 CHECK (search_debounce_time BETWEEN 100 AND 1000);
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding search_debounce_time column:', alterError);
      return;
    }
    
    console.log('✅ search_debounce_time column added successfully');
    
    // Update existing records to have the default value
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE lats_pos_search_filter_settings 
        SET search_debounce_time = 300 
        WHERE search_debounce_time IS NULL;
      `
    });
    
    if (updateError) {
      console.error('❌ Error updating existing records:', updateError);
      return;
    }
    
    console.log('✅ Existing records updated with default search_debounce_time value');
    
    // Verify the column was added
    const { data: columns, error: describeError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'lats_pos_search_filter_settings' 
        AND column_name = 'search_debounce_time';
      `
    });
    
    if (describeError) {
      console.error('❌ Error verifying column:', describeError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Column verification successful:', columns[0]);
    } else {
      console.log('⚠️ Column not found in verification query');
    }
    
    console.log('🎉 search_debounce_time field fix completed successfully!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
addSearchDebounceTimeField()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
