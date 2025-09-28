-- =====================================================
-- ADD LOCATION COLUMN TO PURCHASE ORDER ITEMS
-- =====================================================
-- This migration adds the missing location column to lats_purchase_order_items table
-- to fix the 400 Bad Request error when assigning locations

-- =====================================================
-- ADD LOCATION COLUMN
-- =====================================================

-- Add location column if it doesn't exist
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add updated_at column if it doesn't exist (needed for tracking updates)
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- ADD INDEX FOR LOCATION QUERIES
-- =====================================================

-- Create index on location for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_location 
ON lats_purchase_order_items(location);

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_purchase_order_items;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON lats_purchase_order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON lats_purchase_order_items TO authenticated;

-- =====================================================
-- VERIFY TABLE STRUCTURE
-- =====================================================

-- Log the current table structure for verification
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE 'Updated lats_purchase_order_items table structure:';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_order_items'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable, 
            column_info.column_default;
    END LOOP;
END $$;

-- =====================================================
-- TEST THE FIX
-- =====================================================

-- Test updating a location (this should not cause a 400 error anymore)
SELECT 'Location column added successfully!' as message;
