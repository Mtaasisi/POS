-- Migration to fix schema mismatch between application interfaces and database tables
-- This addresses the 400 Bad Request errors when creating default records

-- =====================================================
-- FIX LOYALTY CUSTOMER SETTINGS TABLE
-- =====================================================

-- Add missing columns to match the LoyaltyCustomerSettings interface
ALTER TABLE lats_pos_loyalty_customer_settings 
ADD COLUMN IF NOT EXISTS loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards',
ADD COLUMN IF NOT EXISTS points_redemption_rate DECIMAL(5,2) DEFAULT 0.01,
ADD COLUMN IF NOT EXISTS enable_customer_registration BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_customer_info BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_customer_categories BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_customer_tags BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_customer_notes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_automatic_rewards BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_manual_rewards BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_email_communication BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_sms_communication BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_whatsapp_communication BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_push_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_marketing_emails BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_purchase_history BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_spending_patterns BOOLEAN DEFAULT true;

-- =====================================================
-- FIX ANALYTICS REPORTING SETTINGS TABLE
-- =====================================================

-- Add missing columns to match the AnalyticsReportingSettings interface
ALTER TABLE lats_pos_analytics_reporting_settings 
ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS analytics_refresh_interval INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_data_export BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sales_trends BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_product_performance BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_revenue_tracking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_stock_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_low_stock_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_inventory_turnover BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_supplier_analytics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_automated_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS report_generation_time TIME DEFAULT '06:00',
ADD COLUMN IF NOT EXISTS enable_pdf_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_excel_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_kpi_widgets BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_chart_animations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_data_drill_down BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_predictive_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_data_retention BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS enable_data_backup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_api_export BOOLEAN DEFAULT false;

-- =====================================================
-- VERIFY THE FIXES
-- =====================================================

-- Check if all required columns exist in loyalty customer settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lats_pos_loyalty_customer_settings' 
    AND column_name = 'loyalty_program_name'
  ) THEN
    RAISE EXCEPTION 'Missing column: loyalty_program_name in lats_pos_loyalty_customer_settings';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lats_pos_loyalty_customer_settings' 
    AND column_name = 'points_redemption_rate'
  ) THEN
    RAISE EXCEPTION 'Missing column: points_redemption_rate in lats_pos_loyalty_customer_settings';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lats_pos_analytics_reporting_settings' 
    AND column_name = 'enable_analytics'
  ) THEN
    RAISE EXCEPTION 'Missing column: enable_analytics in lats_pos_analytics_reporting_settings';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lats_pos_analytics_reporting_settings' 
    AND column_name = 'analytics_refresh_interval'
  ) THEN
    RAISE EXCEPTION 'Missing column: analytics_refresh_interval in lats_pos_analytics_reporting_settings';
  END IF;
  
  RAISE NOTICE '✅ All required columns have been added successfully';
END $$;
