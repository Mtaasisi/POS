-- Fixed POS settings tables creation - handles existing users properly
-- Migration: 20250131000028_fixed_pos_settings_tables.sql

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
-- CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_user_id ON lats_pos_receipt_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_business_id ON lats_pos_receipt_settings(business_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PERMISSIVE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_receipt_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_receipt_settings
    FOR ALL USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO anon;
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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
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
    END IF;
END $$;

-- =====================================================
-- INSERT DEFAULT DATA (SAFELY)
-- =====================================================

-- Insert default technician users only if they don't exist
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('2e50be86-f31d-4700-bca7-1e2da2bae8b3', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0),
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Insert default POS general settings for existing users
INSERT INTO lats_pos_general_settings (
    user_id, 
    business_id, 
    theme, 
    language, 
    currency, 
    timezone, 
    date_format, 
    time_format,
    show_product_images, 
    show_stock_levels, 
    show_prices, 
    show_barcodes, 
    products_per_page,
    auto_complete_search, 
    confirm_delete, 
    show_confirmations, 
    enable_sound_effects, 
    enable_animations,
    enable_caching, 
    cache_duration, 
    enable_lazy_loading, 
    max_search_results, 
    enable_tax, 
    tax_rate
)
SELECT 
    id as user_id,
    NULL as business_id,
    'light' as theme,
    'en' as language,
    'TZS' as currency,
    'Africa/Dar_es_Salaam' as timezone,
    'DD/MM/YYYY' as date_format,
    '24' as time_format,
    true as show_product_images,
    true as show_stock_levels,
    true as show_prices,
    true as show_barcodes,
    20 as products_per_page,
    true as auto_complete_search,
    true as confirm_delete,
    true as show_confirmations,
    true as enable_sound_effects,
    true as enable_animations,
    true as enable_caching,
    300 as cache_duration,
    true as enable_lazy_loading,
    50 as max_search_results,
    true as enable_tax,
    16.00 as tax_rate
FROM auth_users
WHERE id NOT IN (SELECT user_id FROM lats_pos_general_settings WHERE user_id IS NOT NULL);

-- Insert default POS receipt settings for existing users
INSERT INTO lats_pos_receipt_settings (
    user_id,
    business_id,
    receipt_template,
    receipt_width,
    receipt_font_size,
    show_business_logo,
    show_business_name,
    show_business_address,
    show_business_phone,
    show_transaction_id,
    show_date_time,
    show_cashier_name,
    show_customer_name,
    show_product_names,
    show_quantities,
    show_unit_prices,
    show_discounts,
    show_subtotal,
    show_tax,
    show_grand_total,
    show_payment_method,
    show_change_amount,
    enable_receipt_numbering,
    receipt_number_prefix,
    receipt_number_start,
    show_footer_message,
    footer_message
)
SELECT 
    id as user_id,
    NULL as business_id,
    'standard' as receipt_template,
    80 as receipt_width,
    12 as receipt_font_size,
    true as show_business_logo,
    true as show_business_name,
    true as show_business_address,
    true as show_business_phone,
    true as show_transaction_id,
    true as show_date_time,
    true as show_cashier_name,
    true as show_customer_name,
    true as show_product_names,
    true as show_quantities,
    true as show_unit_prices,
    true as show_discounts,
    true as show_subtotal,
    true as show_tax,
    true as show_grand_total,
    true as show_payment_method,
    true as show_change_amount,
    true as enable_receipt_numbering,
    'RCP' as receipt_number_prefix,
    1 as receipt_number_start,
    true as show_footer_message,
    'Thank you for your business!' as footer_message
FROM auth_users
WHERE id NOT IN (SELECT user_id FROM lats_pos_receipt_settings WHERE user_id IS NOT NULL);

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
