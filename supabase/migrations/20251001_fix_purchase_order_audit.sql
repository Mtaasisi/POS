-- =====================================================
-- FIX PURCHASE ORDER AUDIT TABLE AND RPC FUNCTION
-- =====================================================
-- This migration fixes the audit logging issues

-- Ensure the table structure is correct
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- Enable RLS
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Authenticated users can view audit records" ON purchase_order_audit;
DROP POLICY IF EXISTS "Authenticated users can insert audit records" ON purchase_order_audit;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view audit records" 
ON purchase_order_audit FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert audit records" 
ON purchase_order_audit FOR INSERT 
TO authenticated
WITH CHECK (true);

-- =====================================================
-- RECREATE HELPER FUNCTION
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS log_purchase_order_audit(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS log_purchase_order_audit(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS log_purchase_order_audit(UUID, TEXT);

-- Create the function with all parameter variations
CREATE OR REPLACE FUNCTION log_purchase_order_audit(
    p_purchase_order_id UUID,
    p_action TEXT,
    p_details TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
BEGIN
    -- Use provided user_id or fall back to current user
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    -- If still no user, just log it anyway (for system actions)
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
    
    -- Insert audit entry
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
        COALESCE(p_details, ''),
        v_user_id,
        v_user_id,
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE WARNING 'Failed to log audit entry: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_purchase_order_audit TO authenticated;
GRANT EXECUTE ON FUNCTION log_purchase_order_audit TO anon;

-- Add comment
COMMENT ON FUNCTION log_purchase_order_audit IS 'Helper function to log purchase order audit entries. Uses SECURITY DEFINER to bypass RLS policies.';

