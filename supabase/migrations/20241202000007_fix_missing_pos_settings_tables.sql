-- Fix Missing POS Settings Tables Migration
-- This migration creates missing tables and fixes RLS policies for 406 errors

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BARCODE SCANNER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_barcode_scanner_settings (
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
CREATE TABLE IF NOT EXISTS lats_pos_search_filter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Search Settings
    enable_smart_search BOOLEAN DEFAULT true,
    enable_auto_complete BOOLEAN DEFAULT true,
    search_debounce_time INTEGER DEFAULT 300 CHECK (search_debounce_time BETWEEN 100 AND 1000),
    max_search_results INTEGER DEFAULT 50 CHECK (max_search_results BETWEEN 10 AND 200),
    enable_fuzzy_search BOOLEAN DEFAULT true,
    enable_phonetic_search BOOLEAN DEFAULT false,
    
    -- Filter Settings
    enable_category_filter BOOLEAN DEFAULT true,
    enable_brand_filter BOOLEAN DEFAULT true,
    enable_price_filter BOOLEAN DEFAULT true,
    enable_stock_filter BOOLEAN DEFAULT true,
    enable_supplier_filter BOOLEAN DEFAULT false,
    
    -- Search Fields
    search_by_name BOOLEAN DEFAULT true,
    search_by_sku BOOLEAN DEFAULT true,
    search_by_barcode BOOLEAN DEFAULT true,
    search_by_description BOOLEAN DEFAULT false,
    search_by_supplier BOOLEAN DEFAULT false,
    
    -- Display Settings
    show_product_images BOOLEAN DEFAULT true,
    show_stock_levels BOOLEAN DEFAULT true,
    show_prices BOOLEAN DEFAULT true,
    show_categories BOOLEAN DEFAULT true,
    show_brands BOOLEAN DEFAULT true,
    
    -- Sort Settings
    default_sort_field VARCHAR(50) DEFAULT 'name' CHECK (default_sort_field IN ('name', 'sku', 'price', 'stock', 'created_at', 'updated_at')),
    default_sort_order VARCHAR(10) DEFAULT 'asc' CHECK (default_sort_order IN ('asc', 'desc')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- USER PERMISSIONS SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_user_permissions_settings (
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
    
    -- Settings Access
    enable_settings_access BOOLEAN DEFAULT false,
    enable_user_management BOOLEAN DEFAULT false,
    enable_system_settings BOOLEAN DEFAULT false,
    enable_backup_restore BOOLEAN DEFAULT false,
    
    -- Advanced Features
    enable_api_access BOOLEAN DEFAULT false,
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
CREATE TABLE IF NOT EXISTS lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Loyalty Program
    enable_loyalty_program BOOLEAN DEFAULT true,
    loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards',
    loyalty_program_description TEXT,
    
    -- Points System
    points_per_currency DECIMAL(10,2) DEFAULT 1.00 CHECK (points_per_currency >= 0),
    points_redemption_rate DECIMAL(10,4) DEFAULT 0.0100 CHECK (points_redemption_rate >= 0),
    minimum_points_redemption INTEGER DEFAULT 100 CHECK (minimum_points_redemption >= 0),
    maximum_points_redemption_percent DECIMAL(5,2) DEFAULT 50.00 CHECK (maximum_points_redemption_percent BETWEEN 0 AND 100),
    
    -- Customer Tiers
    enable_customer_tiers BOOLEAN DEFAULT true,
    bronze_tier_name VARCHAR(50) DEFAULT 'Bronze',
    silver_tier_name VARCHAR(50) DEFAULT 'Silver',
    gold_tier_name VARCHAR(50) DEFAULT 'Gold',
    platinum_tier_name VARCHAR(50) DEFAULT 'Platinum',
    
    -- Tier Thresholds
    bronze_threshold DECIMAL(10,2) DEFAULT 0.00 CHECK (bronze_threshold >= 0),
    silver_threshold DECIMAL(10,2) DEFAULT 100000.00 CHECK (silver_threshold >= 0),
    gold_threshold DECIMAL(10,2) DEFAULT 500000.00 CHECK (gold_threshold >= 0),
    platinum_threshold DECIMAL(10,2) DEFAULT 1000000.00 CHECK (platinum_threshold >= 0),
    
    -- Tier Benefits
    bronze_discount_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (bronze_discount_percent BETWEEN 0 AND 100),
    silver_discount_percent DECIMAL(5,2) DEFAULT 2.00 CHECK (silver_discount_percent BETWEEN 0 AND 100),
    gold_discount_percent DECIMAL(5,2) DEFAULT 5.00 CHECK (gold_discount_percent BETWEEN 0 AND 100),
    platinum_discount_percent DECIMAL(5,2) DEFAULT 10.00 CHECK (platinum_discount_percent BETWEEN 0 AND 100),
    
    -- Expiration Settings
    points_expiration_enabled BOOLEAN DEFAULT false,
    points_expiration_days INTEGER DEFAULT 365 CHECK (points_expiration_days >= 0),
    
    -- Notifications
    enable_loyalty_notifications BOOLEAN DEFAULT true,
    notify_points_earned BOOLEAN DEFAULT true,
    notify_points_redeemed BOOLEAN DEFAULT true,
    notify_tier_upgrade BOOLEAN DEFAULT true,
    notify_points_expiring BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- ANALYTICS REPORTING SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Analytics Settings
    enable_analytics BOOLEAN DEFAULT true,
    enable_real_time_analytics BOOLEAN DEFAULT true,
    analytics_refresh_interval INTEGER DEFAULT 30 CHECK (analytics_refresh_interval BETWEEN 10 AND 300),
    enable_data_export BOOLEAN DEFAULT true,
    enable_sales_analytics BOOLEAN DEFAULT true,
    enable_inventory_analytics BOOLEAN DEFAULT true,
    enable_customer_analytics BOOLEAN DEFAULT true,
    
    -- Dashboard Settings
    dashboard_layout VARCHAR(50) DEFAULT 'default' CHECK (dashboard_layout IN ('default', 'compact', 'detailed', 'custom')),
    show_sales_chart BOOLEAN DEFAULT true,
    show_inventory_chart BOOLEAN DEFAULT true,
    show_customer_chart BOOLEAN DEFAULT true,
    show_revenue_chart BOOLEAN DEFAULT true,
    show_top_products BOOLEAN DEFAULT true,
    show_low_stock_alerts BOOLEAN DEFAULT true,
    
    -- Report Settings
    enable_daily_reports BOOLEAN DEFAULT true,
    enable_weekly_reports BOOLEAN DEFAULT true,
    enable_monthly_reports BOOLEAN DEFAULT true,
    enable_yearly_reports BOOLEAN DEFAULT true,
    auto_generate_reports BOOLEAN DEFAULT false,
    report_retention_days INTEGER DEFAULT 365 CHECK (report_retention_days >= 30),
    
    -- Export Settings
    export_format VARCHAR(20) DEFAULT 'csv' CHECK (export_format IN ('csv', 'excel', 'pdf', 'json')),
    include_charts_in_export BOOLEAN DEFAULT true,
    include_summaries_in_export BOOLEAN DEFAULT true,
    enable_scheduled_exports BOOLEAN DEFAULT false,
    
    -- Performance Settings
    enable_caching BOOLEAN DEFAULT true,
    cache_duration INTEGER DEFAULT 300 CHECK (cache_duration BETWEEN 60 AND 3600),
    enable_aggregation BOOLEAN DEFAULT true,
    aggregation_interval VARCHAR(20) DEFAULT 'hourly' CHECK (aggregation_interval IN ('minutely', 'hourly', 'daily', 'weekly')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- General Notifications
    enable_notifications BOOLEAN DEFAULT true,
    enable_sound_notifications BOOLEAN DEFAULT true,
    enable_visual_notifications BOOLEAN DEFAULT true,
    enable_push_notifications BOOLEAN DEFAULT false,
    notification_timeout INTEGER DEFAULT 5000 CHECK (notification_timeout BETWEEN 1000 AND 30000),
    
    -- Sales Notifications
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
-- CREATE PERMISSIVE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lats_pos_barcode_scanner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_search_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_user_permissions_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_loyalty_customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_analytics_reporting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_notification_settings;

-- Create permissive policies for all authenticated users
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_barcode_scanner_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_search_filter_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_user_permissions_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_loyalty_customer_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_analytics_reporting_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_notification_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_barcode_scanner_settings_user_id ON lats_pos_barcode_scanner_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_search_filter_settings_user_id ON lats_pos_search_filter_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_settings_user_id ON lats_pos_user_permissions_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer_settings_user_id ON lats_pos_loyalty_customer_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reporting_settings_user_id ON lats_pos_analytics_reporting_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON lats_pos_notification_settings(user_id);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
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
