-- Fix RLS policies for lats_purchase_orders table
-- This will resolve the 400 Bad Request errors

-- Add missing columns that the application expects
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_info JSONB,
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_amount_base_currency DECIMAL(12,2) DEFAULT 0;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can update their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Users can delete their purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Allow all operations on purchase orders" ON lats_purchase_orders;

-- Create permissive policies that allow all authenticated users to perform all operations
CREATE POLICY "Allow all operations on purchase orders" ON lats_purchase_orders
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Test the fix by checking if we can select from the table
SELECT COUNT(*) as total_orders FROM lats_purchase_orders;
