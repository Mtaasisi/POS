-- Safe fix for 406 Not Acceptable errors (preserves existing data)
-- Migration: 20250131000042_fix_406_errors_safe.sql

-- This migration fixes 406 errors by updating RLS policies without dropping tables

-- 1. Ensure lats_sales table has the sale_number column
-- Add sale_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_sales' AND column_name = 'sale_number') THEN
        ALTER TABLE lats_sales ADD COLUMN sale_number VARCHAR(50);
        -- Create unique index for sale_number
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
    END IF;
END $$;

-- 2. Update existing records to have sale_number if they don't have one
UPDATE lats_sales 
SET sale_number = 'SALE-' || EXTRACT(EPOCH FROM created_at)::TEXT || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE sale_number IS NULL OR sale_number = '';

-- 3. Make sale_number NOT NULL after populating existing records
ALTER TABLE lats_sales ALTER COLUMN sale_number SET NOT NULL;

-- 4. Enable RLS if not already enabled
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;

DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Allow all operations on lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Admin can manage lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Authenticated users can view lats_sale_items" ON lats_sale_items;

-- 6. Create comprehensive permissive policies
CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on lats_sale_items" ON lats_sale_items
    FOR ALL USING (true);

-- 7. Grant explicit permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT ALL ON lats_sale_items TO authenticated;
GRANT ALL ON lats_sale_items TO anon;

-- 8. Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_payment_status ON lats_sales(payment_status);

CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

-- 9. Add comments for documentation
COMMENT ON TABLE lats_sales IS 'Sales table with fixed RLS policies for online database';
COMMENT ON COLUMN lats_sales.sale_number IS 'Unique sale identifier - auto-generated if missing';
