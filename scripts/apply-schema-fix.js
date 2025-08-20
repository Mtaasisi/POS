import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFix() {
  console.log('🚀 Applying schema fixes to remote database...');

  try {
    // Fix Loyalty Customer Settings Table
    console.log('\n📋 Fixing lats_pos_loyalty_customer_settings table...');
    
    const loyaltyFixes = [
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards'",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS points_redemption_rate DECIMAL(5,2) DEFAULT 0.01",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_customer_registration BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS require_customer_info BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_customer_categories BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_customer_tags BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_customer_notes BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_automatic_rewards BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_manual_rewards BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_email_communication BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_sms_communication BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_whatsapp_communication BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_push_notifications BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_marketing_emails BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_purchase_history BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_loyalty_customer_settings ADD COLUMN IF NOT EXISTS enable_spending_patterns BOOLEAN DEFAULT true"
    ];

    for (const fix of loyaltyFixes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: fix });
        if (error) {
          console.log(`⚠️  Warning for loyalty fix: ${error.message}`);
        } else {
          console.log(`✅ Applied loyalty fix: ${fix.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Warning for loyalty fix: ${err.message}`);
      }
    }

    // Fix Analytics Reporting Settings Table
    console.log('\n📊 Fixing lats_pos_analytics_reporting_settings table...');
    
    const analyticsFixes = [
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS analytics_refresh_interval INTEGER DEFAULT 30",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_data_export BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_sales_trends BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_product_performance BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_revenue_tracking BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_low_stock_reports BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_inventory_turnover BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_supplier_analytics BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_automated_reports BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS report_generation_time TIME DEFAULT '06:00'",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_pdf_reports BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_excel_reports BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_kpi_widgets BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_chart_animations BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_data_drill_down BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_predictive_analytics BOOLEAN DEFAULT false",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_data_retention BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 365",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_data_backup BOOLEAN DEFAULT true",
      "ALTER TABLE lats_pos_analytics_reporting_settings ADD COLUMN IF NOT EXISTS enable_api_export BOOLEAN DEFAULT false"
    ];

    for (const fix of analyticsFixes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: fix });
        if (error) {
          console.log(`⚠️  Warning for analytics fix: ${error.message}`);
        } else {
          console.log(`✅ Applied analytics fix: ${fix.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Warning for analytics fix: ${err.message}`);
      }
    }

    console.log('\n✅ Schema fixes completed!');
    console.log('🔄 The database tables should now match the application interfaces.');

  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
  }
}

// Run the fix
applySchemaFix();
