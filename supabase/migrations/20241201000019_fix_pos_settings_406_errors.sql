-- Fix POS Settings 406 Errors Migration
-- This migration ensures all POS settings tables exist and have proper RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- GENERAL SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_general_settings CASCADE;

CREATE TABLE lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- RECEIPT SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_receipt_settings CASCADE;

CREATE TABLE lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
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
    
    -- Print Settings
    print_mode VARCHAR(20) DEFAULT 'thermal' CHECK (print_mode IN ('thermal', 'a4', 'email')),
    auto_print BOOLEAN DEFAULT false,
    print_copies INTEGER DEFAULT 1 CHECK (print_copies BETWEEN 1 AND 10),
    paper_size VARCHAR(10) DEFAULT '80mm' CHECK (paper_size IN ('80mm', '58mm', 'a4')),
    
    -- Numbering Settings
    receipt_prefix VARCHAR(10) DEFAULT 'RCP',
    receipt_numbering BOOLEAN DEFAULT true,
    start_number INTEGER DEFAULT 1,
    reset_daily BOOLEAN DEFAULT false,
    
    -- History Settings
    keep_history BOOLEAN DEFAULT true,
    history_days INTEGER DEFAULT 30 CHECK (history_days BETWEEN 1 AND 365),
    auto_backup BOOLEAN DEFAULT false,
    backup_location VARCHAR(255) DEFAULT 'local',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- DELIVERY SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_delivery_settings CASCADE;

CREATE TABLE lats_pos_delivery_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
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
-- ADVANCED SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_advanced_settings CASCADE;

CREATE TABLE lats_pos_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
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
    enable_auto_updates BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- General Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_general_settings_user_business ON lats_pos_general_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_settings_updated_at ON lats_pos_general_settings(updated_at);

-- Receipt Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_receipt_settings_user_business ON lats_pos_receipt_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_settings_updated_at ON lats_pos_receipt_settings(updated_at);

-- Delivery Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_delivery_settings_user_business ON lats_pos_delivery_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_settings_updated_at ON lats_pos_delivery_settings(updated_at);

-- Advanced Settings Indexes
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_user_business ON lats_pos_advanced_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_settings_updated_at ON lats_pos_advanced_settings(updated_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_advanced_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- General Settings Policies
CREATE POLICY "Users can view their own general settings" ON lats_pos_general_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own general settings" ON lats_pos_general_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own general settings" ON lats_pos_general_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own general settings" ON lats_pos_general_settings FOR DELETE USING (auth.uid() = user_id);

-- Receipt Settings Policies
CREATE POLICY "Users can view their own receipt settings" ON lats_pos_receipt_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own receipt settings" ON lats_pos_receipt_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipt settings" ON lats_pos_receipt_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipt settings" ON lats_pos_receipt_settings FOR DELETE USING (auth.uid() = user_id);

-- Delivery Settings Policies
CREATE POLICY "Users can view their own delivery settings" ON lats_pos_delivery_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own delivery settings" ON lats_pos_delivery_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own delivery settings" ON lats_pos_delivery_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own delivery settings" ON lats_pos_delivery_settings FOR DELETE USING (auth.uid() = user_id);

-- Advanced Settings Policies
CREATE POLICY "Users can view their own advanced settings" ON lats_pos_advanced_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own advanced settings" ON lats_pos_advanced_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own advanced settings" ON lats_pos_advanced_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own advanced settings" ON lats_pos_advanced_settings FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_pos_general_settings_updated_at BEFORE UPDATE ON lats_pos_general_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_receipt_settings_updated_at BEFORE UPDATE ON lats_pos_receipt_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_delivery_settings_updated_at BEFORE UPDATE ON lats_pos_delivery_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_advanced_settings_updated_at BEFORE UPDATE ON lats_pos_advanced_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
