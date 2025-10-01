-- Fix Purchase Order Foreign Key Relationships
-- This SQL script ensures proper foreign key relationships are established

-- =====================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS lats_purchase_orders 
    DROP CONSTRAINT IF EXISTS lats_purchase_orders_supplier_id_fkey;

-- =====================================================
-- ADD PROPER FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for purchase orders to suppliers
ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT lats_purchase_orders_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES lats_suppliers(id) ON DELETE CASCADE;

-- =====================================================
-- VERIFY CONSTRAINTS
-- =====================================================

-- Check that constraints were created successfully
DO $$
BEGIN
    -- Verify foreign key constraints exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_purchase_orders_supplier_id_fkey'
        AND table_name = 'lats_purchase_orders'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint lats_purchase_orders_supplier_id_fkey was not created';
    END IF;
    
    RAISE NOTICE 'Foreign key constraint lats_purchase_orders_supplier_id_fkey created successfully';
END $$;

-- =====================================================
-- TEST QUERY
-- =====================================================

-- Test that the problematic query now works
SELECT 
    po.id,
    po.order_number,
    po.status,
    s.name as supplier_name,
    s.company_name
FROM lats_purchase_orders po
LEFT JOIN lats_suppliers s ON po.supplier_id = s.id
WHERE po.id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
