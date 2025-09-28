-- Fix RLS policies for lats_purchase_orders table
-- This should resolve the 400 Bad Request error

-- First, check if RLS is enabled and what policies exist
-- (This is just for reference - you can run this to see current state)
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'lats_purchase_orders';
-- SELECT * FROM pg_policies WHERE tablename = 'lats_purchase_orders';

-- Add missing columns to lats_purchase_orders if they don't exist
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_info JSONB,
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_amount_base_currency DECIMAL(12,2) DEFAULT 0;

-- Enable RLS on lats_purchase_orders table
ALTER TABLE lats_purchase_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can update their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can delete their purchase orders" ON lats_purchase_orders;

-- Create RLS policies for lats_purchase_orders
-- Users can view their own purchase orders
CREATE POLICY "Users can view their purchase orders" ON lats_purchase_orders
    FOR SELECT USING (
        created_by = auth.uid() OR created_by IS NULL
    );

-- Users can create purchase orders
CREATE POLICY "Users can create purchase orders" ON lats_purchase_orders
    FOR INSERT WITH CHECK (
        created_by = auth.uid() OR created_by IS NULL
    );

-- Users can update their own purchase orders
CREATE POLICY "Users can update their purchase orders" ON lats_purchase_orders
    FOR UPDATE USING (
        created_by = auth.uid() OR created_by IS NULL
    );

-- Users can delete their own purchase orders
CREATE POLICY "Users can delete their purchase orders" ON lats_purchase_orders
    FOR DELETE USING (
        created_by = auth.uid() OR created_by IS NULL
    );

-- Test the policies by checking if we can select from the table
-- (This should work if the policies are correct)
SELECT COUNT(*) as total_orders FROM lats_purchase_orders;
