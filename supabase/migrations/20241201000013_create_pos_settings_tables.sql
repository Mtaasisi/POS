-- Create POS Settings Tables Migration
-- This migration creates tables for all POS settings categories

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- GENERAL SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- Interface Settings
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'sw', 'fr')),
    currency VARCHAR(3) DEFAULT 'TZS',
    timezone VARCHAR(50) DEFAULT 'Africa/Dar_es_Salaam',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24' CHECK (time_format IN ('12', '24')),
    
    -- Display Settings
    show_product_images BOOLEAN DEFAULT true,
    show_stock_levels BOOLEAN DEFAULT true,
    show_prices BOOLEAN DEFAULT true,
    show_barcodes BOOLEAN DEFAULT true,
    products_per_page INTEGER DEFAULT 20 CHECK (products_per_page BETWEEN 10 AND 100),
    
    -- Behavior Settings
    auto_complete_search BOOLEAN DEFAULT true,
    confirm_delete BOOLEAN DEFAULT true,
    show_confirmations BOOLEAN DEFAULT true,
    enable_sound_effects BOOLEAN DEFAULT true,
    enable_animations BOOLEAN DEFAULT true,
    
    -- Performance Settings
    enable_caching BOOLEAN DEFAULT true,
    cache_duration INTEGER DEFAULT 300 CHECK (cache_duration BETWEEN 60 AND 3600),
    enable_lazy_loading BOOLEAN DEFAULT true,
    max_search_results INTEGER DEFAULT 50 CHECK (max_search_results BETWEEN 10 AND 200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- DYNAMIC PRICING SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_dynamic_pricing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- General Pricing
    enable_dynamic_pricing BOOLEAN DEFAULT true,
    enable_loyalty_pricing BOOLEAN DEFAULT true,
    enable_bulk_pricing BOOLEAN DEFAULT true,
    enable_time_based_pricing BOOLEAN DEFAULT false,
    enable_customer_pricing BOOLEAN DEFAULT false,
    enable_special_events BOOLEAN DEFAULT false,
    
    -- Loyalty Pricing
    loyalty_discount_percent DECIMAL(5,2) DEFAULT 5.00 CHECK (loyalty_discount_percent BETWEEN 0 AND 100),
    loyalty_points_threshold INTEGER DEFAULT 1000,
    loyalty_max_discount DECIMAL(5,2) DEFAULT 20.00 CHECK (loyalty_max_discount BETWEEN 0 AND 100),
    
    -- Bulk Pricing
    bulk_discount_enabled BOOLEAN DEFAULT true,
    bulk_discount_threshold INTEGER DEFAULT 10,
    bulk_discount_percent DECIMAL(5,2) DEFAULT 10.00 CHECK (bulk_discount_percent BETWEEN 0 AND 100),
    
    -- Time-based Pricing
    time_based_discount_enabled BOOLEAN DEFAULT false,
    time_based_start_time TIME DEFAULT '18:00',
    time_based_end_time TIME DEFAULT '22:00',
    time_based_discount_percent DECIMAL(5,2) DEFAULT 15.00 CHECK (time_based_discount_percent BETWEEN 0 AND 100),
    
    -- Customer-based Pricing
    customer_pricing_enabled BOOLEAN DEFAULT false,
    vip_customer_discount DECIMAL(5,2) DEFAULT 10.00 CHECK (vip_customer_discount BETWEEN 0 AND 100),
    regular_customer_discount DECIMAL(5,2) DEFAULT 5.00 CHECK (regular_customer_discount BETWEEN 0 AND 100),
    
    -- Special Events
    special_events_enabled BOOLEAN DEFAULT false,
    special_event_discount_percent DECIMAL(5,2) DEFAULT 20.00 CHECK (special_event_discount_percent BETWEEN 0 AND 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- RECEIPT SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- Template Settings
    receipt_template VARCHAR(50) DEFAULT 'standard' CHECK (receipt_template IN ('standard', 'compact', 'detailed', 'custom')),
    receipt_width INTEGER DEFAULT 80 CHECK (receipt_width BETWEEN 40 AND 120),
    receipt_font_size INTEGER DEFAULT 12 CHECK (receipt_font_size BETWEEN 8 AND 16),
    
    -- Content Settings
    show_business_logo BOOLEAN DEFAULT true,
    show_business_name BOOLEAN DEFAULT true,
    show_business_address BOOLEAN DEFAULT true,
    show_business_phone BOOLEAN DEFAULT true,
    show_business_email BOOLEAN DEFAULT false,
    show_business_website BOOLEAN DEFAULT false,
    
    -- Transaction Details
    show_transaction_id BOOLEAN DEFAULT true,
    show_date_time BOOLEAN DEFAULT true,
    show_cashier_name BOOLEAN DEFAULT true,
    show_customer_name BOOLEAN DEFAULT true,
    show_customer_phone BOOLEAN DEFAULT false,
    
    -- Product Details
    show_product_names BOOLEAN DEFAULT true,
    show_product_skus BOOLEAN DEFAULT false,
    show_product_barcodes BOOLEAN DEFAULT false,
    show_quantities BOOLEAN DEFAULT true,
    show_unit_prices BOOLEAN DEFAULT true,
    show_discounts BOOLEAN DEFAULT true,
    
    -- Totals
    show_subtotal BOOLEAN DEFAULT true,
    show_tax BOOLEAN DEFAULT true,
    show_discount_total BOOLEAN DEFAULT true,
    show_grand_total BOOLEAN DEFAULT true,
    show_payment_method BOOLEAN DEFAULT true,
    show_change_amount BOOLEAN DEFAULT true,
    
    -- Print Settings
    auto_print_receipt BOOLEAN DEFAULT false,
    print_duplicate_receipt BOOLEAN DEFAULT false,
    enable_email_receipt BOOLEAN DEFAULT false,
    enable_sms_receipt BOOLEAN DEFAULT false,
    
    -- Numbering
    enable_receipt_numbering BOOLEAN DEFAULT true,
    receipt_number_prefix VARCHAR(10) DEFAULT 'RCP',
    receipt_number_start INTEGER DEFAULT 1,
    receipt_number_format VARCHAR(20) DEFAULT 'RCP-{YEAR}-{NUMBER}',
    
    -- Footer
    show_footer_message BOOLEAN DEFAULT true,
    footer_message TEXT DEFAULT 'Thank you for your business!',
    show_return_policy BOOLEAN DEFAULT false,
    return_policy_text TEXT DEFAULT 'Returns accepted within 7 days with receipt',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- BARCODE SCANNER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_barcode_scanner_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- General Settings
    enable_barcode_scanner BOOLEAN DEFAULT true,
    enable_camera_scanner BOOLEAN DEFAULT true,
    enable_keyboard_input BOOLEAN DEFAULT true,
    enable_manual_entry BOOLEAN DEFAULT true,
    
    -- Behavior Settings
    auto_add_to_cart BOOLEAN DEFAULT true,
    auto_focus_search BOOLEAN DEFAULT true,
    play_sound_on_scan BOOLEAN DEFAULT true,
    vibrate_on_scan BOOLEAN DEFAULT true,
    show_scan_feedback BOOLEAN DEFAULT true,
    
    -- Error Handling
    show_invalid_barcode_alert BOOLEAN DEFAULT true,
    allow_unknown_products BOOLEAN DEFAULT false,
    prompt_for_unknown_products BOOLEAN DEFAULT true,
    retry_on_error BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 3 CHECK (max_retry_attempts BETWEEN 1 AND 10),
    
    -- Device Settings
    scanner_device_name VARCHAR(100),
    scanner_connection_type VARCHAR(20) DEFAULT 'usb' CHECK (scanner_connection_type IN ('usb', 'bluetooth', 'wifi')),
    scanner_timeout INTEGER DEFAULT 5000 CHECK (scanner_timeout BETWEEN 1000 AND 30000),
    
    -- Supported Codes
    support_ean13 BOOLEAN DEFAULT true,
    support_ean8 BOOLEAN DEFAULT true,
    support_upc_a BOOLEAN DEFAULT true,
    support_upc_e BOOLEAN DEFAULT true,
    support_code128 BOOLEAN DEFAULT true,
    support_code39 BOOLEAN DEFAULT true,
    support_qr_code BOOLEAN DEFAULT false,
    support_data_matrix BOOLEAN DEFAULT false,
    
    -- Advanced Settings
    enable_continuous_scanning BOOLEAN DEFAULT false,
    scan_delay INTEGER DEFAULT 100 CHECK (scan_delay BETWEEN 0 AND 1000),
    enable_scan_history BOOLEAN DEFAULT true,
    max_scan_history INTEGER DEFAULT 100 CHECK (max_scan_history BETWEEN 10 AND 1000),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- DELIVERY SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_delivery_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- General Delivery
    enable_delivery BOOLEAN DEFAULT true,
    default_delivery_fee INTEGER DEFAULT 2000,
    free_delivery_threshold INTEGER DEFAULT 50000,
    max_delivery_distance INTEGER DEFAULT 20 CHECK (max_delivery_distance BETWEEN 1 AND 100),
    
    -- Delivery Areas
    enable_delivery_areas BOOLEAN DEFAULT true,
    delivery_areas JSONB DEFAULT '["City Center", "Suburbs", "Outskirts"]',
    area_delivery_fees JSONB DEFAULT '{"City Center": 1500, "Suburbs": 2500, "Outskirts": 3500}',
    area_delivery_times JSONB DEFAULT '{"City Center": 30, "Suburbs": 60, "Outskirts": 90}',
    
    -- Time Settings
    enable_delivery_hours BOOLEAN DEFAULT true,
    delivery_start_time TIME DEFAULT '08:00',
    delivery_end_time TIME DEFAULT '20:00',
    enable_same_day_delivery BOOLEAN DEFAULT true,
    enable_next_day_delivery BOOLEAN DEFAULT true,
    delivery_time_slots JSONB DEFAULT '["Morning", "Afternoon", "Evening"]',
    
    -- Notification Settings
    notify_customer_on_delivery BOOLEAN DEFAULT true,
    notify_driver_on_assignment BOOLEAN DEFAULT true,
    enable_sms_notifications BOOLEAN DEFAULT true,
    enable_email_notifications BOOLEAN DEFAULT false,
    
    -- Driver Settings
    enable_driver_assignment BOOLEAN DEFAULT true,
    driver_commission DECIMAL(5,2) DEFAULT 15.00 CHECK (driver_commission BETWEEN 0 AND 50),
    require_signature BOOLEAN DEFAULT true,
    enable_driver_tracking BOOLEAN DEFAULT true,
    
    -- Advanced Settings
    enable_scheduled_delivery BOOLEAN DEFAULT false,
    enable_partial_delivery BOOLEAN DEFAULT false,
    require_advance_payment BOOLEAN DEFAULT false,
    advance_payment_percent INTEGER DEFAULT 50 CHECK (advance_payment_percent BETWEEN 0 AND 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- SEARCH & FILTER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_search_filter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
    -- General Search
    enable_smart_search BOOLEAN DEFAULT true,
    enable_auto_complete BOOLEAN DEFAULT true,
    search_debounce_time INTEGER DEFAULT 300 CHECK (search_debounce_time BETWEEN 100 AND 1000),
    max_search_results INTEGER DEFAULT 50 CHECK (max_search_results BETWEEN 10 AND 200),
    
    -- Search Behavior
    enable_fuzzy_search BOOLEAN DEFAULT true,
    enable_exact_match BOOLEAN DEFAULT true,
    enable_partial_match BOOLEAN DEFAULT true,
    search_in_description BOOLEAN DEFAULT true,
    search_in_barcode BOOLEAN DEFAULT true,
    
    -- Filter Settings
    enable_advanced_filters BOOLEAN DEFAULT true,
    enable_category_filter BOOLEAN DEFAULT true,
    enable_brand_filter BOOLEAN DEFAULT true,
    enable_price_filter BOOLEAN DEFAULT true,
    enable_stock_filter BOOLEAN DEFAULT true,
    
    -- Display Settings
    enable_search_history BOOLEAN DEFAULT true,
    max_search_history INTEGER DEFAULT 20 CHECK (max_search_history BETWEEN 5 AND 100),
    enable_recent_searches BOOLEAN DEFAULT true,
    enable_popular_searches BOOLEAN DEFAULT true,
    show_search_suggestions BOOLEAN DEFAULT true,
    
    -- Performance Settings
    enable_search_caching BOOLEAN DEFAULT true,
    cache_expiry_time INTEGER DEFAULT 300 CHECK (cache_expiry_time BETWEEN 60 AND 3600),
    enable_lazy_loading BOOLEAN DEFAULT true,
    search_timeout INTEGER DEFAULT 5000 CHECK (search_timeout BETWEEN 1000 AND 30000),
    
    -- Advanced Settings
    enable_voice_search BOOLEAN DEFAULT false,
    enable_barcode_search BOOLEAN DEFAULT true,
    enable_image_search BOOLEAN DEFAULT false,
    enable_synonyms BOOLEAN DEFAULT true,
    
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
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
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
-- LOYALTY & CUSTOMER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
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
-- ANALYTICS & REPORTING SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
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
-- NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
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
-- ADVANCED SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    
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
CREATE INDEX IF NOT EXISTS idx_pos_general_settings_user_business ON lats_pos_general_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_user_business ON lats_pos_dynamic_pricing_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_settings_user_business ON lats_pos_receipt_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_user_business ON lats_pos_barcode_scanner_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_settings_user_business ON lats_pos_delivery_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_user_business ON lats_pos_search_filter_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_user_business ON lats_pos_user_permissions_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_user_business ON lats_pos_loyalty_customer_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_user_business ON lats_pos_analytics_reporting_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_user_business ON lats_pos_notification_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_user_business ON lats_pos_advanced_settings(user_id, business_id);

-- Indexes for updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_pos_general_settings_updated ON lats_pos_general_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_updated ON lats_pos_dynamic_pricing_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_settings_updated ON lats_pos_receipt_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_updated ON lats_pos_barcode_scanner_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_settings_updated ON lats_pos_delivery_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_updated ON lats_pos_search_filter_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_updated ON lats_pos_user_permissions_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_updated ON lats_pos_loyalty_customer_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_updated ON lats_pos_analytics_reporting_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_notification_settings_updated ON lats_pos_notification_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_updated ON lats_pos_advanced_settings(updated_at);

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

-- Create triggers for all settings tables
CREATE TRIGGER update_pos_general_settings_updated_at BEFORE UPDATE ON lats_pos_general_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_dynamic_pricing_updated_at BEFORE UPDATE ON lats_pos_dynamic_pricing_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_receipt_settings_updated_at BEFORE UPDATE ON lats_pos_receipt_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_barcode_scanner_updated_at BEFORE UPDATE ON lats_pos_barcode_scanner_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_delivery_settings_updated_at BEFORE UPDATE ON lats_pos_delivery_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_search_filter_updated_at BEFORE UPDATE ON lats_pos_search_filter_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_user_permissions_updated_at BEFORE UPDATE ON lats_pos_user_permissions_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_loyalty_customer_updated_at BEFORE UPDATE ON lats_pos_loyalty_customer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_analytics_reporting_updated_at BEFORE UPDATE ON lats_pos_analytics_reporting_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_notification_settings_updated_at BEFORE UPDATE ON lats_pos_notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_advanced_settings_updated_at BEFORE UPDATE ON lats_pos_advanced_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all settings tables
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_dynamic_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_barcode_scanner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_search_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_user_permissions_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_loyalty_customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_analytics_reporting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_advanced_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for each settings table
-- Users can only access their own settings or settings for businesses they own/manage
CREATE POLICY "Users can view their own settings" ON lats_pos_general_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_general_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_general_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_general_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_dynamic_pricing_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_dynamic_pricing_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_dynamic_pricing_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_dynamic_pricing_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_receipt_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_receipt_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_receipt_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_receipt_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_barcode_scanner_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_barcode_scanner_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_barcode_scanner_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_barcode_scanner_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_delivery_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_delivery_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_delivery_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_delivery_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON lats_pos_search_filter_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON lats_pos_search_filter_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON lats_pos_search_filter_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON lats_pos_search_filter_settings FOR DELETE USING (auth.uid() = user_id);

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
