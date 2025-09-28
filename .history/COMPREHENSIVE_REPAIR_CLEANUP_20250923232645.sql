-- =====================================================
-- COMPREHENSIVE REPAIR PAYMENTS CLEANUP
-- =====================================================
-- This script performs a thorough check and removal of all repair-related payments

-- =====================================================
-- PART 1: COMPREHENSIVE CHECK FOR REPAIR PAYMENTS
-- =====================================================

-- Step 1: Check for repair payments by notes (comprehensive keywords)
SELECT 
    'REPAIR PAYMENTS BY NOTES' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%'
   OR notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%'
   OR notes ILIKE '%broken%'
   OR notes ILIKE '%damaged%'
   OR notes ILIKE '%screen%'
   OR notes ILIKE '%battery%'
   OR notes ILIKE '%charging%'
   OR notes ILIKE '%water damage%'
   OR notes ILIKE '%software%'
   OR notes ILIKE '%update%'
   OR notes ILIKE '%flash%'
   OR notes ILIKE '%unlock%'
   OR notes ILIKE '%root%'
   OR notes ILIKE '%jailbreak%';

-- Step 2: Check for repair payments by method
SELECT 
    'REPAIR PAYMENTS BY METHOD' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix'
   OR method = 'service'
   OR method = 'technician'
   OR method = 'workshop';

-- Step 3: Check for repair payments by payment_type
SELECT 
    'REPAIR PAYMENTS BY TYPE' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix'
   OR payment_type = 'service'
   OR payment_type = 'technician'
   OR payment_type = 'workshop';

-- Step 4: Check for repair payments by reference
SELECT 
    'REPAIR PAYMENTS BY REFERENCE' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%'
   OR reference ILIKE '%service%'
   OR reference ILIKE '%technician%'
   OR reference ILIKE '%workshop%'
   OR reference ILIKE '%xiaomi%'
   OR reference ILIKE '%redmi%';

-- Step 5: Check for specific device repair scenarios
SELECT 
    'DEVICE SPECIFIC REPAIRS' as check_type,
    COUNT(*) as count
FROM customer_payments 
WHERE (notes ILIKE '%screen%' AND (notes ILIKE '%replace%' OR notes ILIKE '%repair%' OR notes ILIKE '%fix%'))
   OR (notes ILIKE '%battery%' AND (notes ILIKE '%replace%' OR notes ILIKE '%repair%' OR notes ILIKE '%fix%'))
   OR (notes ILIKE '%charging%' AND (notes ILIKE '%port%' OR notes ILIKE '%repair%' OR notes ILIKE '%fix%'))
   OR (notes ILIKE '%water%' AND (notes ILIKE '%damage%' OR notes ILIKE '%repair%' OR notes ILIKE '%fix%'))
   OR (notes ILIKE '%software%' AND (notes ILIKE '%repair%' OR notes ILIKE '%fix%' OR notes ILIKE '%flash%'))
   OR (notes ILIKE '%unlock%' AND (notes ILIKE '%phone%' OR notes ILIKE '%device%'))
   OR (notes ILIKE '%root%' AND (notes ILIKE '%android%' OR notes ILIKE '%device%'))
   OR (notes ILIKE '%jailbreak%' AND (notes ILIKE '%iphone%' OR notes ILIKE '%ios%'));

-- Step 6: Show ALL repair payments with complete details
SELECT 
    'ALL REPAIR PAYMENTS DETAILS' as check_type,
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
    created_at,
    created_by
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%'
   OR notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%'
   OR notes ILIKE '%broken%'
   OR notes ILIKE '%damaged%'
   OR notes ILIKE '%screen%'
   OR notes ILIKE '%battery%'
   OR notes ILIKE '%charging%'
   OR notes ILIKE '%water damage%'
   OR notes ILIKE '%software%'
   OR notes ILIKE '%update%'
   OR notes ILIKE '%flash%'
   OR notes ILIKE '%unlock%'
   OR notes ILIKE '%root%'
   OR notes ILIKE '%jailbreak%'
   OR method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix'
   OR method = 'service'
   OR method = 'technician'
   OR method = 'workshop'
   OR payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix'
   OR payment_type = 'service'
   OR payment_type = 'technician'
   OR payment_type = 'workshop'
   OR reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%'
   OR reference ILIKE '%service%'
   OR reference ILIKE '%technician%'
   OR reference ILIKE '%workshop%'
   OR reference ILIKE '%xiaomi%'
   OR reference ILIKE '%redmi%'
ORDER BY created_at DESC;

-- =====================================================
-- PART 2: COMPREHENSIVE REPAIR PAYMENTS REMOVAL
-- =====================================================

-- Step 7: Count total repair payments before deletion
DO $$
DECLARE
    repair_count INTEGER;
    total_payments INTEGER;
