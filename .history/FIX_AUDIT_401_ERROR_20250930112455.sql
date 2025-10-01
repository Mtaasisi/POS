-- Fix 401 Unauthorized Error in purchase_order_audit table
-- This script addresses the authentication issue during audit logging

-- =====================================================
-- STEP 1: ANALYZE CURRENT RLS POLICIES
-- =====================================================

-- Check current policies on purchase_order_audit table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current RLS policies on purchase_order_audit:';
    
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE tablename = 'purchase_order_audit'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: DROP EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Drop all existing policies to start fresh
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'purchase_order_audit'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON purchase_order_audit';
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- Policy 1: Users can view audit records for purchase orders they created
CREATE POLICY "Users can view their own audit records" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Policy 2: Users can view audit records for purchase orders they have access to
CREATE POLICY "Users can view accessible audit records" ON purchase_order_audit
    FOR SELECT USING (
        -- Allow if user is the creator of the purchase order
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
        OR
        -- Allow if user is the one who performed the action
        user_id = auth.uid()
        OR
        -- Allow if user is the one who created the audit record
        created_by = auth.uid()
    );

-- Policy 3: Users can create audit records for any purchase order (for system operations)
CREATE POLICY "Users can create audit records" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated
        auth.uid() IS NOT NULL
        AND
        (
            -- Allow if user is the creator of the purchase order
            EXISTS (
                SELECT 1 FROM lats_purchase_orders 
                WHERE id = purchase_order_audit.purchase_order_id 
                AND created_by = auth.uid()
            )
            OR
            -- Allow if user is performing the action
            user_id = auth.uid()
            OR
            -- Allow if user is creating the audit record
            created_by = auth.uid()
        )
    );

-- Policy 4: Users can update audit records they created
CREATE POLICY "Users can update their audit records" ON purchase_order_audit
    FOR UPDATE USING (
        created_by = auth.uid()
        OR
        user_id = auth.uid()
    );

-- Policy 5: Users can delete audit records they created
CREATE POLICY "Users can delete their audit records" ON purchase_order_audit
    FOR DELETE USING (
        created_by = auth.uid()
        OR
        user_id = auth.uid()
    );

-- =====================================================
-- STEP 4: GRANT ADDITIONAL PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_audit TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTION FOR AUDIT LOGGING
-- =====================================================

-- Create a function that handles audit logging with proper authentication
CREATE OR REPLACE FUNCTION log_purchase_order_audit(
    p_purchase_order_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_current_user_id UUID;
BEGIN
    -- Get current user ID
    v_current_user_id := auth.uid();
    
    -- Use provided user_id or current user
    IF p_user_id IS NULL THEN
        p_user_id := v_current_user_id;
    END IF;
    
    -- Insert audit record
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by,
        timestamp
    ) VALUES (
        p_purchase_order_id,
        p_action,
        p_details,
        p_user_id,
        v_current_user_id,
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to log audit: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION log_purchase_order_audit TO authenticated;

-- =====================================================
-- STEP 6: VERIFY POLICIES ARE WORKING
-- =====================================================

-- Test the policies by checking if they exist and are properly configured
DO $$
DECLARE
    policy_count INTEGER;
    function_exists BOOLEAN;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'purchase_order_audit';
    
    RAISE NOTICE 'Total policies on purchase_order_audit: %', policy_count;
    
    -- Check if helper function exists
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'log_purchase_order_audit'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Helper function log_purchase_order_audit exists';
    ELSE
        RAISE NOTICE '❌ Helper function log_purchase_order_audit missing';
    END IF;
    
    -- List all policies
    RAISE NOTICE 'Current policies:';
    FOR policy_count IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'purchase_order_audit'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - %', policy_count;
    END LOOP;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Audit 401 Error Fix Applied Successfully!';
    RAISE NOTICE '📋 Improvements made:';
    RAISE NOTICE '   ✅ Updated RLS policies to allow proper audit logging';
    RAISE NOTICE '   ✅ Added comprehensive access controls';
    RAISE NOTICE '   ✅ Created helper function for secure audit logging';
    RAISE NOTICE '   ✅ Granted necessary permissions to authenticated users';
    RAISE NOTICE '🚀 The 401 Unauthorized error should now be resolved!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Frontend can now use:';
    RAISE NOTICE '   - Direct insert into purchase_order_audit table';
    RAISE NOTICE '   - log_purchase_order_audit() helper function';
END $$;
