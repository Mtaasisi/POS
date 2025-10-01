-- Fix purchase_order_payments table schema mismatch
-- This script ensures the table has all required columns

-- First, let's check what columns exist and add missing ones
ALTER TABLE purchase_order_payments 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id),
ADD COLUMN IF NOT EXISTS payment_method_id UUID,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth_users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();

-- Add payment_method column if it doesn't exist
ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Add payment_date column if it doesn't exist  
ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();

-- Set default values for new columns
UPDATE purchase_order_payments 
SET 
    payment_method = 'Cash',
    payment_date = COALESCE(created_at, NOW())
WHERE 
    payment_method IS NULL 
    OR payment_date IS NULL;

-- Add constraints if they don't exist
ALTER TABLE purchase_order_payments 
ALTER COLUMN payment_method SET NOT NULL,
ALTER COLUMN payment_date SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_po_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_account_id ON purchase_order_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_status ON purchase_order_payments(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_payment_date ON purchase_order_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_created_at ON purchase_order_payments(created_at);

-- Update RLS policies to handle both schemas
DROP POLICY IF EXISTS "Users can view purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can create purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can update their purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can delete their purchase order payments" ON purchase_order_payments;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view purchase order payments" ON purchase_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_payments.purchase_order_id
            AND (po.created_by = auth.uid() OR auth.uid() IS NOT NULL)
        )
    );

CREATE POLICY "Users can create purchase order payments" ON purchase_order_payments
    FOR INSERT WITH CHECK (
        (created_by = auth.uid() OR auth.uid() IS NOT NULL)
        AND EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_payments.purchase_order_id
        )
    );

CREATE POLICY "Users can update purchase order payments" ON purchase_order_payments
    FOR UPDATE USING (
        created_by = auth.uid() OR auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete purchase order payments" ON purchase_order_payments
    FOR DELETE USING (
        created_by = auth.uid() OR auth.uid() IS NOT NULL
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_payments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

SELECT 'Purchase order payments table schema fixed successfully!' as status;
