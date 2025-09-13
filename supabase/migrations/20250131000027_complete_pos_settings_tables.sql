-- Complete POS settings tables creation
-- Migration: 20250131000027_complete_pos_settings_tables.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENSURE AUTH_USERS TABLE EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    username TEXT,
    name TEXT,
    role TEXT DEFAULT 'technician',
    is_active BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for auth_users
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);

-- Enable Row Level Security for auth_users
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for auth_users (drop existing first)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON auth_users;
CREATE POLICY "Enable all access for authenticated users" ON auth_users
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON auth_users TO authenticated;
GRANT ALL ON auth_users TO anon;

-- =====================================================
-- CREATE LATS_POS_GENERAL_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
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
    
    -- Tax Settings
    enable_tax BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,2) DEFAULT 16.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_DYNAMIC_PRICING_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_dynamic_pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Dynamic Pricing Features
    enable_dynamic_pricing BOOLEAN DEFAULT true,
    enable_loyalty_pricing BOOLEAN DEFAULT true,
    enable_bulk_pricing BOOLEAN DEFAULT true,
    enable_time_based_pricing BOOLEAN DEFAULT false,
    enable_customer_pricing BOOLEAN DEFAULT false,
    enable_special_events BOOLEAN DEFAULT false,
    
    -- Loyalty Pricing
    loyalty_discount_percent DECIMAL(5,2) DEFAULT 5.00,
    loyalty_points_threshold INTEGER DEFAULT 1000,
    loyalty_max_discount DECIMAL(5,2) DEFAULT 20.00,
    
    -- Bulk Pricing
    bulk_discount_enabled BOOLEAN DEFAULT true,
    bulk_discount_threshold INTEGER DEFAULT 10,
    bulk_discount_percent DECIMAL(5,2) DEFAULT 10.00,
    
    -- Time-based Pricing
    time_based_discount_enabled BOOLEAN DEFAULT false,
    time_based_start_time TIME DEFAULT '18:00',
    time_based_end_time TIME DEFAULT '22:00',
    time_based_discount_percent DECIMAL(5,2) DEFAULT 15.00,
    
    -- Customer Pricing
    customer_pricing_enabled BOOLEAN DEFAULT false,
    vip_customer_discount DECIMAL(5,2) DEFAULT 10.00,
    regular_customer_discount DECIMAL(5,2) DEFAULT 5.00,
    
    -- Special Events
    special_events_enabled BOOLEAN DEFAULT false,
    special_event_discount_percent DECIMAL(5,2) DEFAULT 20.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_RECEIPT_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Receipt Template
    receipt_template VARCHAR(20) DEFAULT 'standard',
    receipt_width INTEGER DEFAULT 80,
    receipt_font_size INTEGER DEFAULT 12,
    
    -- Business Information
    show_business_logo BOOLEAN DEFAULT true,
    show_business_name BOOLEAN DEFAULT true,
    show_business_address BOOLEAN DEFAULT true,
    show_business_phone BOOLEAN DEFAULT true,
    show_business_email BOOLEAN DEFAULT false,
    show_business_website BOOLEAN DEFAULT false,
    
    -- Transaction Information
    show_transaction_id BOOLEAN DEFAULT true,
    show_date_time BOOLEAN DEFAULT true,
    show_cashier_name BOOLEAN DEFAULT true,
    show_customer_name BOOLEAN DEFAULT true,
    show_customer_phone BOOLEAN DEFAULT false,
    
    -- Product Information
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
    
    -- Printing Options
    auto_print_receipt BOOLEAN DEFAULT false,
    print_duplicate_receipt BOOLEAN DEFAULT false,
    enable_email_receipt BOOLEAN DEFAULT false,
    enable_sms_receipt BOOLEAN DEFAULT false,
    
    -- Receipt Numbering
    enable_receipt_numbering BOOLEAN DEFAULT true,
    receipt_number_prefix VARCHAR(10) DEFAULT 'RCP',
    receipt_number_start INTEGER DEFAULT 1,
    receipt_number_format VARCHAR(50) DEFAULT 'RCP-{YEAR}-{NUMBER}',
    
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
-- CREATE LATS_POS_BARCODE_SCANNER_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_barcode_scanner_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Scanner Configuration
    scanner_type VARCHAR(20) DEFAULT 'camera' CHECK (scanner_type IN ('camera', 'bluetooth', 'usb')),
    enable_auto_focus BOOLEAN DEFAULT true,
    enable_flash BOOLEAN DEFAULT false,
    scan_timeout INTEGER DEFAULT 5000,
    enable_sound BOOLEAN DEFAULT true,
    enable_vibration BOOLEAN DEFAULT true,
    
    -- Barcode Types
    enable_ean13 BOOLEAN DEFAULT true,
    enable_ean8 BOOLEAN DEFAULT true,
    enable_code128 BOOLEAN DEFAULT true,
    enable_code39 BOOLEAN DEFAULT true,
    enable_qr_code BOOLEAN DEFAULT true,
    enable_data_matrix BOOLEAN DEFAULT false,
    
    -- Search Behavior
    auto_search_on_scan BOOLEAN DEFAULT true,
    add_to_cart_on_scan BOOLEAN DEFAULT true,
    show_product_details BOOLEAN DEFAULT true,
    enable_quantity_input BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_DELIVERY_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Delivery Configuration
    enable_delivery BOOLEAN DEFAULT false,
    default_delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    free_delivery_threshold DECIMAL(10,2) DEFAULT 0.00,
    delivery_radius_km INTEGER DEFAULT 10,
    
    -- Delivery Areas
    delivery_areas JSONB DEFAULT '[]',
    
    -- Delivery Time
    estimated_delivery_time INTEGER DEFAULT 30,
    delivery_time_unit VARCHAR(10) DEFAULT 'minutes' CHECK (delivery_time_unit IN ('minutes', 'hours')),
    
    -- Delivery Options
    enable_scheduled_delivery BOOLEAN DEFAULT false,
    enable_express_delivery BOOLEAN DEFAULT false,
    express_delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    express_delivery_time INTEGER DEFAULT 15,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_SEARCH_FILTER_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_search_filter_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Search Configuration
    enable_fuzzy_search BOOLEAN DEFAULT true,
    search_min_length INTEGER DEFAULT 2,
    max_search_results INTEGER DEFAULT 50,
    search_timeout INTEGER DEFAULT 1000,
    
    -- Filter Options
    enable_category_filter BOOLEAN DEFAULT true,
    enable_brand_filter BOOLEAN DEFAULT true,
    enable_price_filter BOOLEAN DEFAULT true,
    enable_stock_filter BOOLEAN DEFAULT true,
    
    -- Search Fields
    search_in_name BOOLEAN DEFAULT true,
    search_in_sku BOOLEAN DEFAULT true,
    search_in_barcode BOOLEAN DEFAULT true,
    search_in_description BOOLEAN DEFAULT false,
    
    -- Display Options
    show_search_suggestions BOOLEAN DEFAULT true,
    max_suggestions INTEGER DEFAULT 10,
    highlight_search_terms BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_USER_PERMISSIONS_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_user_permissions_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- POS Permissions
    can_process_sales BOOLEAN DEFAULT true,
    can_void_transactions BOOLEAN DEFAULT false,
    can_apply_discounts BOOLEAN DEFAULT true,
    can_manage_inventory BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT true,
    can_manage_customers BOOLEAN DEFAULT true,
    can_manage_products BOOLEAN DEFAULT false,
    can_manage_settings BOOLEAN DEFAULT false,
    
    -- Discount Limits
    max_discount_percent DECIMAL(5,2) DEFAULT 10.00,
    max_discount_amount DECIMAL(10,2) DEFAULT 1000.00,
    require_manager_approval BOOLEAN DEFAULT false,
    
    -- Transaction Limits
    max_transaction_amount DECIMAL(10,2) DEFAULT 10000.00,
    max_daily_sales DECIMAL(10,2) DEFAULT 50000.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_LOYALTY_CUSTOMER_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_loyalty_customer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Loyalty Program
    enable_loyalty_program BOOLEAN DEFAULT false,
    points_per_currency DECIMAL(5,2) DEFAULT 1.00,
    currency_per_point DECIMAL(5,2) DEFAULT 0.01,
    min_points_to_redeem INTEGER DEFAULT 100,
    max_points_per_transaction INTEGER DEFAULT 1000,
    
    -- Customer Management
    enable_customer_registration BOOLEAN DEFAULT true,
    require_customer_info BOOLEAN DEFAULT false,
    enable_customer_history BOOLEAN DEFAULT true,
    enable_customer_notes BOOLEAN DEFAULT true,
    
    -- Customer Communication
    enable_sms_notifications BOOLEAN DEFAULT false,
    enable_email_notifications BOOLEAN DEFAULT false,
    enable_birthday_offers BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_ANALYTICS_REPORTING_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_analytics_reporting_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Analytics Configuration
    enable_analytics BOOLEAN DEFAULT true,
    enable_sales_analytics BOOLEAN DEFAULT true,
    enable_inventory_analytics BOOLEAN DEFAULT true,
    enable_customer_analytics BOOLEAN DEFAULT true,
    
    -- Reporting
    enable_daily_reports BOOLEAN DEFAULT true,
    enable_weekly_reports BOOLEAN DEFAULT true,
    enable_monthly_reports BOOLEAN DEFAULT true,
    auto_generate_reports BOOLEAN DEFAULT false,
    
    -- Data Retention
    data_retention_days INTEGER DEFAULT 365,
    enable_data_export BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_NOTIFICATION_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Notification Types
    enable_sale_notifications BOOLEAN DEFAULT true,
    enable_low_stock_notifications BOOLEAN DEFAULT true,
    enable_customer_notifications BOOLEAN DEFAULT true,
    enable_system_notifications BOOLEAN DEFAULT true,
    
    -- Notification Methods
    enable_in_app_notifications BOOLEAN DEFAULT true,
    enable_sound_notifications BOOLEAN DEFAULT true,
    enable_popup_notifications BOOLEAN DEFAULT true,
    enable_email_notifications BOOLEAN DEFAULT false,
    enable_sms_notifications BOOLEAN DEFAULT false,
    
    -- Notification Settings
    notification_sound VARCHAR(50) DEFAULT 'default',
    notification_duration INTEGER DEFAULT 5000,
    enable_notification_history BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE LATS_POS_ADVANCED_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_advanced_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Performance Settings
    enable_caching BOOLEAN DEFAULT true,
    cache_duration INTEGER DEFAULT 300,
    enable_lazy_loading BOOLEAN DEFAULT true,
    max_concurrent_requests INTEGER DEFAULT 10,
    
    -- Security Settings
    enable_audit_log BOOLEAN DEFAULT true,
    session_timeout INTEGER DEFAULT 3600,
    enable_two_factor_auth BOOLEAN DEFAULT false,
    require_password_change BOOLEAN DEFAULT false,
    
    -- Integration Settings
    enable_api_access BOOLEAN DEFAULT false,
    enable_webhook_notifications BOOLEAN DEFAULT false,
    enable_third_party_integrations BOOLEAN DEFAULT false,
    
    -- Backup Settings
    enable_auto_backup BOOLEAN DEFAULT true,
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    backup_retention_days INTEGER DEFAULT 30,
    
    -- Plugin System
    enable_plugin_system BOOLEAN DEFAULT false,
    enable_auto_updates BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES FOR ALL TABLES
-- =====================================================

-- General Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);

-- Dynamic Pricing Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_pricing_user_id ON lats_pos_dynamic_pricing_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_pricing_business_id ON lats_pos_dynamic_pricing_settings(business_id);

-- Receipt Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_receipt_user_id ON lats_pos_receipt_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_business_id ON lats_pos_receipt_settings(business_id);

-- Barcode Scanner Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_scanner_user_id ON lats_pos_barcode_scanner_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_scanner_business_id ON lats_pos_barcode_scanner_settings(business_id);

-- Delivery Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_delivery_user_id ON lats_pos_delivery_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_business_id ON lats_pos_delivery_settings(business_id);

-- Search Filter Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_search_user_id ON lats_pos_search_filter_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_search_business_id ON lats_pos_search_filter_settings(business_id);

-- User Permissions Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_permissions_user_id ON lats_pos_user_permissions_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_permissions_business_id ON lats_pos_user_permissions_settings(business_id);

-- Loyalty Customer Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_user_id ON lats_pos_loyalty_customer_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_business_id ON lats_pos_loyalty_customer_settings(business_id);

-- Analytics Reporting Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_analytics_user_id ON lats_pos_analytics_reporting_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_business_id ON lats_pos_analytics_reporting_settings(business_id);

-- Notification Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_notifications_user_id ON lats_pos_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_notifications_business_id ON lats_pos_notification_settings(business_id);

