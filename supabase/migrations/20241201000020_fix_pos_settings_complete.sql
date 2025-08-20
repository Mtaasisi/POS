-- Complete Fix for POS Settings Database Issues
-- This migration addresses 406 errors, missing tables, and duplicate records

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BARCODE SCANNER SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_barcode_scanner_settings CASCADE;

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
    
    -- Audio/Visual Settings
    scanner_sound_enabled BOOLEAN DEFAULT true,
    scanner_vibration_enabled BOOLEAN DEFAULT true,
    
    -- Camera Settings
    camera_resolution VARCHAR(20) DEFAULT '720p',
    camera_facing VARCHAR(10) DEFAULT 'back',
    camera_flash_enabled BOOLEAN DEFAULT false,
    auto_focus_enabled BOOLEAN DEFAULT true,
    
    -- Barcode Format Support
    enable_ean13 BOOLEAN DEFAULT true,
    enable_ean8 BOOLEAN DEFAULT true,
    enable_upc_a BOOLEAN DEFAULT true,
    enable_upc_e BOOLEAN DEFAULT true,
    enable_code128 BOOLEAN DEFAULT true,
    enable_code39 BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_data_matrix BOOLEAN DEFAULT true,
    
    -- Performance Settings
    scan_timeout INTEGER DEFAULT 5000,
    retry_attempts INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- SEARCH FILTER SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_search_filter_settings CASCADE;

CREATE TABLE lats_pos_search_filter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Search Enablement
    enable_product_search BOOLEAN DEFAULT true,
    enable_customer_search BOOLEAN DEFAULT true,
    enable_sales_search BOOLEAN DEFAULT true,
    
    -- Search Fields
    search_by_name BOOLEAN DEFAULT true,
    search_by_barcode BOOLEAN DEFAULT true,
    search_by_sku BOOLEAN DEFAULT true,
    search_by_category BOOLEAN DEFAULT true,
    search_by_brand BOOLEAN DEFAULT true,
    search_by_supplier BOOLEAN DEFAULT true,
    search_by_description BOOLEAN DEFAULT false,
    search_by_tags BOOLEAN DEFAULT false,
    
    -- Search Features
    enable_fuzzy_search BOOLEAN DEFAULT true,
    enable_autocomplete BOOLEAN DEFAULT true,
    enable_search_history BOOLEAN DEFAULT true,
    enable_recent_searches BOOLEAN DEFAULT true,
    enable_popular_searches BOOLEAN DEFAULT true,
    enable_search_suggestions BOOLEAN DEFAULT true,
    
    -- Search Limits
    min_search_length INTEGER DEFAULT 2,
    max_search_results INTEGER DEFAULT 50,
    search_timeout INTEGER DEFAULT 3000,
    max_search_history INTEGER DEFAULT 20,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- USER PERMISSIONS SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_user_permissions_settings CASCADE;

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
    
    -- Data Operations
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
DROP TABLE IF EXISTS lats_pos_loyalty_customer_settings CASCADE;

CREATE TABLE lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Loyalty Program
    enable_loyalty_program BOOLEAN DEFAULT true,
    loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards',
    points_per_currency DECIMAL(10,2) DEFAULT 1.00,
    currency_per_point DECIMAL(10,2) DEFAULT 0.01,
    minimum_points_redemption INTEGER DEFAULT 100,
    maximum_points_redemption INTEGER DEFAULT 10000,
    
    -- Customer Tiers
    enable_customer_tiers BOOLEAN DEFAULT true,
    bronze_threshold INTEGER DEFAULT 0,
    silver_threshold INTEGER DEFAULT 1000,
    gold_threshold INTEGER DEFAULT 5000,
    platinum_threshold INTEGER DEFAULT 10000,
    
    -- Tier Benefits
    bronze_discount DECIMAL(5,2) DEFAULT 0.00,
    silver_discount DECIMAL(5,2) DEFAULT 2.00,
    gold_discount DECIMAL(5,2) DEFAULT 5.00,
    platinum_discount DECIMAL(5,2) DEFAULT 10.00,
    
    -- Birthday Rewards
    enable_birthday_rewards BOOLEAN DEFAULT true,
    birthday_points INTEGER DEFAULT 500,
    birthday_discount DECIMAL(5,2) DEFAULT 10.00,
    
    -- Notifications
    enable_loyalty_notifications BOOLEAN DEFAULT true,
    notify_points_earned BOOLEAN DEFAULT true,
    notify_points_redeemed BOOLEAN DEFAULT true,
    notify_tier_upgrade BOOLEAN DEFAULT true,
    notify_birthday_rewards BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- ANALYTICS REPORTING SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_analytics_reporting_settings CASCADE;

