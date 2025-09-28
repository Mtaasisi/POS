-- Fix missing id column in lats_purchase_order_items table
-- This migration fixes the critical missing id column that causes "Failed to fetch purchase orders" error

-- =====================================================
-- FIX MISSING ID COLUMN IN PURCHASE ORDER ITEMS
-- =====================================================

-- Check if the id column exists, if not add it
DO $$
BEGIN
    -- Check if id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_order_items' 
        AND column_name = 'id'
    ) THEN
        -- Add the missing id column as primary key
        ALTER TABLE lats_purchase_order_items 
        ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
        
        RAISE NOTICE 'Added missing id column to lats_purchase_order_items table';
    ELSE
        RAISE NOTICE 'id column already exists in lats_purchase_order_items table';
    END IF;
END $$;

-- =====================================================
-- ENSURE PROPER TABLE STRUCTURE
-- =====================================================

-- Make sure the table has all required columns with proper constraints
ALTER TABLE lats_purchase_order_items 
    ALTER COLUMN purchase_order_id SET NOT NULL,
    ALTER COLUMN product_id SET NOT NULL,
    ALTER COLUMN variant_id SET NOT NULL,
    ALTER COLUMN quantity SET NOT NULL,
    ALTER COLUMN cost_price SET NOT NULL,
    ALTER COLUMN total_price SET NOT NULL;

-- Set default values for optional columns
ALTER TABLE lats_purchase_order_items 
    ALTER COLUMN received_quantity SET DEFAULT 0;

-- =====================================================
-- ADD MISSING INDEXES
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id 
    ON lats_purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id 
    ON lats_purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant_id 
    ON lats_purchase_order_items(variant_id);

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
    RAISE NOTICE 'Current lats_purchase_order_items table structure:';
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