BEGIN
    SELECT COUNT(*) INTO repair_count
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR notes ILIKE '%fix%'
       OR notes ILIKE '%maintenance%'
       OR notes ILIKE '%xiaomi%'
       OR notes ILIKE '%redmi%'
       OR notes ILIKE '%broken%'
       OR notes ILIKE '%damaged%'
       OR notes ILIKE '%screen%'
       OR notes ILIKE '%battery%'
       OR notes ILIKE '%charging%'
       OR notes ILIKE '%water damage%'
       OR notes ILIKE '%software%'
       OR notes ILIKE '%update%'
       OR notes ILIKE '%flash%'
       OR notes ILIKE '%unlock%'
       OR notes ILIKE '%root%'
       OR notes ILIKE '%jailbreak%'
       OR method = 'repair'
       OR method = 'maintenance'
       OR method = 'fix'
       OR method = 'service'
       OR method = 'technician'
       OR method = 'workshop'
       OR payment_type = 'repair'
       OR payment_type = 'maintenance'
       OR payment_type = 'fix'
       OR payment_type = 'service'
       OR payment_type = 'technician'
       OR payment_type = 'workshop'
       OR reference ILIKE '%repair%'
       OR reference ILIKE '%fix%'
       OR reference ILIKE '%maintenance%'
       OR reference ILIKE '%service%'
       OR reference ILIKE '%technician%'
       OR reference ILIKE '%workshop%'
       OR reference ILIKE '%xiaomi%'
       OR reference ILIKE '%redmi%';
    
    SELECT COUNT(*) INTO total_payments FROM customer_payments;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPREHENSIVE REPAIR CLEANUP ANALYSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total repair payments found: %', repair_count;
    RAISE NOTICE 'Total payments in database: %', total_payments;
    
    IF repair_count > 0 THEN
        RAISE NOTICE '⚠️  These % repair payments will be DELETED!', repair_count;
        RAISE NOTICE '⚠️  This action cannot be undone!';
        RAISE NOTICE '⚠️  Proceeding with deletion...';
    ELSE
        RAISE NOTICE '✅ No repair payments found - database is clean!';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Step 8: DELETE ALL repair payments (comprehensive)
-- WARNING: This will permanently delete the data!
DELETE FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%'
   OR notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%'
   OR notes ILIKE '%broken%'
   OR notes ILIKE '%damaged%'
   OR notes ILIKE '%screen%'
   OR notes ILIKE '%battery%'
   OR notes ILIKE '%charging%'
   OR notes ILIKE '%water damage%'
   OR notes ILIKE '%software%'
   OR notes ILIKE '%update%'
   OR notes ILIKE '%flash%'
   OR notes ILIKE '%unlock%'
   OR notes ILIKE '%root%'
   OR notes ILIKE '%jailbreak%'
   OR method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix'
   OR method = 'service'
   OR method = 'technician'
   OR method = 'workshop'
   OR payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix'
   OR payment_type = 'service'
   OR payment_type = 'technician'
   OR payment_type = 'workshop'
   OR reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%'
   OR reference ILIKE '%service%'
   OR reference ILIKE '%technician%'
   OR reference ILIKE '%workshop%'
   OR reference ILIKE '%xiaomi%'
   OR reference ILIKE '%redmi%';

-- =====================================================
-- PART 3: VERIFICATION AND FINAL REPORT
-- =====================================================

-- Step 9: Verify no repair payments remain
SELECT 
    'REPAIR PAYMENTS AFTER DELETION' as check_type,
    COUNT(*) as remaining_count
FROM customer_payments 
WHERE notes ILIKE '%repair%' 
   OR notes ILIKE '%device repair%'
   OR notes ILIKE '%repair payment%'
   OR notes ILIKE '%fix%'
   OR notes ILIKE '%maintenance%'
   OR notes ILIKE '%xiaomi%'
   OR notes ILIKE '%redmi%'
   OR notes ILIKE '%broken%'
   OR notes ILIKE '%damaged%'
   OR notes ILIKE '%screen%'
   OR notes ILIKE '%battery%'
   OR notes ILIKE '%charging%'
   OR notes ILIKE '%water damage%'
   OR notes ILIKE '%software%'
   OR notes ILIKE '%update%'
   OR notes ILIKE '%flash%'
   OR notes ILIKE '%unlock%'
   OR notes ILIKE '%root%'
   OR notes ILIKE '%jailbreak%'
   OR method = 'repair'
   OR method = 'maintenance'
   OR method = 'fix'
   OR method = 'service'
   OR method = 'technician'
   OR method = 'workshop'
   OR payment_type = 'repair'
   OR payment_type = 'maintenance'
   OR payment_type = 'fix'
   OR payment_type = 'service'
   OR payment_type = 'technician'
   OR payment_type = 'workshop'
   OR reference ILIKE '%repair%'
   OR reference ILIKE '%fix%'
   OR reference ILIKE '%maintenance%'
   OR reference ILIKE '%service%'
   OR reference ILIKE '%technician%'
   OR reference ILIKE '%workshop%'
   OR reference ILIKE '%xiaomi%'
   OR reference ILIKE '%redmi%';

-- Step 10: Show total payments remaining
SELECT 
    'TOTAL PAYMENTS REMAINING' as check_type,
    COUNT(*) as total_count
FROM customer_payments;

-- Step 11: Final comprehensive summary
DO $$
DECLARE
    remaining_repair_count INTEGER;
    total_payments INTEGER;
    cleanup_successful BOOLEAN := FALSE;
BEGIN
    SELECT COUNT(*) INTO remaining_repair_count
    FROM customer_payments 
    WHERE notes ILIKE '%repair%' 
       OR notes ILIKE '%device repair%'
       OR notes ILIKE '%repair payment%'
       OR notes ILIKE '%fix%'
       OR notes ILIKE '%maintenance%'
       OR notes ILIKE '%xiaomi%'
       OR notes ILIKE '%redmi%'
       OR notes ILIKE '%broken%'
       OR notes ILIKE '%damaged%'
       OR notes ILIKE '%screen%'
       OR notes ILIKE '%battery%'
       OR notes ILIKE '%charging%'
       OR notes ILIKE '%water damage%'
       OR notes ILIKE '%software%'
       OR notes ILIKE '%update%'
       OR notes ILIKE '%flash%'
       OR notes ILIKE '%unlock%'
       OR notes ILIKE '%root%'
       OR notes ILIKE '%jailbreak%'
       OR method = 'repair'
       OR method = 'maintenance'
       OR method = 'fix'
       OR method = 'service'
       OR method = 'technician'
       OR method = 'workshop'
       OR payment_type = 'repair'
       OR payment_type = 'maintenance'
       OR payment_type = 'fix'
       OR payment_type = 'service'
       OR payment_type = 'technician'
       OR payment_type = 'workshop'
       OR reference ILIKE '%repair%'
       OR reference ILIKE '%fix%'
       OR reference ILIKE '%maintenance%'
       OR reference ILIKE '%service%'
       OR reference ILIKE '%technician%'
       OR reference ILIKE '%workshop%'
       OR reference ILIKE '%xiaomi%'
       OR reference ILIKE '%redmi%';
    
    SELECT COUNT(*) INTO total_payments FROM customer_payments;
    
    IF remaining_repair_count = 0 THEN
        cleanup_successful := TRUE;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPREHENSIVE REPAIR CLEANUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Repair payments remaining: %', remaining_repair_count;
    RAISE NOTICE 'Total payments in database: %', total_payments;
    
    IF cleanup_successful THEN
        RAISE NOTICE '✅ SUCCESS: All repair payments have been completely removed!';
        RAISE NOTICE '✅ Database is now clean of all repair-related payments!';
        RAISE NOTICE '✅ Cleanup completed successfully!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % repair payments still exist!', remaining_repair_count;
        RAISE NOTICE '⚠️  Manual review may be required.';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANUP STATUS: %', 
        CASE 
            WHEN cleanup_successful THEN 'COMPLETED SUCCESSFULLY'
            ELSE 'REQUIRES MANUAL REVIEW'
        END;
    RAISE NOTICE '========================================';
END $$;

-- Step 12: Final status check
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM customer_payments 
            WHERE notes ILIKE '%repair%' 
               OR notes ILIKE '%device repair%'
               OR notes ILIKE '%repair payment%'
               OR notes ILIKE '%fix%'
               OR notes ILIKE '%maintenance%'
               OR notes ILIKE '%xiaomi%'
               OR notes ILIKE '%redmi%'
               OR notes ILIKE '%broken%'
               OR notes ILIKE '%damaged%'
               OR notes ILIKE '%screen%'
               OR notes ILIKE '%battery%'
               OR notes ILIKE '%charging%'
               OR notes ILIKE '%water damage%'
               OR notes ILIKE '%software%'
               OR notes ILIKE '%update%'
               OR notes ILIKE '%flash%'
               OR notes ILIKE '%unlock%'
               OR notes ILIKE '%root%'
               OR notes ILIKE '%jailbreak%'
               OR method = 'repair'
               OR method = 'maintenance'
               OR method = 'fix'
               OR method = 'service'
               OR method = 'technician'
               OR method = 'workshop'
               OR payment_type = 'repair'
               OR payment_type = 'maintenance'
               OR payment_type = 'fix'
               OR payment_type = 'service'
               OR payment_type = 'technician'
               OR payment_type = 'workshop'
               OR reference ILIKE '%repair%'
               OR reference ILIKE '%fix%'
               OR reference ILIKE '%maintenance%'
               OR reference ILIKE '%service%'
               OR reference ILIKE '%technician%'
               OR reference ILIKE '%workshop%'
               OR reference ILIKE '%xiaomi%'
               OR reference ILIKE '%redmi%'
        ) THEN 'REPAIR PAYMENTS STILL EXIST - MANUAL REVIEW REQUIRED'
        ELSE 'ALL REPAIR PAYMENTS SUCCESSFULLY REMOVED - DATABASE CLEAN'
    END as final_status;

-- Final success message
SELECT 'Comprehensive repair payments cleanup completed!' as status;
