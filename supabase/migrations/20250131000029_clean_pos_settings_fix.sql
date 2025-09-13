-- Clean fix for POS settings 400 error
-- Migration: 20250131000029_clean_pos_settings_fix.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP AND RECREATE TABLES TO FIX FOREIGN KEY ISSUES
-- =====================================================

-- Drop existing tables with CASCADE to remove all dependencies
DROP TABLE IF EXISTS lats_pos_general_settings CASCADE;
DROP TABLE IF EXISTS lats_pos_receipt_settings CASCADE;

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
CREATE TABLE lats_pos_general_settings (
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

-- Create indexes for lats_pos_general_settings
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);

-- Enable Row Level Security for lats_pos_general_settings
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for lats_pos_general_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO anon;

-- =====================================================
-- CREATE LATS_POS_RECEIPT_SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_receipt_settings (
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

-- Create indexes for lats_pos_receipt_settings
CREATE INDEX IF NOT EXISTS idx_pos_receipt_user_id ON lats_pos_receipt_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_business_id ON lats_pos_receipt_settings(business_id);

-- Enable Row Level Security for lats_pos_receipt_settings
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for lats_pos_receipt_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_receipt_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_receipt_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_pos_receipt_settings TO authenticated;
GRANT ALL ON lats_pos_receipt_settings TO anon;

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
DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_general_settings_updated_at ON lats_pos_general_settings;
CREATE TRIGGER update_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receipt_settings_updated_at ON lats_pos_receipt_settings;
CREATE TRIGGER update_receipt_settings_updated_at 
    BEFORE UPDATE ON lats_pos_receipt_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default technician users (only if they don't exist)
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('2e50be86-f31d-4700-bca7-1e2da2bae8b3', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0),
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0)
ON CONFLICT (email) DO UPDATE SET
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
  
  RAISE NOTICE '✅ All POS settings tables have been created successfully';
  RAISE NOTICE '✅ Auth users: % rows', (SELECT COUNT(*) FROM auth_users);
  RAISE NOTICE '✅ POS general settings: % rows', (SELECT COUNT(*) FROM lats_pos_general_settings);
  RAISE NOTICE '✅ POS receipt settings: % rows', (SELECT COUNT(*) FROM lats_pos_receipt_settings);
END $$;
