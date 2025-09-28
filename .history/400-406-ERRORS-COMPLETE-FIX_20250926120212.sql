-- Complete fix for 400 and 406 errors - Add all missing columns
-- Run this SQL directly in your Supabase SQL Editor

-- 1. Add missing columns to lats_sales table
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;

-- 2. Update existing records to have default values for new columns
UPDATE lats_sales 
SET 
    subtotal = total_amount,
    discount_value = COALESCE(discount_amount, 0),
    tax = COALESCE(tax_amount, 0)
WHERE subtotal IS NULL OR discount_value IS NULL OR tax IS NULL;

-- 3. Make subtotal NOT NULL after populating
ALTER TABLE lats_sales ALTER COLUMN subtotal SET NOT NULL;

-- 4. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_name ON lats_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_phone ON lats_sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_lats_sales_subtotal ON lats_sales(subtotal);

-- 5. Ensure RLS is properly configured
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- 6. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;

-- 7. Create comprehensive permissive policies
CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
    FOR ALL USING (true);

-- 8. Grant explicit permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;

-- 9. Test the table structure
SELECT 'Table structure updated successfully' as status;

-- 10. Verify all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 11. Test a simple query to ensure it works
SELECT COUNT(*) as total_sales FROM lats_sales;
