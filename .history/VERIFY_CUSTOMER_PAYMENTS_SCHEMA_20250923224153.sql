-- =====================================================
-- VERIFY CUSTOMER_PAYMENTS TABLE SCHEMA
-- =====================================================
-- Run this script to check the current state of your customer_payments table
-- and identify what needs to be fixed for the 400 error

-- =====================================================
-- CHECK CURRENT TABLE STRUCTURE
-- =====================================================

SELECT 
    'CURRENT TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK FOR MISSING REQUIRED COLUMNS
-- =====================================================

DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'customer_id', 'device_id', 'amount', 'method', 
        'payment_type', 'status', 'payment_date', 'created_by', 
        'created_at', 'updated_at', 'currency', 'payment_account_id', 
        'payment_method_id', 'reference', 'notes', 'updated_by'
    ];
    col_name TEXT;
    present_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check for missing columns
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customer_payments'
            AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        ELSE
            present_columns := array_append(present_columns, col_name);
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CUSTOMER_PAYMENTS SCHEMA VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Present columns: %', array_to_string(present_columns, ', ');
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ All required columns are present!';
    ELSE
        RAISE NOTICE '❌ Missing columns: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '⚠️  These missing columns are likely causing the 400 error!';
    END IF;
    
END $$;

-- =====================================================
-- CHECK CONSTRAINTS
-- =====================================================

SELECT 
    'CHECK CONSTRAINTS' as check_type,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name LIKE 'check_customer_payments_%';

-- =====================================================
-- CHECK INDEXES
-- =====================================================

SELECT 
    'PERFORMANCE INDEXES' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'customer_payments'
AND indexname LIKE 'idx_customer_payments_%';

-- =====================================================
-- CHECK TRIGGERS
-- =====================================================

SELECT 
    'TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%customer_payments%';

-- =====================================================
-- CHECK RLS POLICIES
-- =====================================================

SELECT 
    'RLS POLICIES' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customer_payments';

-- =====================================================
-- CHECK PERMISSIONS
-- =====================================================

SELECT 
    'TABLE PERMISSIONS' as check_type,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
AND grantee = 'authenticated';

-- =====================================================
-- CHECK FUNCTIONS
-- =====================================================

SELECT 
    'FUNCTIONS' as check_type,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%customer_payment%';

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
    permission_count INTEGER;
BEGIN
    -- Count various elements
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'customer_payments';
    
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' AND constraint_name LIKE 'check_customer_payments_%';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'customer_payments' AND indexname LIKE 'idx_customer_payments_%';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' AND trigger_name LIKE '%customer_payments%';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'customer_payments';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name LIKE '%customer_payment%';
    
    SELECT COUNT(*) INTO permission_count
    FROM information_schema.table_privileges 
    WHERE table_schema = 'public' AND table_name = 'customer_payments' AND grantee = 'authenticated';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUMMARY REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Columns: %', column_count;
    RAISE NOTICE 'Check constraints: %', constraint_count;
    RAISE NOTICE 'Performance indexes: %', index_count;
    RAISE NOTICE 'Triggers: %', trigger_count;
    RAISE NOTICE 'RLS policies: %', policy_count;
    RAISE NOTICE 'Functions: %', function_count;
    RAISE NOTICE 'Authenticated permissions: %', permission_count;
    RAISE NOTICE '========================================';
    
    -- Provide recommendations
    IF column_count < 17 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Run COMPREHENSIVE_CUSTOMER_PAYMENTS_400_FIX.sql to add missing columns';
    END IF;
    
    IF constraint_count < 4 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Add data validation constraints';
    END IF;
    
    IF index_count < 6 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Add performance indexes';
    END IF;
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Add update trigger for updated_at column';
    END IF;
    
    IF policy_count = 0 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Add RLS policy for authenticated users';
    END IF;
    
    IF permission_count < 4 THEN
        RAISE NOTICE '⚠️  RECOMMENDATION: Grant proper permissions to authenticated role';
    END IF;
    
    RAISE NOTICE '========================================';
    
END $$;
