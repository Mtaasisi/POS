-- Fix POS Settings Tables - Remove Non-existent Business References
-- This migration fixes the business_id foreign key references

-- Drop existing tables if they exist (to recreate with correct structure)
DROP TABLE IF EXISTS lats_pos_general_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_dynamic_pricing_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_receipt_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_barcode_scanner_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_delivery_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_search_filter_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_user_permissions_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_loyalty_customer_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_analytics_reporting_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_notification_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_advanced_settings CASCADE;

-- =====================================================
-- GENERAL SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
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
-- DYNAMIC PRICING SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_dynamic_pricing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
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
-- RECEIPT SETTINGS TABLE (FIXED)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID, -- Removed foreign key reference
    
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pos_general_settings_user_business ON lats_pos_general_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_user_business ON lats_pos_dynamic_pricing_settings(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_settings_user_business ON lats_pos_receipt_settings(user_id, business_id);

-- Enable RLS
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_dynamic_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
