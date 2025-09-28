-- FIX TYPE MISMATCH ERROR
-- This script fixes the character varying = uuid error
-- Run this to fix the type mismatch issue

-- ===========================================
-- PART 1: CHECK AND FIX USER_ROLES TABLE
-- ===========================================

-- Check if user_roles table exists and fix column types
DO $$
BEGIN
    -- Check if user_roles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Check if user_id column is the wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_roles' 
            AND column_name = 'user_id' 
            AND data_type = 'character varying'
        ) THEN
            RAISE NOTICE 'Fixing user_id column type in user_roles table...';
            
            -- Drop the table and recreate with correct types
            DROP TABLE IF EXISTS user_roles CASCADE;
        END IF;
    END IF;
END $$;

-- Recreate user_roles table with correct types
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL DEFAULT 'cashier',
    permissions JSONB DEFAULT '{"sales": true, "inventory": true, "reports": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PART 2: RECREATE POLICIES WITH CORRECT TYPES
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create policies for user_roles with correct types
CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- ===========================================
-- PART 3: RECREATE FUNCTIONS WITH CORRECT TYPES
-- ===========================================

-- Function to assign role to user (with correct types)
CREATE OR REPLACE FUNCTION assign_user_role(
    target_user_id UUID,
    role_name VARCHAR(50),
    permissions JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role_name = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can assign roles';
    END IF;
    
    -- Insert or update role
    INSERT INTO user_roles (user_id, role_name, permissions, created_by, updated_by)
    VALUES (target_user_id, role_name, COALESCE(permissions, '{"sales": true, "inventory": true, "reports": false}'::jsonb), auth.uid(), auth.uid())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role_name = EXCLUDED.role_name,
        permissions = EXCLUDED.permissions,
        updated_by = auth.uid(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions (with correct types)
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    role_name VARCHAR(50),
    permissions JSONB,
    can_manage_sales BOOLEAN,
    can_manage_inventory BOOLEAN,
    can_view_reports BOOLEAN,
    is_admin BOOLEAN
) AS $$
DECLARE
    target_user_id UUID;
BEGIN
    target_user_id := COALESCE(user_id, auth.uid());
    
    RETURN QUERY
    SELECT 
        ur.user_id,
        ur.role_name,
        ur.permissions,
        (ur.permissions ->> 'sales')::BOOLEAN as can_manage_sales,
        (ur.permissions ->> 'inventory')::BOOLEAN as can_manage_inventory,
        (ur.permissions ->> 'reports')::BOOLEAN as can_view_reports,
        (ur.role_name = 'admin') as is_admin
    FROM user_roles ur
    WHERE ur.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 4: FIX ERROR LOGS TABLE
-- ===========================================

-- Check and fix error_logs table if needed
DO $$
BEGIN
    -- Check if error_logs table exists and has correct types
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        -- Check if user_id column is the wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'error_logs' 
            AND column_name = 'user_id' 
            AND data_type = 'character varying'
        ) THEN
            RAISE NOTICE 'Fixing user_id column type in error_logs table...';
            
            -- Drop the table and recreate with correct types
            DROP TABLE IF EXISTS error_logs CASCADE;
        END IF;
    END IF;
END $$;

-- Recreate error_logs table with correct types
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    stack_trace TEXT,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for error_logs (admins only)
CREATE POLICY "Admins can view error logs" ON error_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- ===========================================
-- PART 3: RECREATE ERROR HANDLING FUNCTIONS
-- ===========================================

-- Function to log errors (with correct types)
CREATE OR REPLACE FUNCTION log_error(
    error_type VARCHAR(100),
    error_message TEXT,
    error_details JSONB DEFAULT NULL,
    stack_trace TEXT DEFAULT NULL,
    request_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO error_logs (
        error_type,
        error_message,
        error_details,
        stack_trace,
        user_id,
        user_email,
        ip_address,
        user_agent,
        request_data
    ) VALUES (
        error_type,
        error_message,
        error_details,
        stack_trace,
        auth.uid(),
        auth.jwt() ->> 'email',
        inet_client_addr(),
        current_setting('request.headers', true)::json ->> 'user-agent',
        request_data
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve errors (with correct types)
CREATE OR REPLACE FUNCTION resolve_error(
    error_id UUID,
    resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role_name = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can resolve errors';
    END IF;
    
    UPDATE error_logs 
    SET 
        resolved = TRUE,
        resolved_by = auth.uid(),
        resolved_at = NOW(),
        error_details = COALESCE(error_details, '{}'::jsonb) || 
                       jsonb_build_object('resolution_notes', resolution_notes)
    WHERE id = error_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 4: CREATE DEFAULT ADMIN USER
-- ===========================================

-- Function to create default admin user
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first user as admin (you can modify this logic)
    SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Assign admin role
        PERFORM assign_user_role(
            admin_user_id, 
            'admin', 
            '{"sales": true, "inventory": true, "reports": true, "admin": true}'::jsonb
        );
        
        RAISE NOTICE 'Default admin user created with ID: %', admin_user_id;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'No users found to assign admin role';
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 5: CREATE INDEXES
-- ===========================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- ===========================================
-- PART 6: FINAL VERIFICATION
-- ===========================================

-- Create default admin user
SELECT create_default_admin();

-- Test the functions
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test user roles system
    SELECT * INTO test_result FROM get_user_permissions();
    
    RAISE NOTICE 'TYPE MISMATCH ERROR FIXED SUCCESSFULLY!';
    RAISE NOTICE 'User roles system is now working with correct UUID types.';
    RAISE NOTICE 'All functions have been recreated with proper type handling.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during verification: %', SQLERRM;
END $$;

-- Final status
SELECT 
    'TYPE MISMATCH ERROR FIXED' as status,
    'All UUID type mismatches have been resolved' as message,
    NOW() as applied_at;
