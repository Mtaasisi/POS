-- =====================================================
-- CHECK REMAINING REPAIR PAYMENT COLUMNS
-- =====================================================
-- This script checks what repair payment columns still exist

-- Check devices table for repair payment columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND table_schema = 'public'
AND (column_name LIKE '%repair_price%' 
     OR column_name LIKE '%repair_cost%' 
     OR column_name LIKE '%deposit%' 
     OR column_name LIKE '%payment_status%'
     OR column_name LIKE '%total_paid%'
     OR column_name LIKE '%outstanding%');

-- Check customers table for repair payment columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
AND (column_name LIKE '%total_paid%' 
     OR column_name LIKE '%outstanding%'
     OR column_name LIKE '%payment_status%');

-- Check if any repair payment functions still exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (routine_name LIKE '%repair_payment%' 
     OR routine_name LIKE '%customer_payment%'
     OR routine_name LIKE '%safe_update%');

-- Check if any repair payment views still exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%repair_payment%' 
     OR table_name LIKE '%customer_payment%');

-- Summary
SELECT 'Repair payment cleanup status' as status;
