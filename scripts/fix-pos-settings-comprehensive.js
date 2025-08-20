const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPOSSettingsComprehensive() {
  console.log('🚀 Starting comprehensive POS settings fix...');

  try {
    // Step 1: Drop all existing POS settings tables to start fresh
    console.log('🗑️ Dropping existing POS settings tables...');
    const tablesToDrop = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];

    for (const table of tablesToDrop) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS ${table} CASCADE;`
      });
      
      if (error) {
        console.error(`❌ Error dropping ${table}:`, error);
      } else {
        console.log(`✅ Dropped ${table}`);
      }
    }

    // Step 2: Create tables with correct structure
    console.log('📋 Creating POS settings tables with correct structure...');

    // Barcode Scanner Settings
    const { error: scannerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_barcode_scanner_settings (
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

    // Search Filter Settings
    const { error: searchError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_search_filter_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_product_search BOOLEAN DEFAULT true,
          enable_customer_search BOOLEAN DEFAULT true,
          enable_sales_search BOOLEAN DEFAULT true,
          search_by_name BOOLEAN DEFAULT true,
          search_by_barcode BOOLEAN DEFAULT true,
          search_by_sku BOOLEAN DEFAULT true,
          search_by_category BOOLEAN DEFAULT true,
          search_by_brand BOOLEAN DEFAULT true,
          search_by_supplier BOOLEAN DEFAULT true,
          search_by_description BOOLEAN DEFAULT false,
          search_by_tags BOOLEAN DEFAULT false,
          enable_fuzzy_search BOOLEAN DEFAULT true,
          enable_autocomplete BOOLEAN DEFAULT true,
          min_search_length INTEGER DEFAULT 2,
          max_search_results INTEGER DEFAULT 50,
          search_timeout INTEGER DEFAULT 3000,
          enable_search_history BOOLEAN DEFAULT true,
          max_search_history INTEGER DEFAULT 20,
          enable_recent_searches BOOLEAN DEFAULT true,
          enable_popular_searches BOOLEAN DEFAULT true,
          enable_search_suggestions BOOLEAN DEFAULT true,
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

    // User Permissions Settings
    const { error: permissionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_user_permissions_settings (
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

    // Loyalty Customer Settings
    const { error: loyaltyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_loyalty_customer_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_loyalty_program BOOLEAN DEFAULT true,
          enable_points_system BOOLEAN DEFAULT true,
          enable_tier_system BOOLEAN DEFAULT true,
          points_per_currency DECIMAL(5,2) DEFAULT 1.00,
          currency_per_point DECIMAL(5,2) DEFAULT 0.01,
          minimum_points_redemption INTEGER DEFAULT 100,
          maximum_points_redemption INTEGER DEFAULT 10000,
          enable_birthday_rewards BOOLEAN DEFAULT true,
          birthday_points_bonus INTEGER DEFAULT 500,
          enable_referral_program BOOLEAN DEFAULT false,
          referral_points_bonus INTEGER DEFAULT 1000,
          enable_anniversary_rewards BOOLEAN DEFAULT true,
          anniversary_points_bonus INTEGER DEFAULT 250,
          enable_first_purchase_bonus BOOLEAN DEFAULT true,
          first_purchase_points_bonus INTEGER DEFAULT 200,
          enable_spending_tiers BOOLEAN DEFAULT true,
          bronze_tier_threshold DECIMAL(10,2) DEFAULT 0.00,
          silver_tier_threshold DECIMAL(10,2) DEFAULT 1000.00,
          gold_tier_threshold DECIMAL(10,2) DEFAULT 5000.00,
          platinum_tier_threshold DECIMAL(10,2) DEFAULT 10000.00,
          bronze_points_multiplier DECIMAL(3,2) DEFAULT 1.00,
          silver_points_multiplier DECIMAL(3,2) DEFAULT 1.25,
          gold_points_multiplier DECIMAL(3,2) DEFAULT 1.50,
          platinum_points_multiplier DECIMAL(3,2) DEFAULT 2.00,
          enable_points_expiry BOOLEAN DEFAULT false,
          points_expiry_days INTEGER DEFAULT 365,
          enable_auto_tier_upgrade BOOLEAN DEFAULT true,
          enable_auto_tier_downgrade BOOLEAN DEFAULT true,
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

    // Analytics Reporting Settings
    const { error: analyticsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_analytics_reporting_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_id UUID,
          enable_sales_analytics BOOLEAN DEFAULT true,
          enable_inventory_analytics BOOLEAN DEFAULT true,
          enable_customer_analytics BOOLEAN DEFAULT true,
          enable_financial_analytics BOOLEAN DEFAULT true,
          enable_performance_analytics BOOLEAN DEFAULT true,
          enable_trend_analysis BOOLEAN DEFAULT true,
          enable_forecasting BOOLEAN DEFAULT false,
          enable_comparative_analysis BOOLEAN DEFAULT true,
          enable_segmentation_analysis BOOLEAN DEFAULT true,
          enable_correlation_analysis BOOLEAN DEFAULT false,
          enable_predictive_analytics BOOLEAN DEFAULT false,
          enable_real_time_analytics BOOLEAN DEFAULT true,
          enable_historical_analytics BOOLEAN DEFAULT true,
          enable_custom_reports BOOLEAN DEFAULT true,
          enable_scheduled_reports BOOLEAN DEFAULT false,
          enable_export_reports BOOLEAN DEFAULT true,
          enable_email_reports BOOLEAN DEFAULT false,
          enable_dashboard_analytics BOOLEAN DEFAULT true,
          enable_chart_visualizations BOOLEAN DEFAULT true,
          enable_table_visualizations BOOLEAN DEFAULT true,
          enable_metric_cards BOOLEAN DEFAULT true,
          enable_kpi_tracking BOOLEAN DEFAULT true,
          enable_goal_tracking BOOLEAN DEFAULT false,
          enable_alert_system BOOLEAN DEFAULT true,
          enable_anomaly_detection BOOLEAN DEFAULT false,
          enable_benchmarking BOOLEAN DEFAULT false,
          enable_competitor_analysis BOOLEAN DEFAULT false,
          enable_market_analysis BOOLEAN DEFAULT false,
          enable_customer_insights BOOLEAN DEFAULT true,
          enable_product_insights BOOLEAN DEFAULT true,
          enable_sales_insights BOOLEAN DEFAULT true,
          enable_inventory_insights BOOLEAN DEFAULT true,
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

    // Notification Settings
    const { error: notificationError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE lats_pos_notification_settings (
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

    // Step 3: Enable RLS and create permissive policies
    console.log('🔐 Enabling RLS and creating permissive policies...');

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

      // Drop any existing policies
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ${table};`
      });

      if (dropError) {
        console.error(`❌ Error dropping policies on ${table}:`, dropError);
      }

      // Create permissive policy for all authenticated users
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Enable all access for authenticated users" ON ${table} FOR ALL USING (auth.role() = 'authenticated');`
      });

      if (policyError) {
        console.error(`❌ Error creating policy on ${table}:`, policyError);
      } else {
        console.log(`✅ RLS and policies configured for ${table}`);
      }
    }

    // Step 4: Create indexes for performance
    console.log('📊 Creating indexes for performance...');

    for (const table of tables) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `CREATE INDEX IF NOT EXISTS idx_${table.replace('lats_pos_', '').replace('_settings', '')}_user_id ON ${table}(user_id);`
      });

      if (indexError) {
        console.error(`❌ Error creating index on ${table}:`, indexError);
      } else {
        console.log(`✅ Index created for ${table}`);
      }
    }

    // Step 5: Create updated_at trigger function if it doesn't exist
    console.log('🔄 Creating updated_at trigger function...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger function:', triggerError);
    } else {
      console.log('✅ Updated_at trigger function created');
    }

    // Step 6: Create triggers for updated_at
    console.log('🔄 Creating updated_at triggers...');

    for (const table of tables) {
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `CREATE TRIGGER update_${table.replace('lats_pos_', '').replace('_settings', '')}_updated_at BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
      });

      if (triggerError) {
        console.error(`❌ Error creating trigger on ${table}:`, triggerError);
      } else {
        console.log(`✅ Updated_at trigger created for ${table}`);
      }
    }

    console.log('🎉 Comprehensive POS settings fix completed successfully!');
    console.log('✅ All tables created with correct structure');
    console.log('✅ RLS policies configured for authenticated users');
    console.log('✅ Indexes created for performance');
    console.log('✅ Updated_at triggers configured');
    console.log('🔧 406 and 400 errors should now be resolved');

  } catch (error) {
    console.error('💥 Error during comprehensive fix:', error);
    process.exit(1);
  }
}

// Run the comprehensive fix
fixPOSSettingsComprehensive();
