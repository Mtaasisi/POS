-- Final Database Consolidation for Online Supabase
-- Migration: 20250131000034_final_database_consolidation.sql
-- This migration ensures all database tables and configurations are properly set up for online Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VERIFY AND CREATE CORE TABLES
-- =====================================================

-- Ensure auth_users table exists with proper structure
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

-- Ensure user_daily_goals table exists
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('new_customers', 'devices_processed', 'checkins', 'repairs_completed')),
    goal_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure customers table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'joined_date') THEN
        ALTER TABLE customers ADD COLUMN joined_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_purchase_date') THEN
        ALTER TABLE customers ADD COLUMN last_purchase_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_purchases') THEN
        ALTER TABLE customers ADD COLUMN total_purchases INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'birthday') THEN
        ALTER TABLE customers ADD COLUMN birthday DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'whatsapp_opt_out') THEN
        ALTER TABLE customers ADD COLUMN whatsapp_opt_out BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Ensure POS settings tables exist
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
-- CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Customer birthday computation function
CREATE OR REPLACE FUNCTION compute_customer_birthday()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.birth_month IS NOT NULL AND NEW.birth_day IS NOT NULL THEN
        NEW.birthday := DATE(CONCAT(EXTRACT(YEAR FROM CURRENT_DATE), '-', 
                                   LPAD(NEW.birth_month::TEXT, 2, '0'), '-', 
                                   LPAD(NEW.birth_day::TEXT, 2, '0')));
    ELSE
        NEW.birthday := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated at triggers (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_daily_goals_updated_at ON user_daily_goals;
CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_general_settings_updated_at ON lats_pos_general_settings;
CREATE TRIGGER update_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receipt_settings_updated_at ON lats_pos_receipt_settings;
CREATE TRIGGER update_receipt_settings_updated_at 
    BEFORE UPDATE ON lats_pos_receipt_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customer birthday trigger
DROP TRIGGER IF EXISTS trigger_compute_customer_birthday ON customers;
CREATE TRIGGER trigger_compute_customer_birthday
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION compute_customer_birthday();

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
-- VERIFICATION AND FINAL CHECKS
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
    
    -- Verify everything is working
    IF table_count < 5 THEN
        RAISE EXCEPTION 'Not all required tables exist. Found % tables', table_count;
    END IF;
    
    RAISE NOTICE '✅ Database consolidation completed successfully!';
    RAISE NOTICE '✅ Tables verified: %', table_count;
    RAISE NOTICE '✅ Auth users: %', user_count;
    RAISE NOTICE '✅ User daily goals: %', goal_count;
    RAISE NOTICE '✅ Customers: %', customer_count;
    RAISE NOTICE '✅ Online Supabase database is ready for use!';
END $$;

-- Add helpful comments
COMMENT ON TABLE auth_users IS 'User authentication and profile information for online Supabase';
COMMENT ON TABLE user_daily_goals IS 'Daily goal tracking for technicians and users';
COMMENT ON TABLE lats_pos_general_settings IS 'General POS system settings and preferences';
COMMENT ON TABLE lats_pos_receipt_settings IS 'Receipt formatting and business information settings';
COMMENT ON COLUMN customers.joined_date IS 'Date when customer joined (alias for created_at)';
COMMENT ON COLUMN customers.last_purchase_date IS 'Date of last purchase made by customer';
COMMENT ON COLUMN customers.total_purchases IS 'Total number of purchases made by customer';
COMMENT ON COLUMN customers.birthday IS 'Computed birthday from birth_month and birth_day';
COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether customer has opted out of WhatsApp messages';
