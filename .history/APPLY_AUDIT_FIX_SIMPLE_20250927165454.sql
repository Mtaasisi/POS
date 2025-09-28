-- Simple fix for purchase_order_audit table schema mismatch
-- This fixes the 400 Bad Request error in process_purchase_order_payment RPC

-- Drop and recreate the audit table with correct schema
DROP TABLE IF EXISTS purchase_order_audit CASCADE;

CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);

-- Enable RLS
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON purchase_order_audit TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
