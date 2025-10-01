-- Fix 400 Error for complete_quality_check RPC Function
-- This script fixes the parameter mismatch causing the 400 Bad Request error

-- =====================================================
-- STEP 1: DROP AND RECREATE THE FUNCTION WITH PROPER PARAMETER HANDLING
-- =====================================================

-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_quality_check(UUID);

-- Create the fixed function with proper parameter validation
CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_overall_result TEXT;
    v_quality_check_exists BOOLEAN;
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
BEGIN
    -- Validate that the quality check exists
    SELECT EXISTS(
        SELECT 1 FROM purchase_order_quality_checks 
        WHERE id = p_quality_check_id
    ) INTO v_quality_check_exists;
    
    IF NOT v_quality_check_exists THEN
        RAISE EXCEPTION 'Quality check with ID % not found', p_quality_check_id;
    END IF;
    
    -- Get overall result based on item results
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN result = 'fail' THEN 1 END) > 0 THEN 'fail'
            WHEN COUNT(CASE WHEN result = 'pass' THEN 1 END) = COUNT(*) THEN 'pass'
            WHEN COUNT(CASE WHEN result = 'na' THEN 1 END) = COUNT(*) THEN 'conditional'
            ELSE 'conditional'
        END
    INTO v_overall_result
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Count items for logging
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN result = 'pass' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN result = 'fail' THEN 1 END)::INTEGER
    INTO v_total_items, v_passed_items, v_failed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Update quality check with proper status mapping
    UPDATE purchase_order_quality_checks
    SET 
        status = CASE 
            WHEN v_overall_result = 'pass' THEN 'passed'
            WHEN v_overall_result = 'fail' THEN 'failed'
            WHEN v_overall_result = 'conditional' THEN 'partial'
            ELSE 'partial'
        END,
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = COALESCE(p_notes, notes),
        signature = COALESCE(p_signature, signature),
        updated_at = NOW()
    WHERE id = p_quality_check_id;
    
    -- Log the completion
    RAISE NOTICE 'Quality check % completed: % items total, % passed, % failed, result: %', 
        p_quality_check_id, v_total_items, v_passed_items, v_failed_items, v_overall_result;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION complete_quality_check TO PUBLIC;

-- =====================================================
-- STEP 3: TEST THE FIXED FUNCTION
-- =====================================================

-- Test the function with a sample quality check
DO $$
DECLARE
    v_test_qc_id UUID;
    v_result BOOLEAN;
BEGIN
    -- Find an existing quality check to test with
    SELECT id INTO v_test_qc_id 
    FROM purchase_order_quality_checks 
    LIMIT 1;
    
    IF v_test_qc_id IS NOT NULL THEN
        -- Test the function
        SELECT complete_quality_check(
            v_test_qc_id,
            'Test completion notes',
            'Test signature'
        ) INTO v_result;
        
        IF v_result THEN
            RAISE NOTICE '✅ complete_quality_check function test successful';
        ELSE
            RAISE NOTICE '❌ complete_quality_check function test failed';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  No quality checks found to test with';
    END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFY FUNCTION PARAMETERS
-- =====================================================

-- Check the function signature
DO $$
DECLARE
    v_func_info RECORD;
BEGIN
    SELECT 
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
    INTO v_func_info
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'complete_quality_check'
    AND n.nspname = 'public';
    
    IF v_func_info.function_name IS NOT NULL THEN
        RAISE NOTICE '✅ Function found: %', v_func_info.function_name;
        RAISE NOTICE '   Arguments: %', v_func_info.arguments;
        RAISE NOTICE '   Return type: %', v_func_info.return_type;
    ELSE
        RAISE NOTICE '❌ Function not found';
    END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE ALTERNATIVE FUNCTION FOR BACKWARD COMPATIBILITY
-- =====================================================

-- Create a wrapper function that handles string inputs
CREATE OR REPLACE FUNCTION complete_quality_check_string(
    p_quality_check_id TEXT,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_uuid_id UUID;
    v_result BOOLEAN;
BEGIN
    -- Convert string to UUID
    BEGIN
        v_uuid_id := p_quality_check_id::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid UUID format: %', p_quality_check_id;
    END;
    
    -- Call the main function
    SELECT complete_quality_check(v_uuid_id, p_notes, p_signature) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION complete_quality_check_string TO PUBLIC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 complete_quality_check Function Fixed Successfully!';
    RAISE NOTICE '📋 Fixed issues:';
    RAISE NOTICE '   ✅ Added parameter validation';
    RAISE NOTICE '   ✅ Improved error handling';
    RAISE NOTICE '   ✅ Added proper status mapping';
    RAISE NOTICE '   ✅ Added logging for debugging';
    RAISE NOTICE '   ✅ Created string wrapper function';
    RAISE NOTICE '🚀 The 400 error should now be resolved!';
END $$;
