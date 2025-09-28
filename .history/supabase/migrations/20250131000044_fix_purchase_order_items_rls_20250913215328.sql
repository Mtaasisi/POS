-- Fix purchase order items table RLS and add missing columns
-- Migration: 20250131000044_fix_purchase_order_items_rls.sql

-- Add updated_at column to lats_purchase_order_items table
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_lats_purchase_order_items_updated_at
    BEFORE UPDATE ON lats_purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on lats_purchase_order_items table
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;

-- Create RLS policies for lats_purchase_order_items
-- Users can view purchase order items for their purchase orders
CREATE POLICY "Users can view purchase order items" ON lats_purchase_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can create purchase order items for their purchase orders
CREATE POLICY "Users can create purchase order items" ON lats_purchase_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can update purchase order items for their purchase orders
CREATE POLICY "Users can update purchase order items" ON lats_purchase_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can delete purchase order items for their purchase orders
CREATE POLICY "Users can delete purchase order items" ON lats_purchase_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );
