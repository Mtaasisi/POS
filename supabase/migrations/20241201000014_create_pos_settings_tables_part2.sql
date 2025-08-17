-- Create POS Settings Tables Migration - Part 2
-- This migration creates additional tables for POS settings categories

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_user_business ON lats_pos_barcode_scanner_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_settings_user_business ON lats_pos_delivery_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_user_business ON lats_pos_search_filter_settings(user_id, business_id);

-- Enable RLS
ALTER TABLE lats_pos_barcode_scanner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_search_filter_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
