-- Fix POS Settings Tables - Part 3 (Final) - Remove Non-existent Business References
-- This migration fixes the business_id foreign key references for the final tables

-- =====================================================
-- USER PERMISSIONS SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_user_permissions_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
    -- General POS Access
    enable_pos_access BOOLEAN DEFAULT true,
    enable_sales_access BOOLEAN DEFAULT true,
    enable_refunds_access BOOLEAN DEFAULT false,
    enable_void_access BOOLEAN DEFAULT false,
    enable_discount_access BOOLEAN DEFAULT true,
    
    -- Inventory Permissions
    enable_inventory_view BOOLEAN DEFAULT true,
    enable_inventory_edit BOOLEAN DEFAULT false,
    enable_stock_adjustments BOOLEAN DEFAULT false,
    enable_product_creation BOOLEAN DEFAULT false,
    enable_product_deletion BOOLEAN DEFAULT false,
    
    -- Customer Permissions
    enable_customer_view BOOLEAN DEFAULT true,
    enable_customer_creation BOOLEAN DEFAULT true,
    enable_customer_edit BOOLEAN DEFAULT false,
    enable_customer_deletion BOOLEAN DEFAULT false,
    enable_customer_history BOOLEAN DEFAULT true,
    
    -- Financial Permissions
    enable_payment_processing BOOLEAN DEFAULT true,
    enable_cash_management BOOLEAN DEFAULT false,
    enable_daily_reports BOOLEAN DEFAULT true,
    enable_financial_reports BOOLEAN DEFAULT false,
    enable_tax_management BOOLEAN DEFAULT false,
    
    -- System Administration
    enable_settings_access BOOLEAN DEFAULT false,
    enable_user_management BOOLEAN DEFAULT false,
    enable_backup_restore BOOLEAN DEFAULT false,
    enable_system_maintenance BOOLEAN DEFAULT false,
    enable_api_access BOOLEAN DEFAULT false,
    
    -- Security Permissions
    enable_audit_logs BOOLEAN DEFAULT false,
    enable_security_settings BOOLEAN DEFAULT false,
    enable_password_reset BOOLEAN DEFAULT false,
    enable_session_management BOOLEAN DEFAULT false,
    enable_data_export BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- LOYALTY & CUSTOMER SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
    -- Loyalty Program
    enable_loyalty_program BOOLEAN DEFAULT true,
    loyalty_program_name VARCHAR(100) DEFAULT 'Customer Rewards',
    points_per_currency DECIMAL(10,2) DEFAULT 1.00,
    points_redemption_rate DECIMAL(10,2) DEFAULT 0.01,
    minimum_points_redemption INTEGER DEFAULT 100,
    points_expiry_days INTEGER DEFAULT 365 CHECK (points_expiry_days BETWEEN 30 AND 1095),
    
    -- Customer Management
    enable_customer_registration BOOLEAN DEFAULT true,
    require_customer_info BOOLEAN DEFAULT false,
    enable_customer_categories BOOLEAN DEFAULT true,
    enable_customer_tags BOOLEAN DEFAULT true,
    enable_customer_notes BOOLEAN DEFAULT true,
    
    -- Rewards
    enable_automatic_rewards BOOLEAN DEFAULT true,
    enable_manual_rewards BOOLEAN DEFAULT true,
    enable_birthday_rewards BOOLEAN DEFAULT true,
    enable_anniversary_rewards BOOLEAN DEFAULT false,
    enable_referral_rewards BOOLEAN DEFAULT false,
    
    -- Communication
    enable_email_communication BOOLEAN DEFAULT false,
    enable_sms_communication BOOLEAN DEFAULT true,
    enable_whatsapp_communication BOOLEAN DEFAULT false,
    enable_push_notifications BOOLEAN DEFAULT false,
    enable_marketing_emails BOOLEAN DEFAULT false,
    
    -- Customer Analytics
    enable_customer_analytics BOOLEAN DEFAULT true,
    enable_purchase_history BOOLEAN DEFAULT true,
    enable_spending_patterns BOOLEAN DEFAULT true,
    enable_customer_segmentation BOOLEAN DEFAULT false,
    enable_customer_insights BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- ANALYTICS & REPORTING SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
    -- General Analytics
    enable_analytics BOOLEAN DEFAULT true,
    enable_real_time_analytics BOOLEAN DEFAULT true,
    analytics_refresh_interval INTEGER DEFAULT 30 CHECK (analytics_refresh_interval BETWEEN 10 AND 300),
    enable_data_export BOOLEAN DEFAULT true,
    
    -- Sales Analytics
    enable_sales_analytics BOOLEAN DEFAULT true,
    enable_sales_trends BOOLEAN DEFAULT true,
    enable_product_performance BOOLEAN DEFAULT true,
    enable_customer_analytics BOOLEAN DEFAULT true,
    enable_revenue_tracking BOOLEAN DEFAULT true,
    
    -- Inventory Analytics
    enable_inventory_analytics BOOLEAN DEFAULT true,
    enable_stock_alerts BOOLEAN DEFAULT true,
    enable_low_stock_reports BOOLEAN DEFAULT true,
    enable_inventory_turnover BOOLEAN DEFAULT true,
    enable_supplier_analytics BOOLEAN DEFAULT true,
    
    -- Reporting Settings
    enable_automated_reports BOOLEAN DEFAULT true,
    report_generation_time TIME DEFAULT '06:00',
    enable_email_reports BOOLEAN DEFAULT true,
    enable_pdf_reports BOOLEAN DEFAULT true,
    enable_excel_reports BOOLEAN DEFAULT true,
    
    -- Dashboard Settings
    enable_custom_dashboard BOOLEAN DEFAULT true,
    enable_kpi_widgets BOOLEAN DEFAULT true,
    enable_chart_animations BOOLEAN DEFAULT true,
    enable_data_drill_down BOOLEAN DEFAULT true,
    enable_comparative_analysis BOOLEAN DEFAULT true,
    
    -- Advanced Settings
    enable_predictive_analytics BOOLEAN DEFAULT false,
    enable_data_retention BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365 CHECK (data_retention_days BETWEEN 30 AND 1095),
    enable_data_backup BOOLEAN DEFAULT true,
    enable_api_export BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- NOTIFICATION SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
    -- General Notifications
    enable_notifications BOOLEAN DEFAULT true,
    enable_sound_notifications BOOLEAN DEFAULT true,
    enable_visual_notifications BOOLEAN DEFAULT true,
    enable_push_notifications BOOLEAN DEFAULT false,
    notification_timeout INTEGER DEFAULT 5000 CHECK (notification_timeout BETWEEN 1000 AND 30000),
    
    -- Sales Notifications
    enable_sales_notifications BOOLEAN DEFAULT true,
    notify_on_sale_completion BOOLEAN DEFAULT true,
    notify_on_refund BOOLEAN DEFAULT true,
    notify_on_void BOOLEAN DEFAULT true,
    notify_on_discount BOOLEAN DEFAULT false,
    
    -- Inventory Notifications
    enable_inventory_notifications BOOLEAN DEFAULT true,
    notify_on_low_stock BOOLEAN DEFAULT true,
    low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold BETWEEN 1 AND 100),
    notify_on_out_of_stock BOOLEAN DEFAULT true,
    notify_on_stock_adjustment BOOLEAN DEFAULT false,
    
    -- Customer Notifications
    enable_customer_notifications BOOLEAN DEFAULT true,
    notify_on_customer_registration BOOLEAN DEFAULT false,
    notify_on_loyalty_points BOOLEAN DEFAULT true,
    notify_on_customer_birthday BOOLEAN DEFAULT false,
    notify_on_customer_anniversary BOOLEAN DEFAULT false,
    
    -- System Notifications
    enable_system_notifications BOOLEAN DEFAULT true,
    notify_on_system_errors BOOLEAN DEFAULT true,
    notify_on_backup_completion BOOLEAN DEFAULT false,
    notify_on_sync_completion BOOLEAN DEFAULT false,
    notify_on_maintenance BOOLEAN DEFAULT true,
    
    -- Communication Channels
    enable_email_notifications BOOLEAN DEFAULT false,
    enable_sms_notifications BOOLEAN DEFAULT true,
    enable_whatsapp_notifications BOOLEAN DEFAULT false,
    enable_in_app_notifications BOOLEAN DEFAULT true,
    enable_desktop_notifications BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- ADVANCED SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
    -- System Performance
    enable_performance_mode BOOLEAN DEFAULT false,
    enable_caching BOOLEAN DEFAULT true,
    cache_size INTEGER DEFAULT 100 CHECK (cache_size BETWEEN 10 AND 1000),
    enable_lazy_loading BOOLEAN DEFAULT true,
    max_concurrent_requests INTEGER DEFAULT 10 CHECK (max_concurrent_requests BETWEEN 1 AND 50),
    
    -- Database Settings
    enable_database_optimization BOOLEAN DEFAULT true,
    enable_auto_backup BOOLEAN DEFAULT true,
    backup_frequency VARCHAR(20) DEFAULT 'daily' CHECK (backup_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    enable_data_compression BOOLEAN DEFAULT true,
    enable_query_optimization BOOLEAN DEFAULT true,
    
    -- Security Settings
    enable_two_factor_auth BOOLEAN DEFAULT false,
    enable_session_timeout BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 30 CHECK (session_timeout_minutes BETWEEN 5 AND 480),
    enable_audit_logging BOOLEAN DEFAULT true,
    enable_encryption BOOLEAN DEFAULT true,
    
    -- API & Integration
    enable_api_access BOOLEAN DEFAULT false,
    enable_webhooks BOOLEAN DEFAULT false,
    enable_third_party_integrations BOOLEAN DEFAULT false,
    enable_data_sync BOOLEAN DEFAULT false,
    sync_interval INTEGER DEFAULT 60 CHECK (sync_interval BETWEEN 5 AND 1440),
    
    -- Developer Settings
    enable_debug_mode BOOLEAN DEFAULT false,
    enable_error_reporting BOOLEAN DEFAULT true,
    enable_performance_monitoring BOOLEAN DEFAULT true,
    enable_logging BOOLEAN DEFAULT true,
    log_level VARCHAR(10) DEFAULT 'info' CHECK (log_level IN ('error', 'warn', 'info', 'debug')),
    
    -- Advanced Features
    enable_experimental_features BOOLEAN DEFAULT false,
    enable_beta_features BOOLEAN DEFAULT false,
    enable_custom_scripts BOOLEAN DEFAULT false,
    enable_plugin_system BOOLEAN DEFAULT false,
    enable_auto_updates BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user_id and business_id lookups
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_user_business ON lats_pos_user_permissions_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_user_business ON lats_pos_loyalty_customer_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_user_business ON lats_pos_analytics_reporting_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_user_business ON lats_pos_notification_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_user_business ON lats_pos_advanced_settings(user_id, business_id);

-- Indexes for updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_updated ON lats_pos_user_permissions_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_updated ON lats_pos_loyalty_customer_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_updated ON lats_pos_analytics_reporting_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_updated ON lats_pos_notification_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_updated ON lats_pos_advanced_settings(updated_at);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all settings tables
CREATE TRIGGER update_pos_user_permissions_updated_at BEFORE UPDATE ON lats_pos_user_permissions_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_loyalty_customer_updated_at BEFORE UPDATE ON lats_pos_loyalty_customer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_analytics_reporting_updated_at BEFORE UPDATE ON lats_pos_analytics_reporting_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_notification_settings_updated_at BEFORE UPDATE ON lats_pos_notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_advanced_settings_updated_at BEFORE UPDATE ON lats_pos_advanced_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all settings tables
ALTER TABLE lats_pos_user_permissions_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_loyalty_customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_analytics_reporting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_advanced_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for each settings table
-- Users can only access their own settings or settings for businesses they own/manage
CREATE POLICY "Users can view their own settings" ON lats_pos_user_permissions_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_user_permissions_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_user_permissions_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_user_permissions_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_loyalty_customer_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_loyalty_customer_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_loyalty_customer_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_loyalty_customer_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_analytics_reporting_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_analytics_reporting_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_analytics_reporting_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_analytics_reporting_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_notification_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_advanced_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_advanced_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_advanced_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_advanced_settings FOR DELETE USING (auth.uid() = user_id);
