-- Fix POS Settings Tables - Final Comprehensive Fix
-- This migration completely recreates all POS settings tables with proper structure and RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES TO START FRESH
-- =====================================================
DROP TABLE IF EXISTS lats_pos_barcode_scanner_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_search_filter_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_user_permissions_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_loyalty_customer_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_analytics_reporting_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_notification_settings CASCADE;

-- =====================================================
-- BARCODE SCANNER SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_barcode_scanner_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Scanner Settings
    enable_barcode_scanner BOOLEAN DEFAULT true,
    enable_camera_scanner BOOLEAN DEFAULT true,
    enable_keyboard_input BOOLEAN DEFAULT true,
    enable_manual_entry BOOLEAN DEFAULT true,
    auto_add_to_cart BOOLEAN DEFAULT true,
    scanner_sound_enabled BOOLEAN DEFAULT true,
    scanner_vibration_enabled BOOLEAN DEFAULT true,
    
    -- Camera Settings
    camera_resolution VARCHAR(20) DEFAULT '720p' CHECK (camera_resolution IN ('480p', '720p', '1080p')),
    camera_facing VARCHAR(10) DEFAULT 'back' CHECK (camera_facing IN ('front', 'back')),
    camera_flash_enabled BOOLEAN DEFAULT false,
    
    -- Barcode Formats
    enable_ean13 BOOLEAN DEFAULT true,
    enable_ean8 BOOLEAN DEFAULT true,
    enable_upc_a BOOLEAN DEFAULT true,
    enable_upc_e BOOLEAN DEFAULT true,
    enable_code128 BOOLEAN DEFAULT true,
    enable_code39 BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_data_matrix BOOLEAN DEFAULT true,
    
    -- Behavior Settings
    scan_timeout INTEGER DEFAULT 5000 CHECK (scan_timeout BETWEEN 1000 AND 30000),
    retry_attempts INTEGER DEFAULT 3 CHECK (retry_attempts BETWEEN 1 AND 10),
    auto_focus_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- SEARCH FILTER SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_search_filter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Search Settings
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
    
    -- Advanced Search
    enable_fuzzy_search BOOLEAN DEFAULT true,
    enable_autocomplete BOOLEAN DEFAULT true,
    min_search_length INTEGER DEFAULT 2,
    max_search_results INTEGER DEFAULT 50,
    search_timeout INTEGER DEFAULT 3000,
    
    -- Search History
    enable_search_history BOOLEAN DEFAULT true,
    max_search_history INTEGER DEFAULT 20,
    enable_recent_searches BOOLEAN DEFAULT true,
    enable_popular_searches BOOLEAN DEFAULT true,
    enable_search_suggestions BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- USER PERMISSIONS SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_user_permissions_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- POS Access
    enable_pos_access BOOLEAN DEFAULT true,
    enable_sales_access BOOLEAN DEFAULT true,
    enable_refunds_access BOOLEAN DEFAULT false,
    enable_void_access BOOLEAN DEFAULT false,
    enable_discount_access BOOLEAN DEFAULT true,
    enable_tax_access BOOLEAN DEFAULT true,
    
    -- Inventory Access
    enable_inventory_access BOOLEAN DEFAULT true,
    enable_product_creation BOOLEAN DEFAULT true,
    enable_product_editing BOOLEAN DEFAULT true,
    enable_product_deletion BOOLEAN DEFAULT false,
    enable_stock_adjustment BOOLEAN DEFAULT true,
    enable_bulk_operations BOOLEAN DEFAULT false,
    
    -- Customer Access
    enable_customer_access BOOLEAN DEFAULT true,
    enable_customer_creation BOOLEAN DEFAULT true,
    enable_customer_editing BOOLEAN DEFAULT true,
    enable_customer_deletion BOOLEAN DEFAULT false,
    enable_customer_history BOOLEAN DEFAULT true,
    
    -- Reports Access
    enable_reports_access BOOLEAN DEFAULT true,
    enable_sales_reports BOOLEAN DEFAULT true,
    enable_inventory_reports BOOLEAN DEFAULT true,
    enable_customer_reports BOOLEAN DEFAULT true,
    enable_financial_reports BOOLEAN DEFAULT false,
    
    -- System Access
    enable_settings_access BOOLEAN DEFAULT false,
    enable_user_management BOOLEAN DEFAULT false,
    enable_system_settings BOOLEAN DEFAULT false,
    enable_backup_restore BOOLEAN DEFAULT false,
    enable_api_access BOOLEAN DEFAULT false,
    
    -- Data Access
    enable_export_data BOOLEAN DEFAULT true,
    enable_import_data BOOLEAN DEFAULT false,
    enable_bulk_import BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- LOYALTY CUSTOMER SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Program Settings
    enable_loyalty_program BOOLEAN DEFAULT true,
    enable_points_system BOOLEAN DEFAULT true,
    enable_tier_system BOOLEAN DEFAULT true,
    
    -- Points Configuration
    points_per_currency DECIMAL(5,2) DEFAULT 1.00,
    currency_per_point DECIMAL(5,2) DEFAULT 0.01,
    minimum_points_redemption INTEGER DEFAULT 100,
    maximum_points_redemption INTEGER DEFAULT 10000,
    
    -- Rewards
    enable_birthday_rewards BOOLEAN DEFAULT true,
    birthday_points_bonus INTEGER DEFAULT 500,
    enable_referral_program BOOLEAN DEFAULT false,
    referral_points_bonus INTEGER DEFAULT 1000,
    enable_anniversary_rewards BOOLEAN DEFAULT true,
    anniversary_points_bonus INTEGER DEFAULT 250,
    enable_first_purchase_bonus BOOLEAN DEFAULT true,
    first_purchase_points_bonus INTEGER DEFAULT 200,
    
    -- Tier System
    enable_spending_tiers BOOLEAN DEFAULT true,
    bronze_tier_threshold DECIMAL(10,2) DEFAULT 0.00,
    silver_tier_threshold DECIMAL(10,2) DEFAULT 1000.00,
    gold_tier_threshold DECIMAL(10,2) DEFAULT 5000.00,
    platinum_tier_threshold DECIMAL(10,2) DEFAULT 10000.00,
    bronze_points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    silver_points_multiplier DECIMAL(3,2) DEFAULT 1.25,
    gold_points_multiplier DECIMAL(3,2) DEFAULT 1.50,
    platinum_points_multiplier DECIMAL(3,2) DEFAULT 2.00,
    
    -- Advanced Settings
    enable_points_expiry BOOLEAN DEFAULT false,
    points_expiry_days INTEGER DEFAULT 365,
    enable_auto_tier_upgrade BOOLEAN DEFAULT true,
    enable_auto_tier_downgrade BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- ANALYTICS REPORTING SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Analytics Types
    enable_sales_analytics BOOLEAN DEFAULT true,
    enable_inventory_analytics BOOLEAN DEFAULT true,
    enable_customer_analytics BOOLEAN DEFAULT true,
    enable_financial_analytics BOOLEAN DEFAULT true,
    enable_performance_analytics BOOLEAN DEFAULT true,
    
    -- Analysis Features
    enable_trend_analysis BOOLEAN DEFAULT true,
    enable_forecasting BOOLEAN DEFAULT false,
    enable_comparative_analysis BOOLEAN DEFAULT true,
    enable_segmentation_analysis BOOLEAN DEFAULT true,
    enable_correlation_analysis BOOLEAN DEFAULT false,
    enable_predictive_analytics BOOLEAN DEFAULT false,
    
    -- Data Access
    enable_real_time_analytics BOOLEAN DEFAULT true,
    enable_historical_analytics BOOLEAN DEFAULT true,
    enable_custom_reports BOOLEAN DEFAULT true,
    enable_scheduled_reports BOOLEAN DEFAULT false,
    enable_export_reports BOOLEAN DEFAULT true,
    enable_email_reports BOOLEAN DEFAULT false,
    
    -- Visualization
    enable_dashboard_analytics BOOLEAN DEFAULT true,
    enable_chart_visualizations BOOLEAN DEFAULT true,
    enable_table_visualizations BOOLEAN DEFAULT true,
    enable_metric_cards BOOLEAN DEFAULT true,
    
    -- Tracking
    enable_kpi_tracking BOOLEAN DEFAULT true,
    enable_goal_tracking BOOLEAN DEFAULT false,
    enable_alert_system BOOLEAN DEFAULT true,
    enable_anomaly_detection BOOLEAN DEFAULT false,
    
    -- Advanced Features
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

