-- =====================================================
-- CHECK FOR REMAINING REPAIR PAYMENTS
-- =====================================================
-- This script checks if there are any remaining repair payments in the database

-- Step 1: Check for repair payments by notes
SELECT 
    'REPAIR PAYMENTS BY NOTES' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%';

-- Step 2: Check for repair payments by method
SELECT 
    'REPAIR PAYMENTS BY METHOD' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix';

-- Step 3: Check for repair payments by payment_type
SELECT 
    'REPAIR PAYMENTS BY TYPE' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix';

-- Step 4: Check for repair payments by reference
SELECT 
    'REPAIR PAYMENTS BY REFERENCE' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%';

-- Step 5: Show any remaining repair payments with details
SELECT 
    'REMAINING REPAIR PAYMENTS' as check_type,
    id,
    customer_id,
    device_id,
    amount,
    method,
    payment_type,
    status,
    currency,
    notes,
    reference,
    payment_date,
    created_at
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%'
   OR method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix'
   OR payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix'
   OR reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%'
ORDER BY created_at DESC;

-- Step 6: Check for any payments with "Xiaomi" in notes (from your example)
SELECT 
    'XIAOMI PAYMENTS' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%';

-- Step 7: Show Xiaomi payments if any exist
SELECT 
    'XIAOMI PAYMENT DETAILS' as check_type,
    id,
    customer_id,
    device_id,
    amount,
    method,
    payment_type,
    status,
    currency,
    notes,
    reference,
    payment_date,
    created_at
FROM customer_payments 
WHERE notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%'
ORDER BY created_at DESC;

-- Step 8: Summary report
DO $$
DECLARE
    repair_by_notes INTEGER;
    repair_by_method INTEGER;
    repair_by_type INTEGER;
    repair_by_reference INTEGER;
    xiaomi_payments INTEGER;
    total_repair_payments INTEGER;
BEGIN
    -- Count different types of repair payments
    SELECT COUNT(*) INTO repair_by_notes
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR notes ILIKE '%fix%'
       OR notes ILIKE '%maintenance%';
    
    SELECT COUNT(*) INTO repair_by_method
    FROM customer_payments 
    WHERE method = 'repair'
       OR method = 'maintenance'
       OR method = 'fix';
    
    SELECT COUNT(*) INTO repair_by_type
    FROM customer_payments 
    WHERE payment_type = 'repair'
       OR payment_type = 'maintenance'
       OR payment_type = 'fix';
    
    SELECT COUNT(*) INTO repair_by_reference
    FROM customer_payments 
    WHERE reference ILIKE '%repair%'
       OR reference ILIKE '%fix%'
       OR reference ILIKE '%maintenance%';
    
    SELECT COUNT(*) INTO xiaomi_payments
    FROM customer_payments 
    WHERE notes ILIKE '%xiaomi%'
       OR notes ILIKE '%redmi%';
    
    -- Calculate total unique repair payments
    SELECT COUNT(DISTINCT id) INTO total_repair_payments
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR notes ILIKE '%fix%'
       OR notes ILIKE '%maintenance%'
       OR method = 'repair'
       OR method = 'maintenance'
       OR method = 'fix'
       OR payment_type = 'repair'
       OR payment_type = 'maintenance'
       OR payment_type = 'fix'
       OR reference ILIKE '%repair%'
       OR reference ILIKE '%fix%'
       OR reference ILIKE '%maintenance%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REPAIR PAYMENTS CHECK SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Repair payments by notes: %', repair_by_notes;
    RAISE NOTICE 'Repair payments by method: %', repair_by_method;
    RAISE NOTICE 'Repair payments by type: %', repair_by_type;
    RAISE NOTICE 'Repair payments by reference: %', repair_by_reference;
    RAISE NOTICE 'Xiaomi/Redmi payments: %', xiaomi_payments;
    RAISE NOTICE 'Total unique repair payments: %', total_repair_payments;
    RAISE NOTICE '========================================';
    
    IF total_repair_payments = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No repair payments found!';
        RAISE NOTICE '✅ All repair payments have been successfully removed!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % repair payments still exist!', total_repair_payments;
        RAISE NOTICE '⚠️  You may need to run the removal script again.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM customer_payments 
            WHERE notes ILIKE '%repair%' 
               OR notes ILIKE '%device repair%'
               OR notes ILIKE '%repair payment%'
               OR notes ILIKE '%fix%'
               OR notes ILIKE '%maintenance%'
               OR method = 'repair'
               OR method = 'maintenance'
               OR method = 'fix'
               OR payment_type = 'repair'
               OR payment_type = 'maintenance'
               OR payment_type = 'fix'
               OR reference ILIKE '%repair%'
               OR reference ILIKE '%fix%'
               OR reference ILIKE '%maintenance%'
        ) THEN 'REPAIR PAYMENTS STILL EXIST - RUN REMOVAL SCRIPT'
        ELSE 'ALL REPAIR PAYMENTS SUCCESSFULLY REMOVED'
    END as status;