-- Advanced Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_advanced_user_id ON lats_pos_advanced_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_business_id ON lats_pos_advanced_settings(business_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY FOR ALL TABLES
-- =====================================================

-- Enable RLS for all POS settings tables
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

-- =====================================================
-- CREATE PERMISSIVE POLICIES FOR ALL TABLES
-- =====================================================

-- Drop existing policies and create new ones
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'lats_pos_general_settings',
        'lats_pos_dynamic_pricing_settings',
        'lats_pos_receipt_settings',
        'lats_pos_barcode_scanner_settings',
        'lats_pos_delivery_settings',
        'lats_pos_search_filter_settings',
        'lats_pos_user_permissions_settings',
        'lats_pos_loyalty_customer_settings',
        'lats_pos_analytics_reporting_settings',
        'lats_pos_notification_settings',
        'lats_pos_advanced_settings'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- Drop existing policy
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON %I', table_name);
        
        -- Create new permissive policy
        EXECUTE format('CREATE POLICY "Enable all access for authenticated users" ON %I FOR ALL USING (true)', table_name);
        
        -- Grant permissions
        EXECUTE format('GRANT ALL ON %I TO authenticated', table_name);
        EXECUTE format('GRANT ALL ON %I TO anon', table_name);
    END LOOP;
END $$;

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
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'auth_users',
        'lats_pos_general_settings',
        'lats_pos_dynamic_pricing_settings',
        'lats_pos_receipt_settings',
        'lats_pos_barcode_scanner_settings',
        'lats_pos_delivery_settings',
        'lats_pos_search_filter_settings',
        'lats_pos_user_permissions_settings',
        'lats_pos_loyalty_customer_settings',
        'lats_pos_analytics_reporting_settings',
        'lats_pos_notification_settings',
        'lats_pos_advanced_settings'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        FOREACH table_name IN ARRAY table_names
        LOOP
            -- Drop existing trigger
            EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', 
                replace(table_name, 'lats_pos_', ''), table_name);
            
            -- Create new trigger
            EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                replace(table_name, 'lats_pos_', ''), table_name);
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default technician users
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('2e50be86-f31d-4700-bca7-1e2da2bae8b3', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0),
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Insert default settings for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth_users WHERE role = 'technician'
    LOOP
        -- Insert default general settings
        INSERT INTO lats_pos_general_settings (
            user_id, business_id, theme, language, currency, timezone, date_format, time_format,
            show_product_images, show_stock_levels, show_prices, show_barcodes, products_per_page,
            auto_complete_search, confirm_delete, show_confirmations, enable_sound_effects, enable_animations,
            enable_caching, cache_duration, enable_lazy_loading, max_search_results, enable_tax, tax_rate
        ) VALUES (
            user_record.id, NULL, 'light', 'en', 'TZS', 'Africa/Dar_es_Salaam', 'DD/MM/YYYY', '24',
            true, true, true, true, 20, true, true, true, true, true, true, 300, true, 50, true, 16.00
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default receipt settings
        INSERT INTO lats_pos_receipt_settings (
            user_id, business_id, receipt_template, receipt_width, receipt_font_size,
            show_business_logo, show_business_name, show_business_address, show_business_phone,
            show_transaction_id, show_date_time, show_cashier_name, show_customer_name,
            show_product_names, show_quantities, show_unit_prices, show_discounts,
            show_subtotal, show_tax, show_grand_total, show_payment_method, show_change_amount,
            enable_receipt_numbering, receipt_number_prefix, receipt_number_start,
            show_footer_message, footer_message
        ) VALUES (
            user_record.id, NULL, 'standard', 80, 12, true, true, true, true,
            true, true, true, true, true, true, true, true, true, true, true, true, true,
            true, 'RCP', 1, true, 'Thank you for your business!'
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default dynamic pricing settings
        INSERT INTO lats_pos_dynamic_pricing_settings (
            user_id, business_id, enable_dynamic_pricing, enable_loyalty_pricing, enable_bulk_pricing,
            loyalty_discount_percent, loyalty_points_threshold, loyalty_max_discount,
            bulk_discount_enabled, bulk_discount_threshold, bulk_discount_percent
        ) VALUES (
            user_record.id, NULL, true, true, true, 5.00, 1000, 20.00, true, 10, 10.00
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default barcode scanner settings
        INSERT INTO lats_pos_barcode_scanner_settings (
            user_id, business_id, scanner_type, enable_auto_focus, enable_sound, enable_vibration,
            enable_ean13, enable_ean8, enable_code128, enable_code39, enable_qr_code,
            auto_search_on_scan, add_to_cart_on_scan, show_product_details
        ) VALUES (
            user_record.id, NULL, 'camera', true, true, true, true, true, true, true, true,
            true, true, true
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default delivery settings
        INSERT INTO lats_pos_delivery_settings (
            user_id, business_id, enable_delivery, default_delivery_fee, free_delivery_threshold,
            delivery_radius_km, estimated_delivery_time, delivery_time_unit
        ) VALUES (
            user_record.id, NULL, false, 0.00, 0.00, 10, 30, 'minutes'
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default search filter settings
        INSERT INTO lats_pos_search_filter_settings (
            user_id, business_id, enable_fuzzy_search, search_min_length, max_search_results,
            enable_category_filter, enable_brand_filter, enable_price_filter, enable_stock_filter,
            search_in_name, search_in_sku, search_in_barcode, show_search_suggestions, max_suggestions
        ) VALUES (
            user_record.id, NULL, true, 2, 50, true, true, true, true, true, true, true, true, 10
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default user permissions settings
        INSERT INTO lats_pos_user_permissions_settings (
            user_id, business_id, can_process_sales, can_void_transactions, can_apply_discounts,
            can_manage_inventory, can_view_reports, can_manage_customers, can_manage_products,
            max_discount_percent, max_discount_amount, max_transaction_amount, max_daily_sales
        ) VALUES (
            user_record.id, NULL, true, false, true, false, true, true, false,
            10.00, 1000.00, 10000.00, 50000.00
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default loyalty customer settings
        INSERT INTO lats_pos_loyalty_customer_settings (
            user_id, business_id, enable_loyalty_program, points_per_currency, currency_per_point,
            min_points_to_redeem, enable_customer_registration, require_customer_info, enable_customer_history
        ) VALUES (
            user_record.id, NULL, false, 1.00, 0.01, 100, true, false, true
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default analytics reporting settings
        INSERT INTO lats_pos_analytics_reporting_settings (
            user_id, business_id, enable_analytics, enable_sales_analytics, enable_inventory_analytics,
            enable_customer_analytics, enable_daily_reports, enable_weekly_reports, enable_monthly_reports,
            data_retention_days, enable_data_export
        ) VALUES (
            user_record.id, NULL, true, true, true, true, true, true, true, 365, true
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default notification settings
        INSERT INTO lats_pos_notification_settings (
            user_id, business_id, enable_sale_notifications, enable_low_stock_notifications,
            enable_customer_notifications, enable_system_notifications, enable_in_app_notifications,
            enable_sound_notifications, enable_popup_notifications, notification_sound, notification_duration
        ) VALUES (
            user_record.id, NULL, true, true, true, true, true, true, true, 'default', 5000
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
        
        -- Insert default advanced settings
        INSERT INTO lats_pos_advanced_settings (
            user_id, business_id, enable_caching, cache_duration, enable_lazy_loading,
            max_concurrent_requests, enable_audit_log, session_timeout, enable_auto_backup,
            backup_frequency, backup_retention_days, enable_auto_updates
        ) VALUES (
            user_record.id, NULL, true, 300, true, 10, true, 3600, true, 'daily', 30, true
        ) ON CONFLICT (user_id, business_id) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================
DO $$
BEGIN
  -- Check if all tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_users') THEN
    RAISE EXCEPTION 'Table auth_users was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_general_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_general_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_receipt_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_receipt_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_dynamic_pricing_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_dynamic_pricing_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_barcode_scanner_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_barcode_scanner_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_delivery_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_delivery_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_search_filter_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_search_filter_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_user_permissions_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_user_permissions_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_loyalty_customer_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_loyalty_customer_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_analytics_reporting_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_analytics_reporting_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_notification_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_notification_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_advanced_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_advanced_settings was not created';
  END IF;
  
  RAISE NOTICE '✅ All POS settings tables have been created successfully';
  RAISE NOTICE '✅ Auth users: % rows', (SELECT COUNT(*) FROM auth_users);
  RAISE NOTICE '✅ POS general settings: % rows', (SELECT COUNT(*) FROM lats_pos_general_settings);
  RAISE NOTICE '✅ POS receipt settings: % rows', (SELECT COUNT(*) FROM lats_pos_receipt_settings);
  RAISE NOTICE '✅ POS dynamic pricing settings: % rows', (SELECT COUNT(*) FROM lats_pos_dynamic_pricing_settings);
  RAISE NOTICE '✅ POS barcode scanner settings: % rows', (SELECT COUNT(*) FROM lats_pos_barcode_scanner_settings);
  RAISE NOTICE '✅ POS delivery settings: % rows', (SELECT COUNT(*) FROM lats_pos_delivery_settings);
  RAISE NOTICE '✅ POS search filter settings: % rows', (SELECT COUNT(*) FROM lats_pos_search_filter_settings);
  RAISE NOTICE '✅ POS user permissions settings: % rows', (SELECT COUNT(*) FROM lats_pos_user_permissions_settings);
  RAISE NOTICE '✅ POS loyalty customer settings: % rows', (SELECT COUNT(*) FROM lats_pos_loyalty_customer_settings);
  RAISE NOTICE '✅ POS analytics reporting settings: % rows', (SELECT COUNT(*) FROM lats_pos_analytics_reporting_settings);
  RAISE NOTICE '✅ POS notification settings: % rows', (SELECT COUNT(*) FROM lats_pos_notification_settings);
  RAISE NOTICE '✅ POS advanced settings: % rows', (SELECT COUNT(*) FROM lats_pos_advanced_settings);
END $$;
