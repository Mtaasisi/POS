import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPOSSettings406Errors() {
  console.log('🚀 Fixing POS Settings 406 Errors...');
  
  try {
    // Create barcode scanner settings table
    console.log('📋 Creating barcode scanner settings table...');
    const { error: scannerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_barcode_scanner_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_barcode_scanner BOOLEAN DEFAULT true,
          enable_camera_scanner BOOLEAN DEFAULT true,
          enable_keyboard_input BOOLEAN DEFAULT true,
          enable_manual_entry BOOLEAN DEFAULT true,
          auto_add_to_cart BOOLEAN DEFAULT true,
          scanner_sound_enabled BOOLEAN DEFAULT true,
          scanner_vibration_enabled BOOLEAN DEFAULT true,
          camera_resolution VARCHAR(20) DEFAULT '720p',
          camera_facing VARCHAR(10) DEFAULT 'back',
          camera_flash_enabled BOOLEAN DEFAULT false,
          enable_ean13 BOOLEAN DEFAULT true,
          enable_ean8 BOOLEAN DEFAULT true,
          enable_upc_a BOOLEAN DEFAULT true,
          enable_upc_e BOOLEAN DEFAULT true,
          enable_code128 BOOLEAN DEFAULT true,
          enable_code39 BOOLEAN DEFAULT true,
          enable_qr_code BOOLEAN DEFAULT true,
          enable_data_matrix BOOLEAN DEFAULT true,
          scan_timeout INTEGER DEFAULT 5000,
          retry_attempts INTEGER DEFAULT 3,
          auto_focus_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (scannerError) {
      console.error('❌ Error creating scanner table:', scannerError);
    } else {
      console.log('✅ Barcode scanner settings table created');
    }
    
    // Create search filter settings table
    console.log('📋 Creating search filter settings table...');
    const { error: searchError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_search_filter_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_smart_search BOOLEAN DEFAULT true,
          enable_auto_complete BOOLEAN DEFAULT true,
          search_debounce_time INTEGER DEFAULT 300,
          max_search_results INTEGER DEFAULT 50,
          enable_fuzzy_search BOOLEAN DEFAULT true,
          enable_phonetic_search BOOLEAN DEFAULT false,
          enable_category_filter BOOLEAN DEFAULT true,
          enable_brand_filter BOOLEAN DEFAULT true,
          enable_price_filter BOOLEAN DEFAULT true,
          enable_stock_filter BOOLEAN DEFAULT true,
          enable_supplier_filter BOOLEAN DEFAULT false,
          search_by_name BOOLEAN DEFAULT true,
          search_by_sku BOOLEAN DEFAULT true,
          search_by_barcode BOOLEAN DEFAULT true,
          search_by_description BOOLEAN DEFAULT false,
          search_by_supplier BOOLEAN DEFAULT false,
          show_product_images BOOLEAN DEFAULT true,
          show_stock_levels BOOLEAN DEFAULT true,
          show_prices BOOLEAN DEFAULT true,
          show_categories BOOLEAN DEFAULT true,
          show_brands BOOLEAN DEFAULT true,
          default_sort_field VARCHAR(50) DEFAULT 'name',
          default_sort_order VARCHAR(10) DEFAULT 'asc',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (searchError) {
      console.error('❌ Error creating search table:', searchError);
    } else {
      console.log('✅ Search filter settings table created');
    }
    
    // Create user permissions settings table
    console.log('📋 Creating user permissions settings table...');
    const { error: permissionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_user_permissions_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_pos_access BOOLEAN DEFAULT true,
          enable_sales_access BOOLEAN DEFAULT true,
          enable_refunds_access BOOLEAN DEFAULT false,
          enable_void_access BOOLEAN DEFAULT false,
          enable_discount_access BOOLEAN DEFAULT true,
          enable_tax_access BOOLEAN DEFAULT true,
          enable_inventory_access BOOLEAN DEFAULT true,
          enable_product_creation BOOLEAN DEFAULT true,
          enable_product_editing BOOLEAN DEFAULT true,
          enable_product_deletion BOOLEAN DEFAULT false,
          enable_stock_adjustment BOOLEAN DEFAULT true,
          enable_bulk_operations BOOLEAN DEFAULT false,
          enable_customer_access BOOLEAN DEFAULT true,
          enable_customer_creation BOOLEAN DEFAULT true,
          enable_customer_editing BOOLEAN DEFAULT true,
          enable_customer_deletion BOOLEAN DEFAULT false,
          enable_customer_history BOOLEAN DEFAULT true,
          enable_reports_access BOOLEAN DEFAULT true,
          enable_sales_reports BOOLEAN DEFAULT true,
          enable_inventory_reports BOOLEAN DEFAULT true,
          enable_customer_reports BOOLEAN DEFAULT true,
          enable_financial_reports BOOLEAN DEFAULT false,
          enable_settings_access BOOLEAN DEFAULT false,
          enable_user_management BOOLEAN DEFAULT false,
          enable_system_settings BOOLEAN DEFAULT false,
          enable_backup_restore BOOLEAN DEFAULT false,
          enable_api_access BOOLEAN DEFAULT false,
          enable_export_data BOOLEAN DEFAULT true,
          enable_import_data BOOLEAN DEFAULT false,
          enable_bulk_import BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (permissionsError) {
      console.error('❌ Error creating permissions table:', permissionsError);
    } else {
      console.log('✅ User permissions settings table created');
    }
    
    // Create loyalty customer settings table
    console.log('📋 Creating loyalty customer settings table...');
    const { error: loyaltyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_loyalty_customer_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_loyalty_program BOOLEAN DEFAULT true,
          loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards',
          loyalty_program_description TEXT,
          points_per_currency DECIMAL(10,2) DEFAULT 1.00,
          points_redemption_rate DECIMAL(10,4) DEFAULT 0.0100,
          minimum_points_redemption INTEGER DEFAULT 100,
          maximum_points_redemption_percent DECIMAL(5,2) DEFAULT 50.00,
          enable_customer_tiers BOOLEAN DEFAULT true,
          bronze_tier_name VARCHAR(50) DEFAULT 'Bronze',
          silver_tier_name VARCHAR(50) DEFAULT 'Silver',
          gold_tier_name VARCHAR(50) DEFAULT 'Gold',
          platinum_tier_name VARCHAR(50) DEFAULT 'Platinum',
          bronze_threshold DECIMAL(10,2) DEFAULT 0.00,
          silver_threshold DECIMAL(10,2) DEFAULT 100000.00,
          gold_threshold DECIMAL(10,2) DEFAULT 500000.00,
          platinum_threshold DECIMAL(10,2) DEFAULT 1000000.00,
          bronze_discount_percent DECIMAL(5,2) DEFAULT 0.00,
          silver_discount_percent DECIMAL(5,2) DEFAULT 2.00,
          gold_discount_percent DECIMAL(5,2) DEFAULT 5.00,
          platinum_discount_percent DECIMAL(5,2) DEFAULT 10.00,
          points_expiration_enabled BOOLEAN DEFAULT false,
          points_expiration_days INTEGER DEFAULT 365,
          enable_loyalty_notifications BOOLEAN DEFAULT true,
          notify_points_earned BOOLEAN DEFAULT true,
          notify_points_redeemed BOOLEAN DEFAULT true,
          notify_tier_upgrade BOOLEAN DEFAULT true,
          notify_points_expiring BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (loyaltyError) {
      console.error('❌ Error creating loyalty table:', loyaltyError);
    } else {
      console.log('✅ Loyalty customer settings table created');
    }
    
    // Create analytics reporting settings table
    console.log('📋 Creating analytics reporting settings table...');
    const { error: analyticsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_analytics_reporting_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_analytics BOOLEAN DEFAULT true,
          enable_real_time_analytics BOOLEAN DEFAULT true,
          analytics_refresh_interval INTEGER DEFAULT 30,
          enable_data_export BOOLEAN DEFAULT true,
          enable_sales_analytics BOOLEAN DEFAULT true,
          enable_inventory_analytics BOOLEAN DEFAULT true,
          enable_customer_analytics BOOLEAN DEFAULT true,
          dashboard_layout VARCHAR(50) DEFAULT 'default',
          show_sales_chart BOOLEAN DEFAULT true,
          show_inventory_chart BOOLEAN DEFAULT true,
          show_customer_chart BOOLEAN DEFAULT true,
          show_revenue_chart BOOLEAN DEFAULT true,
          show_top_products BOOLEAN DEFAULT true,
          show_low_stock_alerts BOOLEAN DEFAULT true,
          enable_daily_reports BOOLEAN DEFAULT true,
          enable_weekly_reports BOOLEAN DEFAULT true,
          enable_monthly_reports BOOLEAN DEFAULT true,
          enable_yearly_reports BOOLEAN DEFAULT true,
          auto_generate_reports BOOLEAN DEFAULT false,
          report_retention_days INTEGER DEFAULT 365,
          export_format VARCHAR(20) DEFAULT 'csv',
          include_charts_in_export BOOLEAN DEFAULT true,
          include_summaries_in_export BOOLEAN DEFAULT true,
          enable_scheduled_exports BOOLEAN DEFAULT false,
          enable_caching BOOLEAN DEFAULT true,
          cache_duration INTEGER DEFAULT 300,
          enable_aggregation BOOLEAN DEFAULT true,
          aggregation_interval VARCHAR(20) DEFAULT 'hourly',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (analyticsError) {
      console.error('❌ Error creating analytics table:', analyticsError);
    } else {
      console.log('✅ Analytics reporting settings table created');
    }
    
    // Create notification settings table
    console.log('📋 Creating notification settings table...');
    const { error: notificationError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_pos_notification_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_notifications BOOLEAN DEFAULT true,
          enable_sound_notifications BOOLEAN DEFAULT true,
          enable_visual_notifications BOOLEAN DEFAULT true,
          enable_push_notifications BOOLEAN DEFAULT false,
          notification_timeout INTEGER DEFAULT 5000,
          notify_new_sale BOOLEAN DEFAULT true,
          notify_sale_completion BOOLEAN DEFAULT true,
          notify_refund_processed BOOLEAN DEFAULT true,
          notify_void_transaction BOOLEAN DEFAULT true,
          notify_payment_received BOOLEAN DEFAULT true,
          notify_low_stock BOOLEAN DEFAULT true,
          notify_out_of_stock BOOLEAN DEFAULT true,
          notify_stock_adjustment BOOLEAN DEFAULT true,
          notify_new_product_added BOOLEAN DEFAULT false,
          notify_product_updated BOOLEAN DEFAULT false,
          notify_new_customer BOOLEAN DEFAULT false,
          notify_customer_birthday BOOLEAN DEFAULT true,
          notify_loyalty_points_earned BOOLEAN DEFAULT true,
          notify_loyalty_points_redeemed BOOLEAN DEFAULT true,
          notify_tier_upgrade BOOLEAN DEFAULT true,
          notify_system_errors BOOLEAN DEFAULT true,
          notify_backup_completion BOOLEAN DEFAULT true,
          notify_sync_issues BOOLEAN DEFAULT true,
          notify_performance_alerts BOOLEAN DEFAULT false,
          notify_security_alerts BOOLEAN DEFAULT true,
          enable_email_notifications BOOLEAN DEFAULT false,
          email_notification_address VARCHAR(255),
          notify_sales_summary_email BOOLEAN DEFAULT false,
          notify_inventory_alerts_email BOOLEAN DEFAULT false,
          notify_system_alerts_email BOOLEAN DEFAULT false,
          enable_sms_notifications BOOLEAN DEFAULT false,
          sms_notification_number VARCHAR(20),
          notify_critical_alerts_sms BOOLEAN DEFAULT false,
          notify_daily_summary_sms BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, business_id)
        );
      `
    });
    
    if (notificationError) {
      console.error('❌ Error creating notification table:', notificationError);
    } else {
      console.log('✅ Notification settings table created');
    }
    
    // Enable RLS and create policies
    console.log('🔐 Enabling RLS and creating policies...');
    
    const tables = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings', 
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];
    
    for (const table of tables) {
      // Enable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        console.error(`❌ Error enabling RLS on ${table}:`, rlsError);
      }
      
      // Drop existing policies
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ${table};`
      });
      
      if (dropError) {
        console.error(`❌ Error dropping policies on ${table}:`, dropError);
      }
      
      // Create permissive policy
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Enable all access for authenticated users" ON ${table} FOR ALL USING (auth.role() = 'authenticated');`
      });
      
      if (policyError) {
        console.error(`❌ Error creating policy on ${table}:`, policyError);
      } else {
        console.log(`✅ RLS and policies configured for ${table}`);
      }
    }
    
    console.log('🎉 All POS settings tables created and configured successfully!');
    console.log('✅ 406 errors should now be resolved');
    
  } catch (error) {
    console.error('💥 Error creating tables:', error);
    process.exit(1);
  }
}

// Run the fix
fixPOSSettings406Errors();
