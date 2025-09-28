-- Add missing columns to customers table
-- Migration: 20250131000032_add_missing_customer_columns.sql

-- Add loyalty_level column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_level VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum'));

-- Add color_tag column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS color_tag VARCHAR(20) DEFAULT 'new' CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));

-- Add referred_by column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add total_spent column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0.00;

-- Add points column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add last_visit column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE;

-- Add created_by column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL;

-- Add referral_source column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add initial_notes column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS initial_notes TEXT;

-- Add referrals column (JSON array of referral IDs)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referrals JSONB DEFAULT '[]'::jsonb;

-- Add customer_tag column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_tag VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_color_tag ON customers(color_tag);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_referral_source ON customers(referral_source);
CREATE INDEX IF NOT EXISTS idx_customers_customer_tag ON customers(customer_tag);

-- Update existing records to have default values
UPDATE customers 
SET 
    loyalty_level = COALESCE(loyalty_level, 'bronze'),
    color_tag = COALESCE(color_tag, 'new'),
    total_spent = COALESCE(total_spent, 0.00),
    points = COALESCE(points, 0),
    referrals = COALESCE(referrals, '[]'::jsonb)
WHERE 
    loyalty_level IS NULL 
    OR color_tag IS NULL 
    OR total_spent IS NULL 
    OR points IS NULL 
    OR referrals IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN (
    'loyalty_level', 
    'color_tag', 
    'referred_by', 
    'total_spent', 
    'points', 
    'last_visit', 
    'created_by', 
    'referral_source', 
    'initial_notes', 
    'referrals', 
    'customer_tag'
);
