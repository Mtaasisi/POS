-- VERIFY SALE TOTALS FIX
-- Run this after applying the fix to verify it worked

-- Check if the trigger still exists (should return 0 rows)
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'update_sale_totals_trigger';

-- Check sales with discounts to see if totals are correct
SELECT 
    sale_number,
    subtotal,
    discount_amount,
    total_amount,
    (subtotal - discount_amount) as calculated_final_amount,
    CASE 
        WHEN total_amount = (subtotal - discount_amount) THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as status
FROM lats_sales 
WHERE subtotal IS NOT NULL 
  AND discount_amount IS NOT NULL 
  AND discount_amount > 0
ORDER BY created_at DESC;

-- Summary of the fix
SELECT 
    COUNT(*) as total_sales_with_discounts,
    COUNT(CASE WHEN total_amount = (subtotal - discount_amount) THEN 1 END) as correct_totals,
    COUNT(CASE WHEN total_amount != (subtotal - discount_amount) THEN 1 END) as incorrect_totals
FROM lats_sales 
WHERE subtotal IS NOT NULL 
  AND discount_amount IS NOT NULL 
  AND discount_amount > 0;
