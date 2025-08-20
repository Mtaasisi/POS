import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPOSSettings() {
  console.log('🚀 Fixing POS Settings Database Issues...');
  
  try {
    // Test if we can access the tables first
    const tablesToTest = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];
    
    console.log('🧪 Testing current table access...');
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error accessing ${table}:`, error.message);
        } else {
          console.log(`✅ ${table} is accessible`);
        }
      } catch (err) {
        console.log(`❌ Exception accessing ${table}:`, err.message);
      }
    }
    
    // Test with a specific user ID
    const testUserId = 'a7c9adb7-f525-4850-bd42-79a769f12953';
    console.log(`🧪 Testing with user ID: ${testUserId}`);
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', testUserId);
        
        if (error) {
          console.log(`❌ Error querying ${table} for user:`, error.message);
        } else {
          console.log(`✅ ${table} has ${data?.length || 0} records for user`);
        }
      } catch (err) {
        console.log(`❌ Exception querying ${table} for user:`, err.message);
      }
    }
    
    // Try to create a test record to see if RLS policies are working
    console.log('🧪 Testing record creation...');
    
    const testRecord = {
      user_id: testUserId,
      business_id: null,
      enable_barcode_scanner: true,
      enable_camera_scanner: true,
      enable_keyboard_input: true,
      enable_manual_entry: true,
      auto_add_to_cart: true,
      scanner_sound_enabled: true,
      scanner_vibration_enabled: true,
      camera_resolution: '720p',
      camera_facing: 'back',
      camera_flash_enabled: false,
      enable_ean13: true,
      enable_ean8: true,
      enable_upc_a: true,
      enable_upc_e: true,
      enable_code128: true,
      enable_code39: true,
      enable_qr_code: true,
      enable_data_matrix: true,
      scan_timeout: 5000,
      retry_attempts: 3,
      auto_focus_enabled: true
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_barcode_scanner_settings')
        .insert(testRecord)
        .select();
      
      if (error) {
        console.log(`❌ Error creating test record:`, error.message);
      } else {
        console.log(`✅ Test record created successfully:`, data);
        
        // Clean up the test record
        if (data && data[0]) {
          const { error: deleteError } = await supabase
            .from('lats_pos_barcode_scanner_settings')
            .delete()
            .eq('id', data[0].id);
          
          if (deleteError) {
            console.log(`⚠️ Error cleaning up test record:`, deleteError.message);
          } else {
            console.log(`✅ Test record cleaned up`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ Exception creating test record:`, err.message);
    }
    
    console.log('🎉 POS Settings test completed!');
    
  } catch (error) {
    console.error('💥 Error testing POS settings:', error);
  }
}

// Run the fix
fixPOSSettings();
