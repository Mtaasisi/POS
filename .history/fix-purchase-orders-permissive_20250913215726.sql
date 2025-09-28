-- More permissive RLS policies for lats_purchase_orders table
-- This should resolve the 400 Bad Request error by being less restrictive

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
DROP POLICY IF EXISTS "Allow all operations on purchase orders" ON lats_purchase_orders;

-- Create permissive policies for lats_purchase_orders
-- Allow all authenticated users to perform all operations
CREATE POLICY "Allow all operations on purchase orders" ON lats_purchase_orders
    FOR ALL USING (
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Alternative: If you want to be more restrictive, use these policies instead:
-- (Comment out the above policy and uncomment these if needed)

-- CREATE POLICY "Users can view purchase orders" ON lats_purchase_orders
--     FOR SELECT USING (true);

-- CREATE POLICY "Users can create purchase orders" ON lats_purchase_orders
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can update purchase orders" ON lats_purchase_orders
--     FOR UPDATE USING (true);

-- CREATE POLICY "Users can delete purchase orders" ON lats_purchase_orders
--     FOR DELETE USING (true);

-- Test the policies
SELECT COUNT(*) as total_orders FROM lats_purchase_orders;
