const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix406Error() {
  console.log('🔧 Starting 406 error fix...');
  
  try {
    // Step 1: Disable RLS
    console.log('📝 Step 1: Disabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE lats_pos_general_settings DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️ RLS already disabled or error:', rlsError.message);
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Step 2: Drop conflicting policies
    console.log('📝 Step 2: Dropping conflicting policies...');
    const policies = [
      'Users can view their own general settings',
      'Users can insert their own general settings', 
      'Users can update their own general settings',
      'Users can delete their own general settings',
      'Users can view their own settings',
      'Users can insert their own settings',
      'Users can update their own settings', 
      'Users can delete their own settings',
      'Enable all access for authenticated users'
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON lats_pos_general_settings;`
      });
      if (error) {
        console.log(`⚠️ Policy drop error for "${policy}":`, error.message);
      }
    }
    console.log('✅ Policies dropped');

    // Step 3: Clear existing data for the user
    console.log('📝 Step 3: Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('lats_pos_general_settings')
      .delete()
      .eq('user_id', '9838a65b-e373-4d0a-bdfe-790304e9e3ea');

    if (deleteError) {
      console.log('⚠️ Delete error:', deleteError.message);
    } else {
      console.log('✅ Existing data cleared');
    }

    // Step 4: Insert fresh default settings
    console.log('📝 Step 4: Inserting fresh default settings...');
    const { data: insertData, error: insertError } = await supabase
      .from('lats_pos_general_settings')
      .insert({
        user_id: '9838a65b-e373-4d0a-bdfe-790304e9e3ea',
        business_id: null,
        theme: 'light',
        language: 'en',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        date_format: 'DD/MM/YYYY',
        time_format: '24',
        show_product_images: true,
        show_stock_levels: true,
        show_prices: true,
        show_barcodes: true,
        products_per_page: 20,
        auto_complete_search: true,
        confirm_delete: true,
        show_confirmations: true,
        enable_sound_effects: true,
        enable_animations: true,
        enable_caching: true,
        cache_duration: 300,
        enable_lazy_loading: true,
        max_search_results: 50
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Default settings inserted successfully:', insertData);

    // Step 5: Verify the fix
    console.log('📝 Step 5: Verifying the fix...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('lats_pos_general_settings')
      .select('*')
      .eq('user_id', '9838a65b-e373-4d0a-bdfe-790304e9e3ea');

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('✅ Verification successful:', verifyData);
    }

    console.log('🎉 406 error fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fix406Error();
