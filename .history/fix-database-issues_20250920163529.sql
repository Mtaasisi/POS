-- Fix database issues for LATS application
-- Run this SQL directly in your Supabase SQL editor or database client

-- 1. Add missing columns to lats_sales table
DO $$ 
BEGIN
    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_name VARCHAR(255);
    END IF;

    -- Add customer_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_phone VARCHAR(20);
    END IF;

    -- Add tax column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'tax'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add discount column if it doesn't exist (different from discount_amount)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add confirmed_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'confirmed_by'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN confirmed_by UUID REFERENCES auth_users(id);
    END IF;

    -- Add confirmed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create daily_sales_closures table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_sales_closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_by TEXT NOT NULL DEFAULT 'system',
  closed_by_user_id UUID,
  sales_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
-- Update status constraint to include 'confirmed' status
ALTER TABLE lats_sales DROP CONSTRAINT IF EXISTS lats_sales_status_check;
ALTER TABLE lats_sales ADD CONSTRAINT lats_sales_status_check 
    CHECK (status IN ('pending', 'completed', 'confirmed', 'cancelled', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_name ON lats_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_phone ON lats_sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_lats_sales_confirmed_by ON lats_sales(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_lats_sales_confirmed_at ON lats_sales(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_date ON daily_sales_closures(date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_closed_at ON daily_sales_closures(closed_at);

-- 4. Enable RLS and create permissive policies for online database
ALTER TABLE daily_sales_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read daily closures" ON daily_sales_closures;
DROP POLICY IF EXISTS "Allow insert daily closures" ON daily_sales_closures;
DROP POLICY IF EXISTS "Allow update daily closures" ON daily_sales_closures;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;

-- Create permissive policies for online database
CREATE POLICY "Allow all operations on daily closures" ON daily_sales_closures
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on lats_sale_items" ON lats_sale_items
  FOR ALL USING (true);

-- 5. Grant permissions
GRANT ALL ON daily_sales_closures TO authenticated;
GRANT ALL ON daily_sales_closures TO anon;
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT ALL ON lats_sale_items TO authenticated;
GRANT ALL ON lats_sale_items TO anon;

-- 6. Update existing records to populate customer_name and customer_phone from customers table
UPDATE lats_sales 
SET 
    customer_name = c.name,
    customer_phone = c.phone
FROM customers c
WHERE lats_sales.customer_id = c.id 
  AND (lats_sales.customer_name IS NULL OR lats_sales.customer_phone IS NULL);

-- 7. Add comments for documentation
COMMENT ON COLUMN lats_sales.customer_name IS 'Customer name for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.customer_phone IS 'Customer phone for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.tax IS 'Tax amount applied to the sale';
COMMENT ON COLUMN lats_sales.discount IS 'Discount amount applied to the sale (alias for discount_amount)';
COMMENT ON TABLE daily_sales_closures IS 'Tracks daily sales closures for customer care operations';

-- 8. Verify the changes
SELECT 
    'lats_sales' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name IN (
    'customer_name', 
    'customer_phone', 
    'tax', 
    'discount'
)

UNION ALL

SELECT 
    'daily_sales_closures' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_sales_closures' 
AND column_name IN (
    'date', 
    'total_sales', 
    'total_transactions',
    'closed_at',
    'closed_by'
);
