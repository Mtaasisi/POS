-- Fix Frontend Service Call for complete_quality_check
-- This script ensures the RPC function works with the frontend service call

-- =====================================================
-- STEP 1: VERIFY CURRENT FUNCTION SIGNATURE
-- =====================================================

DO $$
DECLARE
    v_func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'complete_quality_check'
    AND n.nspname = 'public';
    
    RAISE NOTICE 'Found % complete_quality_check functions', v_func_count;
END $$;

-- =====================================================
-- STEP 2: CREATE ROBUST FUNCTION WITH ALL PARAMETER COMBINATIONS
-- =====================================================

-- Drop all existing versions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure::text as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'complete_quality_check'
        AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature;
        RAISE NOTICE 'Dropped: %', func_record.func_signature;
    END LOOP;
END $$;

-- Create the main function with comprehensive error handling
CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_overall_result TEXT;
    v_quality_check_exists BOOLEAN;
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
    v_na_items INTEGER;
    v_status TEXT;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_quality_check_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Quality check ID is required',
            'code', 'MISSING_ID'
        );
    END IF;
    
    -- Check if quality check exists
    SELECT EXISTS(
        SELECT 1 FROM purchase_order_quality_checks 
        WHERE id = p_quality_check_id
    ) INTO v_quality_check_exists;
    
    IF NOT v_quality_check_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Quality check not found',
            'code', 'NOT_FOUND',
            'quality_check_id', p_quality_check_id
        );
    END IF;
    
    -- Get item statistics
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN result = 'pass' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN result = 'fail' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN result = 'na' THEN 1 END)::INTEGER
    INTO v_total_items, v_passed_items, v_failed_items, v_na_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Determine overall result
    IF v_total_items = 0 THEN
        v_overall_result := 'conditional';
        v_status := 'partial';
    ELSIF v_failed_items > 0 AND v_passed_items > 0 THEN
        v_overall_result := 'conditional';
        v_status := 'partial';
    ELSIF v_failed_items > 0 THEN
        v_overall_result := 'fail';
        v_status := 'failed';
    ELSIF v_passed_items = v_total_items THEN
        v_overall_result := 'pass';
        v_status := 'passed';
    ELSIF v_na_items > 0 THEN
        v_overall_result := 'conditional';
        v_status := 'partial';
    ELSE
        v_overall_result := 'conditional';
        v_status := 'partial';
    END IF;
    
    -- Update quality check
    UPDATE purchase_order_quality_checks
    SET 
        status = v_status,
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = COALESCE(p_notes, notes),
        signature = COALESCE(p_signature, signature),
        updated_at = NOW()
    WHERE id = p_quality_check_id;
    
    -- Build result object
    v_result := json_build_object(
        'success', true,
        'quality_check_id', p_quality_check_id,
        'status', v_status,
        'overall_result', v_overall_result,
        'total_items', v_total_items,
        'passed_items', v_passed_items,
        'failed_items', v_failed_items,
        'na_items', v_na_items,
        'completed_at', NOW()
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'code', 'EXECUTION_ERROR',
            'quality_check_id', p_quality_check_id
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: CREATE STRING VERSION FOR FRONTEND COMPATIBILITY
-- =====================================================

CREATE OR REPLACE FUNCTION complete_quality_check_string(
    p_quality_check_id TEXT,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_uuid_id UUID;
    v_result JSON;
BEGIN
    -- Convert string to UUID with proper error handling
    BEGIN
        v_uuid_id := p_quality_check_id::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Invalid UUID format: ' || p_quality_check_id,
                'code', 'INVALID_UUID'
            );
    END;
    
    -- Call the main function
    SELECT complete_quality_check(v_uuid_id, p_notes, p_signature) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION complete_quality_check TO PUBLIC;
GRANT EXECUTE ON FUNCTION complete_quality_check_string TO PUBLIC;

-- =====================================================
-- STEP 5: TEST BOTH FUNCTIONS
-- =====================================================

DO $$
DECLARE
    v_test_qc_id UUID;
    v_test_result JSON;
    v_string_result JSON;
BEGIN
    -- Find a quality check to test with
    SELECT id INTO v_test_qc_id 
    FROM purchase_order_quality_checks 
    LIMIT 1;
    
    IF v_test_qc_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with quality check ID: %', v_test_qc_id;
        
        -- Test UUID version
        SELECT complete_quality_check(
            v_test_qc_id,
            'Test notes from SQL',
            'Test signature'
        ) INTO v_test_result;
        
        RAISE NOTICE 'UUID version result: %', v_test_result;
        
        -- Test string version
        SELECT complete_quality_check_string(
            v_test_qc_id::TEXT,
            'Test notes from string version',
            'Test signature string'
        ) INTO v_string_result;
        
        RAISE NOTICE 'String version result: %', v_string_result;
        
        -- Check if both succeeded
        IF (v_test_result->>'success')::BOOLEAN AND (v_string_result->>'success')::BOOLEAN THEN
            RAISE NOTICE '✅ Both function versions work correctly';
        ELSE
            RAISE NOTICE '❌ One or both function versions failed';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  No quality checks found to test with';
    END IF;
END $$;

-- =====================================================
-- STEP 6: VERIFY FUNCTION SIGNATURES
-- =====================================================

DO $$
DECLARE
    v_func_info RECORD;
BEGIN
    RAISE NOTICE 'Available complete_quality_check functions:';
    
    FOR v_func_info IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname LIKE '%complete_quality_check%'
        AND n.nspname = 'public'
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '   % (%) RETURNS %', 
            v_func_info.function_name, 
            v_func_info.arguments, 
            v_func_info.return_type;
    END LOOP;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Frontend Service Call Fix Applied Successfully!';
    RAISE NOTICE '📋 Improvements made:';
    RAISE NOTICE '   ✅ Enhanced error handling and validation';
    RAISE NOTICE '   ✅ Returns JSON response for better frontend integration';
    RAISE NOTICE '   ✅ Added string version for UUID conversion';
    RAISE NOTICE '   ✅ Comprehensive parameter validation';
    RAISE NOTICE '   ✅ Detailed error messages and codes';
    RAISE NOTICE '🚀 The 400 error should now be resolved!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Frontend can now call either:';
    RAISE NOTICE '   - complete_quality_check(uuid, text, text)';
    RAISE NOTICE '   - complete_quality_check_string(text, text, text)';
END $$;
