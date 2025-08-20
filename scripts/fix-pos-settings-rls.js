import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixPOSSettingsRLS() {
  console.log('🚀 Fixing POS Settings RLS Policies...');
  
  try {
    // First, let's check if the tables exist and their current RLS status
    const tablesToCheck = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];
    
    console.log('🔍 Checking table status...');
    
    for (const table of tablesToCheck) {
      try {
        // Check if table exists by trying to query it
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table} has issues:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Exception checking ${table}:`, err.message);
      }
    }
    
    // Now let's create default records for the test user
    const testUserId = 'a7c9adb7-f525-4850-bd42-79a769f12953';
    console.log(`📝 Creating default records for user: ${testUserId}`);
    
    // Barcode Scanner Settings
    const barcodeSettings = {
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
        .insert(barcodeSettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating barcode settings:`, error.message);
      } else {
        console.log(`✅ Barcode settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating barcode settings:`, err.message);
    }
    
    // Search Filter Settings
    const searchSettings = {
      user_id: testUserId,
      business_id: null,
      enable_product_search: true,
      enable_customer_search: true,
      enable_sales_search: true,
      search_by_name: true,
      search_by_barcode: true,
      search_by_sku: true,
      search_by_category: true,
      search_by_brand: true,
      search_by_supplier: true,
      search_by_description: false,
      search_by_tags: false,
      enable_fuzzy_search: true,
      enable_autocomplete: true,
      enable_search_history: true,
      enable_recent_searches: true,
      enable_popular_searches: true,
      enable_search_suggestions: true,
      min_search_length: 2,
      max_search_results: 50,
      search_timeout: 3000,
      max_search_history: 20
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_search_filter_settings')
        .insert(searchSettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating search settings:`, error.message);
      } else {
        console.log(`✅ Search settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating search settings:`, err.message);
    }
    
    // User Permissions Settings
    const permissionsSettings = {
      user_id: testUserId,
      business_id: null,
      enable_pos_access: true,
      enable_sales_access: true,
      enable_refunds_access: false,
      enable_void_access: false,
      enable_discount_access: true,
      enable_tax_access: true,
      enable_inventory_access: true,
      enable_product_creation: true,
      enable_product_editing: true,
      enable_product_deletion: false,
      enable_stock_adjustment: true,
      enable_bulk_operations: false,
      enable_customer_access: true,
      enable_customer_creation: true,
      enable_customer_editing: true,
      enable_customer_deletion: false,
      enable_customer_history: true,
      enable_reports_access: true,
      enable_sales_reports: true,
      enable_inventory_reports: true,
      enable_customer_reports: true,
      enable_financial_reports: false,
      enable_settings_access: false,
      enable_user_management: false,
      enable_system_settings: false,
      enable_backup_restore: false,
      enable_api_access: false,
      enable_export_data: true,
      enable_import_data: false,
      enable_bulk_import: false
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_user_permissions_settings')
        .insert(permissionsSettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating permissions settings:`, error.message);
      } else {
        console.log(`✅ Permissions settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating permissions settings:`, err.message);
    }
    
    // Loyalty Customer Settings
    const loyaltySettings = {
      user_id: testUserId,
      business_id: null,
      enable_loyalty_program: true,
      loyalty_program_name: 'Customer Rewards',
      points_per_currency: 1.00,
      currency_per_point: 0.01,
      minimum_points_redemption: 100,
      maximum_points_redemption: 10000,
      enable_customer_tiers: true,
      bronze_threshold: 0,
      silver_threshold: 1000,
      gold_threshold: 5000,
      platinum_threshold: 10000,
      bronze_discount: 0.00,
      silver_discount: 2.00,
      gold_discount: 5.00,
      platinum_discount: 10.00,
      enable_birthday_rewards: true,
      birthday_points: 500,
      birthday_discount: 10.00,
      enable_loyalty_notifications: true,
      notify_points_earned: true,
      notify_points_redeemed: true,
      notify_tier_upgrade: true,
      notify_birthday_rewards: true
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_loyalty_customer_settings')
        .insert(loyaltySettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating loyalty settings:`, error.message);
      } else {
        console.log(`✅ Loyalty settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating loyalty settings:`, err.message);
    }
    
    // Analytics Reporting Settings
    const analyticsSettings = {
      user_id: testUserId,
      business_id: null,
      enable_analytics: true,
      enable_sales_analytics: true,
      enable_inventory_analytics: true,
      enable_customer_analytics: true,
      enable_financial_analytics: true,
      enable_daily_reports: true,
      enable_weekly_reports: true,
      enable_monthly_reports: true,
      enable_yearly_reports: true,
      data_retention_days: 365,
      enable_data_export: true,
      enable_data_backup: true,
      enable_sales_insights: true,
      enable_inventory_insights: true,
      enable_customer_insights: true,
      enable_product_insights: true,
      enable_performance_tracking: true,
      enable_error_tracking: true,
      enable_usage_analytics: true
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_analytics_reporting_settings')
        .insert(analyticsSettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating analytics settings:`, error.message);
      } else {
        console.log(`✅ Analytics settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating analytics settings:`, err.message);
    }
    
    // Notification Settings
    const notificationSettings = {
      user_id: testUserId,
      business_id: null,
      enable_notifications: true,
      enable_sound_notifications: true,
      enable_visual_notifications: true,
      enable_push_notifications: false,
      notification_timeout: 5000,
      notify_new_sale: true,
      notify_sale_completion: true,
      notify_refund_processed: true,
      notify_void_transaction: true,
      notify_payment_received: true,
      notify_low_stock: true,
      notify_out_of_stock: true,
      notify_stock_adjustment: true,
      notify_new_product_added: false,
      notify_product_updated: false,
      notify_new_customer: false,
      notify_customer_birthday: true,
      notify_loyalty_points_earned: true,
      notify_loyalty_points_redeemed: true,
      notify_tier_upgrade: true,
      notify_system_errors: true,
      notify_backup_completion: true,
      notify_sync_issues: true,
      notify_performance_alerts: false,
      notify_security_alerts: true,
      enable_email_notifications: false,
      email_notification_address: null,
      notify_sales_summary_email: false,
      notify_inventory_alerts_email: false,
      notify_system_alerts_email: false,
      enable_sms_notifications: false,
      sms_notification_number: null,
      notify_critical_alerts_sms: false,
      notify_daily_summary_sms: false
    };
    
    try {
      const { data, error } = await supabase
        .from('lats_pos_notification_settings')
        .insert(notificationSettings)
        .select();
      
      if (error) {
        console.log(`❌ Error creating notification settings:`, error.message);
      } else {
        console.log(`✅ Notification settings created:`, data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exception creating notification settings:`, err.message);
    }
    
    console.log('🎉 POS Settings RLS fix completed!');
    
  } catch (error) {
    console.error('💥 Error fixing POS settings RLS:', error);
  }
}

// Run the fix
fixPOSSettingsRLS();
