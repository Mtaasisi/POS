-- Fix 400 Bad Request error in SalesReportsPage
-- The error occurs because the query selects columns that don't exist in lats_sales table

-- 1. First, let's add the missing columns to lats_sales table
-- Add missing columns that the frontend expects
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- 2. Update existing records to have proper values
-- Set subtotal = total_amount for existing records
UPDATE lats_sales 
SET subtotal = total_amount 
WHERE subtotal IS NULL OR subtotal = 0;

-- Set tax_amount = tax for existing records  
UPDATE lats_sales 
SET tax = tax_amount 
WHERE tax IS NULL OR tax = 0;

-- Set discount_amount = discount_value for existing records
UPDATE lats_sales 
SET discount_value = discount_amount 
WHERE discount_value IS NULL OR discount_value = 0;

-- 3. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_name ON lats_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_phone ON lats_sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_lats_sales_subtotal ON lats_sales(subtotal);
CREATE INDEX IF NOT EXISTS idx_lats_sales_discount_type ON lats_sales(discount_type);

-- 4. Update RLS policies to ensure they work with the new structure
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sale_items" ON lats_sale_items;

-- Create new comprehensive policies
CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on lats_sale_items" ON lats_sale_items
    FOR ALL USING (true);

-- 5. Grant permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT ALL ON lats_sale_items TO authenticated;
GRANT ALL ON lats_sale_items TO anon;

-- 6. Add helpful comments
COMMENT ON COLUMN lats_sales.subtotal IS 'Subtotal before discounts and taxes';
COMMENT ON COLUMN lats_sales.discount_type IS 'Type of discount: percentage or fixed';
COMMENT ON COLUMN lats_sales.discount_value IS 'Discount value (amount or percentage)';
COMMENT ON COLUMN lats_sales.tax IS 'Tax amount';
COMMENT ON COLUMN lats_sales.customer_name IS 'Customer name for quick reference';
COMMENT ON COLUMN lats_sales.customer_phone IS 'Customer phone for quick reference';

-- 7. Test the table structure
-- This will help verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;
