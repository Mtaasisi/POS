-- Fix missing INSERT policy for lats_purchase_order_audit table
-- This resolves the 403 Forbidden error when trying to insert audit records

-- Add missing INSERT policy for lats_purchase_order_audit table
CREATE POLICY "Users can create audit records for their purchase orders" ON lats_purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Add missing UPDATE policy for lats_purchase_order_audit table
CREATE POLICY "Users can update audit records for their purchase orders" ON lats_purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Add missing DELETE policy for lats_purchase_order_audit table
CREATE POLICY "Users can delete audit records for their purchase orders" ON lats_purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON lats_purchase_order_audit TO authenticated;
