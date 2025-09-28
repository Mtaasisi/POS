-- FIX SALE TOTALS DISPLAY ISSUE
-- This script fixes the problem where total_amount shows subtotal instead of final amount after discount
-- Run this script on your Supabase database

-- Step 1: Remove the problematic trigger that overrides total_amount
DROP TRIGGER IF EXISTS update_sale_totals_trigger ON lats_sale_items;

-- Step 2: Drop the function that was causing the issue
DROP FUNCTION IF EXISTS update_sale_totals();

-- Step 3: Update existing sales to have correct total_amount values
-- This will fix the existing sales that have incorrect totals
UPDATE lats_sales 
SET total_amount = (
    CASE 
        WHEN subtotal IS NOT NULL AND discount_amount IS NOT NULL AND discount_amount > 0 
        THEN subtotal - discount_amount
        ELSE total_amount
    END
)
WHERE subtotal IS NOT NULL 
  AND discount_amount IS NOT NULL 
  AND discount_amount > 0
  AND total_amount != (subtotal - discount_amount);

-- Step 4: Add a comment to document the fix
COMMENT ON TABLE lats_sales IS 'Sales table - total_amount reflects final amount after discounts';

-- Step 5: Verify the fix by checking a sample sale
-- This query will show you the corrected data
SELECT 
    sale_number,
    subtotal,
    discount_amount,
    total_amount as current_total,
    (subtotal - discount_amount) as calculated_total,
    CASE 
        WHEN total_amount = (subtotal - discount_amount) THEN 'CORRECT'
        ELSE 'NEEDS_FIX'
    END as status
FROM lats_sales 
WHERE subtotal IS NOT NULL 
  AND discount_amount IS NOT NULL 
  AND discount_amount > 0
ORDER BY created_at DESC
LIMIT 5;
