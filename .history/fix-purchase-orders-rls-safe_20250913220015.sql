-- Fix RLS policies for lats_purchase_orders table (Safe version)
-- This version handles existing policies gracefully

-- Add missing columns that the application expects
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_info JSONB,
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_amount_base_currency DECIMAL(12,2) DEFAULT 0;

-- Drop all existing policies (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can view their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can update their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can delete their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Allow all operations on purchase orders" ON lats_purchase_orders;

-- Drop existing policies for purchase_order_audit (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can update purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can delete purchase order audit" ON purchase_order_audit;

-- Drop existing policies for lats_purchase_order_items
DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;

-- Create permissive policies for lats_purchase_orders
CREATE POLICY "Allow all operations on purchase orders" ON lats_purchase_orders
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Create permissive policies for purchase_order_audit
CREATE POLICY "Allow all operations on purchase order audit" ON purchase_order_audit
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Create permissive policies for lats_purchase_order_items
CREATE POLICY "Allow all operations on purchase order items" ON lats_purchase_order_items
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Test the fix by checking if we can select from the tables
SELECT 'lats_purchase_orders' as table_name, COUNT(*) as row_count FROM lats_purchase_orders
UNION ALL
SELECT 'purchase_order_audit' as table_name, COUNT(*) as row_count FROM purchase_order_audit
UNION ALL
SELECT 'lats_purchase_order_items' as table_name, COUNT(*) as row_count FROM lats_purchase_order_items;
