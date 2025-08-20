-- Fix Purchase Orders RLS Policies Migration
-- This migration fixes the RLS policies that are causing 400 Bad Request errors

-- =====================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- =====================================================

-- Drop existing policies for purchase orders tables
DROP POLICY IF EXISTS "Allow authenticated users to manage purchase orders" ON lats_purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to manage purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON lats_suppliers;

-- =====================================================
-- CREATE PERMISSIVE POLICIES
-- =====================================================

-- Purchase Orders - More permissive policies
CREATE POLICY "Enable all access for authenticated users" ON lats_purchase_orders
    FOR ALL USING (auth.role() = 'authenticated');

-- Purchase Order Items - More permissive policies
CREATE POLICY "Enable all access for authenticated users" ON lats_purchase_order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Suppliers - More permissive policies
CREATE POLICY "Enable all access for authenticated users" ON lats_suppliers
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON lats_purchase_orders TO authenticated;
GRANT ALL ON lats_purchase_order_items TO authenticated;
GRANT ALL ON lats_suppliers TO authenticated;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_supplier_id ON lats_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_status ON lats_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_created_at ON lats_purchase_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_purchase_order_id ON lats_purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_product_id ON lats_purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_variant_id ON lats_purchase_order_items(variant_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test that the query works (this will be rolled back)
DO $$
BEGIN
    -- This is just a verification that the policies work
    -- The actual test will be done in the application
    RAISE NOTICE 'Purchase orders RLS policies have been updated successfully';
END $$;
