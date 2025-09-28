-- USER MANAGEMENT EXTENSION
-- Additional user management and role-based access control
-- Run this after PERMANENT_AUTH_FIX.sql

-- ===========================================
-- PART 1: CREATE USER ROLES TABLE
-- ===========================================

-- Create a user roles table for better access control
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

-- Create policies for user_roles
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
-- PART 2: CREATE ROLE MANAGEMENT FUNCTIONS
-- ===========================================

-- Function to assign role to user
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

-- Function to get user permissions
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
-- PART 3: ENHANCED SALES POLICIES WITH ROLES
-- ===========================================

-- Drop existing policies to replace with role-based ones
DROP POLICY IF EXISTS "Authenticated users can view all sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update their sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can delete their sales" ON lats_sales;

-- Create role-based policies for lats_sales
CREATE POLICY "Role-based sales access" ON lats_sales
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see their own sales
            created_by = auth.uid() OR
            -- Admins can see all sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'admin'
            ) OR
            -- Managers can see all sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'manager'
            )
        )
    );

CREATE POLICY "Role-based sales creation" ON lats_sales
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users with sales permission can create sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND (permissions ->> 'sales')::BOOLEAN = TRUE
            ) OR
            -- Admins can create sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'admin'
            )
        ) AND created_by = auth.uid()
    );

CREATE POLICY "Role-based sales update" ON lats_sales
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update their own sales
            (created_by = auth.uid() AND updated_by = auth.uid()) OR
            -- Admins can update any sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'admin'
            ) OR
            -- Managers can update any sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'manager'
            )
        )
    );

CREATE POLICY "Role-based sales deletion" ON lats_sales
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete their own sales
            created_by = auth.uid() OR
            -- Admins can delete any sales
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role_name = 'admin'
            )
        )
    );

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
-- PART 5: CREATE AUDIT LOGGING
-- ===========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs (only admins can view)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    table_name VARCHAR(100),
    record_id UUID,
    action VARCHAR(20),
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name, 
        record_id, 
        action, 
        old_values, 
        new_values, 
        user_id, 
        user_email,
        ip_address,
        user_agent
    ) VALUES (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        auth.uid(),
        auth.jwt() ->> 'email',
        inet_client_addr(),
        current_setting('request.headers', true)::json ->> 'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 6: ENHANCED AUDIT TRIGGERS
-- ===========================================

-- Enhanced audit function with logging
CREATE OR REPLACE FUNCTION enhanced_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Log the insert
        PERFORM log_audit_event(
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            NULL,
            to_jsonb(NEW)
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
        
        -- Log the update
        PERFORM log_audit_event(
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Log the delete
        PERFORM log_audit_event(
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            to_jsonb(OLD),
            NULL
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers to use enhanced audit function
DROP TRIGGER IF EXISTS audit_lats_sales ON lats_sales;
CREATE TRIGGER audit_lats_sales
    BEFORE INSERT OR UPDATE OR DELETE ON lats_sales
    FOR EACH ROW EXECUTE FUNCTION enhanced_audit_fields();

-- ===========================================
-- PART 7: FINAL SETUP AND VERIFICATION
-- ===========================================

-- Create default admin user
SELECT create_default_admin();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Final verification
DO $$
DECLARE
    admin_count INTEGER;
    role_count INTEGER;
BEGIN
    -- Check if admin user was created
    SELECT COUNT(*) INTO admin_count FROM user_roles WHERE role_name = 'admin';
    SELECT COUNT(*) INTO role_count FROM user_roles;
    
    RAISE NOTICE 'User Management Extension Applied Successfully!';
    RAISE NOTICE 'Admin users: %, Total roles: %', admin_count, role_count;
    RAISE NOTICE 'Role-based access control is now active.';
    RAISE NOTICE 'Audit logging is enabled for all operations.';
END $$;

-- Final status
SELECT 
    'USER MANAGEMENT EXTENSION COMPLETED' as status,
    'Role-based access control and audit logging enabled' as message,
    NOW() as applied_at;
