-- Migration: Simplify Order Status to Only 'sent' and 'received'
-- This migration updates the order_status constraint to match the simplified workflow
-- Date: 2025-02-01

-- =====================================================
-- DROP OLD CONSTRAINT AND ADD NEW SIMPLIFIED ONE
-- =====================================================

-- Drop the old constraint on products table order_status
ALTER TABLE lats_products 
DROP CONSTRAINT IF EXISTS lats_products_order_status_check;

-- Add new simplified constraint
ALTER TABLE lats_products 
ADD CONSTRAINT lats_products_order_status_check 
CHECK (order_status IN ('sent', 'received'));

-- =====================================================
-- UPDATE EXISTING DATA TO MATCH NEW CONSTRAINT
-- =====================================================

-- Map old statuses to new simplified ones
UPDATE lats_products 
SET order_status = 
  CASE 
    WHEN order_status IN ('draft', 'confirmed', 'processing', 'shipping', 'shipped') THEN 'sent'
    WHEN order_status IN ('received') THEN 'received'
    WHEN order_status = 'cancelled' THEN NULL  -- Remove cancelled status
    ELSE NULL  -- Handle any unknown statuses
  END
WHERE order_status IS NOT NULL;

-- =====================================================
-- ADD COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON CONSTRAINT lats_products_order_status_check ON lats_products IS 
'Simplified order status: sent (order sent to supplier) or received (items received from supplier)';

-- =====================================================
-- VERIFY PURCHASE ORDERS TABLE HAS CORRECT CONSTRAINT
-- =====================================================

-- Note: The lats_purchase_orders table should already have the correct constraint from 
-- migration 20241201000000_create_lats_schema.sql which defines:
-- CHECK (status IN ('draft', 'sent', 'received', 'cancelled'))
-- 
-- This is acceptable as it includes 'draft' for orders being created and 'cancelled' 
-- for orders that are cancelled. The main workflow uses 'sent' and 'received'.

