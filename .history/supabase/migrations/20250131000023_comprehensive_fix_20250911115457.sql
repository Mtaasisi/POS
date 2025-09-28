-- Comprehensive fix for all database issues
-- Migration: 20250131000023_comprehensive_fix.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE AUTH_USERS TABLE
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
-- CREATE USER_DAILY_GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('new_customers', 'devices_processed', 'checkins', 'repairs_completed')),
    goal_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_daily_goals
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_goal_type ON user_daily_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_is_active ON user_daily_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_goal_type ON user_daily_goals(user_id, goal_type);

-- Enable Row Level Security for user_daily_goals
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for user_daily_goals (drop existing first)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_daily_goals;
CREATE POLICY "Enable all access for authenticated users" ON user_daily_goals
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON user_daily_goals TO authenticated;
GRANT ALL ON user_daily_goals TO anon;

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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- Create indexes for lats_pos_general_settings
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);

-- Enable Row Level Security for lats_pos_general_settings
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for lats_pos_general_settings (drop existing first)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO anon;

-- =====================================================
-- CREATE LATS_POS_RECEIPT_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Receipt Header Settings
    business_name TEXT DEFAULT 'LATS CHANCE',
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_website TEXT,
    
    -- Receipt Content Settings
    show_business_info BOOLEAN DEFAULT true,
    show_customer_info BOOLEAN DEFAULT true,
    show_item_details BOOLEAN DEFAULT true,
    show_tax_breakdown BOOLEAN DEFAULT true,
    show_payment_method BOOLEAN DEFAULT true,
    show_change_amount BOOLEAN DEFAULT true,
    
    -- Receipt Footer Settings
    footer_message TEXT DEFAULT 'Thank you for your business!',
    show_date_time BOOLEAN DEFAULT true,
    show_cashier_name BOOLEAN DEFAULT true,
    show_receipt_number BOOLEAN DEFAULT true,
    
    -- Receipt Format Settings
    paper_width INTEGER DEFAULT 80,
    font_size INTEGER DEFAULT 12,
    line_spacing INTEGER DEFAULT 1,
    
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
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipt_settings_updated_at 
    BEFORE UPDATE ON lats_pos_receipt_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Insert default goals for existing users
INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'new_customers',
    5,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'checkins',
    10,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'devices_processed',
    8,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'repairs_completed',
    3,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

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
    max_search_results
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
    50 as max_search_results
FROM auth_users
WHERE id NOT IN (SELECT user_id FROM lats_pos_general_settings WHERE user_id IS NOT NULL);

-- Insert default POS receipt settings for existing users
INSERT INTO lats_pos_receipt_settings (
    user_id,
    business_id,
    business_name,
    business_address,
    business_phone,
    business_email,
    show_business_info,
    show_customer_info,
    show_item_details,
    show_tax_breakdown,
    show_payment_method,
    show_change_amount,
    footer_message,
    show_date_time,
    show_cashier_name,
    show_receipt_number,
    paper_width,
    font_size,
    line_spacing
)
SELECT 
    id as user_id,
    NULL as business_id,
    'LATS CHANCE' as business_name,
    'Dar es Salaam, Tanzania' as business_address,
    '+255 XXX XXX XXX' as business_phone,
    'info@latschance.com' as business_email,
    true as show_business_info,
    true as show_customer_info,
    true as show_item_details,
    true as show_tax_breakdown,
    true as show_payment_method,
    true as show_change_amount,
    'Thank you for your business!' as footer_message,
    true as show_date_time,
    true as show_cashier_name,
    true as show_receipt_number,
    80 as paper_width,
    12 as font_size,
    1 as line_spacing
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
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_daily_goals') THEN
    RAISE EXCEPTION 'Table user_daily_goals was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_general_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_general_settings was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_pos_receipt_settings') THEN
    RAISE EXCEPTION 'Table lats_pos_receipt_settings was not created';
  END IF;
  
  RAISE NOTICE '✅ All database tables have been created successfully';
  RAISE NOTICE '✅ Auth users: % rows', (SELECT COUNT(*) FROM auth_users);
  RAISE NOTICE '✅ User daily goals: % rows', (SELECT COUNT(*) FROM user_daily_goals);
  RAISE NOTICE '✅ POS general settings: % rows', (SELECT COUNT(*) FROM lats_pos_general_settings);
  RAISE NOTICE '✅ POS receipt settings: % rows', (SELECT COUNT(*) FROM lats_pos_receipt_settings);
END $$;