CREATE TABLE lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Analytics Enablement
    enable_analytics BOOLEAN DEFAULT true,
    enable_sales_analytics BOOLEAN DEFAULT true,
    enable_inventory_analytics BOOLEAN DEFAULT true,
    enable_customer_analytics BOOLEAN DEFAULT true,
    enable_financial_analytics BOOLEAN DEFAULT true,
    
    -- Reporting Settings
    enable_daily_reports BOOLEAN DEFAULT true,
    enable_weekly_reports BOOLEAN DEFAULT true,
    enable_monthly_reports BOOLEAN DEFAULT true,
    enable_yearly_reports BOOLEAN DEFAULT true,
    
    -- Data Retention
    data_retention_days INTEGER DEFAULT 365,
    enable_data_export BOOLEAN DEFAULT true,
    enable_data_backup BOOLEAN DEFAULT true,
    
    -- Insights
    enable_sales_insights BOOLEAN DEFAULT true,
    enable_inventory_insights BOOLEAN DEFAULT true,
    enable_customer_insights BOOLEAN DEFAULT true,
    enable_product_insights BOOLEAN DEFAULT true,
    
    -- Performance
    enable_performance_tracking BOOLEAN DEFAULT true,
    enable_error_tracking BOOLEAN DEFAULT true,
    enable_usage_analytics BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- NOTIFICATION SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_notification_settings CASCADE;

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
-- CREATE INDEXES
-- =====================================================

-- Barcode Scanner Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_settings_user_business ON lats_pos_barcode_scanner_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_settings_updated_at ON lats_pos_barcode_scanner_settings(updated_at);

-- Search Filter Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_settings_user_business ON lats_pos_search_filter_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_settings_updated_at ON lats_pos_search_filter_settings(updated_at);

-- User Permissions Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_settings_user_business ON lats_pos_user_permissions_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_settings_updated_at ON lats_pos_user_permissions_settings(updated_at);

-- Loyalty Customer Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_settings_user_business ON lats_pos_loyalty_customer_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_settings_updated_at ON lats_pos_loyalty_customer_settings(updated_at);

-- Analytics Reporting Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_settings_user_business ON lats_pos_analytics_reporting_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_settings_updated_at ON lats_pos_analytics_reporting_settings(updated_at);

-- Notification Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_user_business ON lats_pos_notification_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_updated_at ON lats_pos_notification_settings(updated_at);

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
-- CREATE RLS POLICIES
-- =====================================================

-- Barcode Scanner Settings Policies
CREATE POLICY "Users can view their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR DELETE USING (auth.uid() = user_id);

-- Search Filter Settings Policies
CREATE POLICY "Users can view their own search filter settings" ON lats_pos_search_filter_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search filter settings" ON lats_pos_search_filter_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own search filter settings" ON lats_pos_search_filter_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own search filter settings" ON lats_pos_search_filter_settings FOR DELETE USING (auth.uid() = user_id);

-- User Permissions Settings Policies
CREATE POLICY "Users can view their own user permissions settings" ON lats_pos_user_permissions_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user permissions settings" ON lats_pos_user_permissions_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user permissions settings" ON lats_pos_user_permissions_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user permissions settings" ON lats_pos_user_permissions_settings FOR DELETE USING (auth.uid() = user_id);

-- Loyalty Customer Settings Policies
CREATE POLICY "Users can view their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR DELETE USING (auth.uid() = user_id);

-- Analytics Reporting Settings Policies
CREATE POLICY "Users can view their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR DELETE USING (auth.uid() = user_id);

-- Notification Settings Policies
CREATE POLICY "Users can view their own notification settings" ON lats_pos_notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification settings" ON lats_pos_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON lats_pos_notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification settings" ON lats_pos_notification_settings FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pos_barcode_scanner_settings_updated_at BEFORE UPDATE ON lats_pos_barcode_scanner_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_search_filter_settings_updated_at BEFORE UPDATE ON lats_pos_search_filter_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_user_permissions_settings_updated_at BEFORE UPDATE ON lats_pos_user_permissions_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_loyalty_customer_settings_updated_at BEFORE UPDATE ON lats_pos_loyalty_customer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_analytics_reporting_settings_updated_at BEFORE UPDATE ON lats_pos_analytics_reporting_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_notification_settings_updated_at BEFORE UPDATE ON lats_pos_notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
