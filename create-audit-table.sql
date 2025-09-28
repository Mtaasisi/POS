-- Create audit table for purchase order tracking
CREATE TABLE IF NOT EXISTS lats_purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON lats_purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_created_at ON lats_purchase_order_audit(created_at);

-- Enable RLS on audit table
ALTER TABLE lats_purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit table
CREATE POLICY "Users can view audit records for their purchase orders" ON lats_purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );
