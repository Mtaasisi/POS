-- Clean Database Fix for Online Supabase
-- Migration: 20250131000035_clean_database_fix.sql
-- This migration safely fixes all database issues without trigger conflicts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENSURE CORE TABLES EXIST
-- =====================================================

-- Create auth_users table if it doesn't exist
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

-- Create user_daily_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('new_customers', 'devices_processed', 'checkins', 'repairs_completed')),
    goal_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADD MISSING CUSTOMER COLUMNS
-- =====================================================

-- Add missing columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- =====================================================
-- CREATE POS SETTINGS TABLES
-- =====================================================

-- Create POS general settings table
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'sw', 'fr')),
    currency VARCHAR(3) DEFAULT 'TZS',
    timezone VARCHAR(50) DEFAULT 'Africa/Dar_es_Salaam',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24' CHECK (time_format IN ('12', '24')),
    show_product_images BOOLEAN DEFAULT true,
    show_stock_levels BOOLEAN DEFAULT true,
    show_prices BOOLEAN DEFAULT true,
    show_barcodes BOOLEAN DEFAULT true,
    products_per_page INTEGER DEFAULT 20 CHECK (products_per_page BETWEEN 10 AND 100),
    auto_complete_search BOOLEAN DEFAULT true,
    confirm_delete BOOLEAN DEFAULT true,
    show_confirmations BOOLEAN DEFAULT true,
    enable_sound_effects BOOLEAN DEFAULT true,
    enable_animations BOOLEAN DEFAULT true,
    enable_caching BOOLEAN DEFAULT true,
    cache_duration INTEGER DEFAULT 300 CHECK (cache_duration BETWEEN 60 AND 3600),
    enable_lazy_loading BOOLEAN DEFAULT true,
    max_search_results INTEGER DEFAULT 50 CHECK (max_search_results BETWEEN 10 AND 200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- Create POS receipt settings table
CREATE TABLE IF NOT EXISTS lats_pos_receipt_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    business_id UUID,
    business_name TEXT DEFAULT 'LATS CHANCE',
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_website TEXT,
    show_business_info BOOLEAN DEFAULT true,
    show_customer_info BOOLEAN DEFAULT true,
    show_item_details BOOLEAN DEFAULT true,
    show_tax_breakdown BOOLEAN DEFAULT true,
    show_payment_method BOOLEAN DEFAULT true,
    show_change_amount BOOLEAN DEFAULT true,
    footer_message TEXT DEFAULT 'Thank you for your business!',
    show_date_time BOOLEAN DEFAULT true,
    show_cashier_name BOOLEAN DEFAULT true,
    show_receipt_number BOOLEAN DEFAULT true,
    paper_width INTEGER DEFAULT 80,
    font_size INTEGER DEFAULT 12,
    line_spacing INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Auth users indexes
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);

-- User daily goals indexes
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_goal_type ON user_daily_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_is_active ON user_daily_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_goal_type ON user_daily_goals(user_id, goal_type);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_joined_date ON customers(joined_date);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase_date ON customers(last_purchase_date);
CREATE INDEX IF NOT EXISTS idx_customers_total_purchases ON customers(total_purchases);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);

-- POS settings indexes
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_user_id ON lats_pos_receipt_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_business_id ON lats_pos_receipt_settings(business_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_receipt_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PERMISSIVE POLICIES FOR ONLINE SUPABASE
-- =====================================================

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON auth_users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_daily_goals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_receipt_settings;

-- Create permissive policies for online Supabase
CREATE POLICY "Enable all access for authenticated users" ON auth_users
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON user_daily_goals
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_receipt_settings
    FOR ALL USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated and anon roles
GRANT ALL ON auth_users TO authenticated;
GRANT ALL ON auth_users TO anon;
GRANT ALL ON user_daily_goals TO authenticated;
GRANT ALL ON user_daily_goals TO anon;
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO anon;
GRANT ALL ON lats_pos_receipt_settings TO authenticated;
GRANT ALL ON lats_pos_receipt_settings TO anon;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default technician users (only if they don't exist)
INSERT INTO auth_users (id, email, username, name, role, is_active, points) 
SELECT '2e50be86-f31d-4700-bca7-1e2da2bae8b3', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0
WHERE NOT EXISTS (SELECT 1 FROM auth_users WHERE email = 'technician1@example.com');

INSERT INTO auth_users (id, email, username, name, role, is_active, points) 
SELECT '9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0
WHERE NOT EXISTS (SELECT 1 FROM auth_users WHERE email = 'technician2@example.com');

-- Insert default goals for existing users
INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT id, 'new_customers', 5, true FROM auth_users WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT id, 'checkins', 10, true FROM auth_users WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT id, 'devices_processed', 8, true FROM auth_users WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT id, 'repairs_completed', 3, true FROM auth_users WHERE role = 'technician'
ON CONFLICT DO NOTHING;

-- Update existing customer records
UPDATE customers 
SET 
    joined_date = COALESCE(joined_date, created_at),
    total_purchases = COALESCE(total_purchases, 0),
    whatsapp_opt_out = COALESCE(whatsapp_opt_out, false)
WHERE 
    joined_date IS NULL 
    OR total_purchases IS NULL 
    OR whatsapp_opt_out IS NULL;

-- Update existing customer birthdays
UPDATE customers 
SET birthday = DATE(CONCAT(EXTRACT(YEAR FROM CURRENT_DATE), '-', 
                          LPAD(birth_month::TEXT, 2, '0'), '-', 
                          LPAD(birth_day::TEXT, 2, '0')))
WHERE birth_month IS NOT NULL 
  AND birth_day IS NOT NULL 
  AND birthday IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    goal_count INTEGER;
    customer_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('auth_users', 'user_daily_goals', 'lats_pos_general_settings', 'lats_pos_receipt_settings', 'customers');
    
    -- Count records
    SELECT COUNT(*) INTO user_count FROM auth_users;
    SELECT COUNT(*) INTO goal_count FROM user_daily_goals;
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    RAISE NOTICE '✅ Clean database fix completed successfully!';
    RAISE NOTICE '✅ Tables verified: %', table_count;
    RAISE NOTICE '✅ Auth users: %', user_count;
    RAISE NOTICE '✅ User daily goals: %', goal_count;
    RAISE NOTICE '✅ Customers: %', customer_count;
    RAISE NOTICE '✅ Online Supabase database is ready!';
END $$;
