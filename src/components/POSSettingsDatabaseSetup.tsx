import React, { useEffect, useState, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import DebugUtils from '../utils/debugUtils';

interface POSSettingsDatabaseSetupProps {
  children: React.ReactNode;
}

export const POSSettingsDatabaseSetup: React.FC<POSSettingsDatabaseSetupProps> = ({ children }) => {
  // Always call useContext at the top level
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const setupCompletedRef = useRef(false);

  useEffect(() => {
    if (!authContext || !currentUser || isSetupComplete || isSettingUp || setupCompletedRef.current) return;

    // Check if setup was already completed for this user
    const setupKey = `pos_setup_complete_${currentUser.id}`;
    const wasSetupCompleted = localStorage.getItem(setupKey);
    
    if (wasSetupCompleted === 'true') {
      DebugUtils.sessionLog('pos_setup_complete', '✅ POS setup already completed for this user, skipping...');
      setIsSetupComplete(true);
      setupCompletedRef.current = true;
      return;
    }

    const setupDatabase = async () => {
      setIsSettingUp(true);
      DebugUtils.log('🔧 Setting up POS settings database tables...');

      try {
        // Check if tables exist by trying to query them
        const tablesToCheck = [
          'lats_pos_barcode_scanner_settings',
          'lats_pos_search_filter_settings',
          'lats_pos_user_permissions_settings',
          'lats_pos_loyalty_customer_settings',
          'lats_pos_analytics_reporting_settings',
          'lats_pos_notification_settings'
        ];

        const missingTables: string[] = [];

        for (const table of tablesToCheck) {
          try {
            const { error } = await supabase
              .from(table)
              .select('id')
              .limit(1);

            if (error && error.code === '42P01') { // Table doesn't exist
              missingTables.push(table);
            }
          } catch (err) {
            console.log(`Table ${table} doesn't exist, will create it`);
            missingTables.push(table);
          }
        }

        if (missingTables.length === 0) {
          DebugUtils.log('✅ All POS settings tables already exist');
          
          // Create default records for the current user if they don't exist
          await createDefaultRecordsForUser();
          
          // Mark setup as complete
          localStorage.setItem(setupKey, 'true');
          setIsSetupComplete(true);
          setupCompletedRef.current = true;
          return;
        }

        DebugUtils.log(`📋 Creating ${missingTables.length} missing tables:`, missingTables);

        // Create missing tables using SQL
        for (const table of missingTables) {
          await createTable(table);
        }

        // Create default records for the current user
        await createDefaultRecordsForUser();

        DebugUtils.log('🎉 POS settings database setup completed');
        
        // Mark setup as complete
        localStorage.setItem(setupKey, 'true');
        setIsSetupComplete(true);
        setupCompletedRef.current = true;

      } catch (error) {
        console.error('❌ Error setting up POS settings database:', error);
        // Don't block the app if setup fails
        setIsSetupComplete(true);
        setupCompletedRef.current = true;
      } finally {
        setIsSettingUp(false);
      }
    };

    setupDatabase();
  }, [currentUser?.id, isSetupComplete, isSettingUp]); // Changed dependency to currentUser?.id

  const createTable = async (tableName: string) => {
    console.log(`📋 Creating table: ${tableName}`);

    const tableDefinitions: Record<string, string> = {
      'lats_pos_barcode_scanner_settings': `
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
        )
      `,
      'lats_pos_search_filter_settings': `
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
        )
      `,
      'lats_pos_user_permissions_settings': `
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
        )
      `,
      'lats_pos_loyalty_customer_settings': `
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
        )
      `,
      'lats_pos_analytics_reporting_settings': `
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
        )
      `,
      'lats_pos_notification_settings': `
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
        )
      `
    };

    const sql = tableDefinitions[tableName];
    if (!sql) {
      console.error(`❌ No definition found for table: ${tableName}`);
      return;
    }

    try {
      // Try to create the table using a direct SQL query
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Error creating table ${tableName}:`, error);
        // Try alternative approach - create table by inserting a dummy record
        await createTableByInsert(tableName);
      } else {
        console.log(`✅ Table ${tableName} created successfully`);
        
        // Enable RLS and create policies
        await setupRLSAndPolicies(tableName);
      }
    } catch (err) {
      console.error(`❌ Exception creating table ${tableName}:`, err);
      // Try alternative approach
      await createTableByInsert(tableName);
    }
  };

  const createTableByInsert = async (tableName: string) => {
    console.log(`🔄 Trying alternative approach for table: ${tableName}`);
    
    // This approach tries to create the table by attempting to insert data
    // The table will be created automatically if it doesn't exist (in some cases)
    try {
      const { error } = await supabase
        .from(tableName)
        .insert({
          user_id: currentUser?.id,
          business_id: null
        });

      if (error) {
        console.log(`⚠️ Table ${tableName} may not exist, but continuing...`);
      } else {
        console.log(`✅ Table ${tableName} created via insert`);
      }
    } catch (err) {
      console.log(`⚠️ Could not create table ${tableName} via insert`);
    }
  };

  const setupRLSAndPolicies = async (tableName: string) => {
    try {
      // Enable RLS
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
      });

      // Drop existing policies
      await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ${tableName};`
      });

      // Create permissive policy
      await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Enable all access for authenticated users" ON ${tableName} FOR ALL USING (auth.role() = 'authenticated');`
      });

      console.log(`✅ RLS and policies configured for ${tableName}`);
    } catch (err) {
      console.log(`⚠️ Could not configure RLS for ${tableName}, continuing...`);
    }
  };

  const createDefaultRecordsForUser = async () => {
    if (!currentUser) {
      console.error('❌ Cannot create default records: currentUser is null');
      return;
    }

    // Check if we've already created records for this user
    const recordsKey = `pos_records_created_${currentUser.id}`;
    const recordsCreated = localStorage.getItem(recordsKey);
    
    if (recordsCreated === 'true') {
      DebugUtils.log('✅ Default records already created for this user, skipping...');
      return;
    }

    DebugUtils.log(`🔧 Creating default records for user ${currentUser.id}...`);

    // Define the tables and their default data
    const tablesToInitialize = [
      {
        table: 'lats_pos_barcode_scanner_settings',
        data: {
          user_id: currentUser.id,
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
        }
      },
      {
        table: 'lats_pos_search_filter_settings',
        data: {
          user_id: currentUser.id,
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
          min_search_length: 2,
          max_search_results: 50,
          search_timeout: 3000,
          enable_search_history: true,
          max_search_history: 20,
          enable_recent_searches: true,
          enable_popular_searches: true,
          enable_search_suggestions: true
        }
      },
      {
        table: 'lats_pos_user_permissions_settings',
        data: {
          user_id: currentUser.id,
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
        }
      },
      {
        table: 'lats_pos_loyalty_customer_settings',
        data: {
          user_id: currentUser.id,
          business_id: null,
          enable_loyalty_program: true,
          enable_points_system: true,
          enable_tier_system: true,
          points_per_currency: 1.00,
          currency_per_point: 0.01,
          minimum_points_redemption: 100,
          maximum_points_redemption: 10000,
          enable_birthday_rewards: true,
          birthday_points_bonus: 500,
          enable_referral_program: false,
          referral_points_bonus: 1000,
          enable_anniversary_rewards: true,
          anniversary_points_bonus: 250,
          enable_first_purchase_bonus: true,
          first_purchase_points_bonus: 200,
          enable_spending_tiers: true,
          bronze_tier_threshold: 0.00,
          silver_tier_threshold: 1000.00,
          gold_tier_threshold: 5000.00,
          platinum_tier_threshold: 10000.00,
          bronze_points_multiplier: 1.00,
          silver_points_multiplier: 1.25,
          gold_points_multiplier: 1.50,
          platinum_points_multiplier: 2.00,
          enable_points_expiry: false,
          points_expiry_days: 365,
          enable_auto_tier_upgrade: true,
          enable_auto_tier_downgrade: true
        }
      },
      {
        table: 'lats_pos_analytics_reporting_settings',
        data: {
          user_id: currentUser.id,
          business_id: null,
          enable_sales_analytics: true,
          enable_inventory_analytics: true,
          enable_customer_analytics: true,
          enable_financial_analytics: true,
          enable_performance_analytics: true,
          enable_trend_analysis: true,
          enable_forecasting: false,
          enable_comparative_analysis: true,
          enable_segmentation_analysis: true,
          enable_correlation_analysis: false,
          enable_predictive_analytics: false,
          enable_real_time_analytics: true,
          enable_historical_analytics: true,
          enable_custom_reports: true,
          enable_scheduled_reports: false,
          enable_export_reports: true,
          enable_email_reports: false,
          enable_dashboard_analytics: true,
          enable_chart_visualizations: true,
          enable_table_visualizations: true,
          enable_metric_cards: true,
          enable_kpi_tracking: true,
          enable_goal_tracking: false,
          enable_alert_system: true,
          enable_anomaly_detection: false,
          enable_benchmarking: false,
          enable_competitor_analysis: false,
          enable_market_analysis: false,
          enable_customer_insights: true,
          enable_product_insights: true,
          enable_sales_insights: true,
          enable_inventory_insights: true
        }
      },
      {
        table: 'lats_pos_notification_settings',
        data: {
          user_id: currentUser.id,
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
        }
      }
    ];

    // Create default records for each table
    for (const { table, data } of tablesToInitialize) {
      try {
        // Check if record already exists - get all records for this user
        const { data: existing, error: checkError } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', currentUser.id);

        if (checkError) {
          console.error(`❌ Error checking ${table}:`, checkError);
          continue;
        }

        if (!existing || existing.length === 0) {
          // No records found, create default
          console.log(`📋 Creating default record for ${table}...`);
          
          const { error: insertError } = await supabase
            .from(table)
            .insert(data);

          if (insertError) {
            console.error(`❌ Error creating default record for ${table}:`, insertError);
          } else {
            console.log(`✅ Default record created for ${table}`);
          }
        } else if (existing.length === 1) {
          DebugUtils.throttledLog(`record_exists_${table}`, `✅ Record already exists for ${table}`, 5000);
        } else {
          // Only log this in development mode to reduce noise
          if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
            console.log(`⚠️ Multiple records found for ${table} (${existing.length}), keeping existing records`);
          }
        }
      } catch (err) {
        console.error(`💥 Exception creating default record for ${table}:`, err);
      }
    }

    DebugUtils.log(`🎉 Default records creation completed for user ${currentUser.id}`);
    
    // Mark records as created
    localStorage.setItem(recordsKey, 'true');
  };

  // Show loading state while auth context is not ready or while setting up
  if (isSettingUp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Setting up POS settings database...
          </p>
        </div>
      </div>
    );
  }

  // If auth context is not available, just render children
  if (!authContext) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
