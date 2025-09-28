-- Fix RLS policies for purchase order tables (Final safe version)
-- This version completely avoids policy conflicts

-- Add missing columns that the application expects
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_info JSONB,
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_amount_base_currency DECIMAL(12,2) DEFAULT 0;

-- Drop ALL existing policies for all purchase order tables
DROP POLICY IF EXISTS "Users can view their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can update their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can delete their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Allow all operations on purchase orders" ON lats_purchase_orders;

DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can update purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can delete purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Allow all operations on purchase order audit" ON purchase_order_audit;

DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Allow all operations on purchase order items" ON lats_purchase_order_items;

-- Wait a moment for policies to be fully dropped
-- (This is just a comment - PostgreSQL will handle the timing)

-- Create new policies with unique names
CREATE POLICY "purchase_orders_all_ops" ON lats_purchase_orders
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "purchase_order_audit_all_ops" ON purchase_order_audit
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "purchase_order_items_all_ops" ON lats_purchase_order_items
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Test the fix
SELECT 'lats_purchase_orders' as table_name, COUNT(*) as row_count FROM lats_purchase_orders
UNION ALL
SELECT 'purchase_order_audit' as table_name, COUNT(*) as row_count FROM purchase_order_audit
UNION ALL
SELECT 'lats_purchase_order_items' as table_name, COUNT(*) as row_count FROM lats_purchase_order_items;
