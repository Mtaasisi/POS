-- Safe audit table creation SQL
-- Run this in your Supabase SQL Editor

-- Create audit table for purchase order tracking (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS lats_purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchase_order_audit_order_id') THEN
        CREATE INDEX idx_purchase_order_audit_order_id ON lats_purchase_order_audit(purchase_order_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchase_order_audit_created_at') THEN
        CREATE INDEX idx_purchase_order_audit_created_at ON lats_purchase_order_audit(created_at);
    END IF;
END $$;

-- Enable RLS on audit table (safe to run multiple times)
ALTER TABLE lats_purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON lats_purchase_order_audit;

-- Create RLS policy for audit table
CREATE POLICY "Users can view audit records for their purchase orders" ON lats_purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Grant permissions (safe to run multiple times)
GRANT SELECT ON lats_purchase_order_audit TO authenticated;
GRANT INSERT ON lats_purchase_order_audit TO authenticated;
