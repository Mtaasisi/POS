-- Fix foreign key constraint for purchase_order_payments table
-- The table should reference auth_users instead of auth.users

-- Drop the existing foreign key constraint
ALTER TABLE purchase_order_payments 
DROP CONSTRAINT IF EXISTS purchase_order_payments_created_by_fkey;

-- Add the correct foreign key constraint to reference auth_users table
ALTER TABLE purchase_order_payments 
ADD CONSTRAINT purchase_order_payments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE SET NULL;

-- Update the RLS policies to work with auth_users table
DROP POLICY IF EXISTS "Users can view purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can create purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can update their purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can delete their purchase order payments" ON purchase_order_payments;

-- Create new RLS policies that work with auth_users table
CREATE POLICY "Users can view purchase order payments" ON purchase_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            JOIN auth_users au ON po.created_by = au.id
            WHERE po.id = purchase_order_payments.purchase_order_id
            AND au.id = auth.uid()
        )
    );

CREATE POLICY "Users can create purchase order payments" ON purchase_order_payments
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            JOIN auth_users au ON po.created_by = au.id
            WHERE po.id = purchase_order_payments.purchase_order_id
            AND au.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their purchase order payments" ON purchase_order_payments
    FOR UPDATE USING (
        created_by = auth.uid()
    );

CREATE POLICY "Users can delete their purchase order payments" ON purchase_order_payments
    FOR DELETE USING (
        created_by = auth.uid()
    );