-- =====================================================
-- NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- General Notifications
    enable_notifications BOOLEAN DEFAULT true,
    enable_sound_notifications BOOLEAN DEFAULT true,
    enable_visual_notifications BOOLEAN DEFAULT true,
    enable_push_notifications BOOLEAN DEFAULT false,
    notification_timeout INTEGER DEFAULT 5000,
    
    -- Transaction Notifications
    notify_new_sale BOOLEAN DEFAULT true,
    notify_sale_completion BOOLEAN DEFAULT true,
    notify_refund_processed BOOLEAN DEFAULT true,
    notify_void_transaction BOOLEAN DEFAULT true,
    notify_payment_received BOOLEAN DEFAULT true,
    
    -- Inventory Notifications
    notify_low_stock BOOLEAN DEFAULT true,
    notify_out_of_stock BOOLEAN DEFAULT true,
    notify_stock_adjustment BOOLEAN DEFAULT true,
    notify_new_product_added BOOLEAN DEFAULT false,
    notify_product_updated BOOLEAN DEFAULT false,
    
    -- Customer Notifications
    notify_new_customer BOOLEAN DEFAULT false,
    notify_customer_birthday BOOLEAN DEFAULT true,
    notify_loyalty_points_earned BOOLEAN DEFAULT true,
    notify_loyalty_points_redeemed BOOLEAN DEFAULT true,
    notify_tier_upgrade BOOLEAN DEFAULT true,
    
    -- System Notifications
    notify_system_errors BOOLEAN DEFAULT true,
    notify_backup_completion BOOLEAN DEFAULT true,
    notify_sync_issues BOOLEAN DEFAULT true,
    notify_performance_alerts BOOLEAN DEFAULT false,
    notify_security_alerts BOOLEAN DEFAULT true,
    
    -- Email Notifications
    enable_email_notifications BOOLEAN DEFAULT false,
    email_notification_address VARCHAR(255),
    notify_sales_summary_email BOOLEAN DEFAULT false,
    notify_inventory_alerts_email BOOLEAN DEFAULT false,
    notify_system_alerts_email BOOLEAN DEFAULT false,
    
    -- SMS Notifications
    enable_sms_notifications BOOLEAN DEFAULT false,
    sms_notification_number VARCHAR(20),
    notify_critical_alerts_sms BOOLEAN DEFAULT false,
    notify_daily_summary_sms BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_barcode_scanner_settings_user_id ON lats_pos_barcode_scanner_settings(user_id);
CREATE INDEX idx_search_filter_settings_user_id ON lats_pos_search_filter_settings(user_id);
CREATE INDEX idx_user_permissions_settings_user_id ON lats_pos_user_permissions_settings(user_id);
CREATE INDEX idx_loyalty_customer_settings_user_id ON lats_pos_loyalty_customer_settings(user_id);
CREATE INDEX idx_analytics_reporting_settings_user_id ON lats_pos_analytics_reporting_settings(user_id);
CREATE INDEX idx_notification_settings_user_id ON lats_pos_notification_settings(user_id);

-- =====================================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_barcode_scanner_settings_updated_at 
    BEFORE UPDATE ON lats_pos_barcode_scanner_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_filter_settings_updated_at 
    BEFORE UPDATE ON lats_pos_search_filter_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_settings_updated_at 
    BEFORE UPDATE ON lats_pos_user_permissions_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_customer_settings_updated_at 
    BEFORE UPDATE ON lats_pos_loyalty_customer_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_reporting_settings_updated_at 
    BEFORE UPDATE ON lats_pos_analytics_reporting_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON lats_pos_notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE lats_pos_barcode_scanner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_search_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_user_permissions_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_loyalty_customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_analytics_reporting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_notification_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PERMISSIVE RLS POLICIES
-- =====================================================
-- Barcode Scanner Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_barcode_scanner_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Search Filter Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_search_filter_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- User Permissions Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_user_permissions_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Loyalty Customer Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_loyalty_customer_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Analytics Reporting Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_analytics_reporting_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Notification Settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_notification_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON lats_pos_barcode_scanner_settings TO authenticated;
GRANT ALL ON lats_pos_search_filter_settings TO authenticated;
GRANT ALL ON lats_pos_user_permissions_settings TO authenticated;
GRANT ALL ON lats_pos_loyalty_customer_settings TO authenticated;
GRANT ALL ON lats_pos_analytics_reporting_settings TO authenticated;
GRANT ALL ON lats_pos_notification_settings TO authenticated;
