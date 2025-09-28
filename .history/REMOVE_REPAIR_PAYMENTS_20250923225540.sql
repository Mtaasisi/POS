-- =====================================================
-- REMOVE ALL REPAIR PAYMENTS
-- =====================================================
-- This script will identify and remove all repair payments from the database

-- Step 1: First, let's see what repair payments exist
SELECT 
    'REPAIR PAYMENTS FOUND' as action,
    COUNT(*) as total_count
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR method = 'repair'
   OR payment_type = 'repair';

-- Step 2: Show details of repair payments before deletion
SELECT 
    'REPAIR PAYMENT DETAILS' as action,
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
   OR method = 'repair'
   OR payment_type = 'repair'
ORDER BY created_at DESC;

-- Step 3: Get count of payments to be deleted
DO $$
DECLARE
    repair_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO repair_count
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR method = 'repair'
       OR payment_type = 'repair';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REPAIR PAYMENTS ANALYSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total repair payments found: %', repair_count;
    
    IF repair_count > 0 THEN
        RAISE NOTICE '⚠️  These payments will be DELETED!';
        RAISE NOTICE '⚠️  This action cannot be undone!';
    ELSE
        RAISE NOTICE '✅ No repair payments found';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Step 4: DELETE all repair payments
-- WARNING: This will permanently delete the data!
DELETE FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR method = 'repair'
   OR payment_type = 'repair';

-- Step 5: Verify deletion
SELECT 
    'REPAIR PAYMENTS AFTER DELETION' as action,
    COUNT(*) as remaining_count
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR method = 'repair'
   OR payment_type = 'repair';

-- Step 6: Show total payments remaining
SELECT 
    'TOTAL PAYMENTS REMAINING' as action,
    COUNT(*) as total_count
FROM customer_payments;

-- Step 7: Final summary
DO $$
DECLARE
    remaining_repair_count INTEGER;
    total_payments INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_repair_count
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR method = 'repair'
       OR payment_type = 'repair';
    
    SELECT COUNT(*) INTO total_payments
    FROM customer_payments;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DELETION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Repair payments remaining: %', remaining_repair_count;
    RAISE NOTICE 'Total payments in database: %', total_payments;
    
    IF remaining_repair_count = 0 THEN
        RAISE NOTICE '✅ All repair payments have been successfully removed!';
    ELSE
        RAISE NOTICE '⚠️  Some repair payments may still exist';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Final success message
SELECT 'Repair payments removal completed!' as status;
