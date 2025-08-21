-- Migration: 20241201000061_rollback_product_technician_assignment.sql
-- Rollback: Remove technician assignment functionality from products

-- Drop RLS policies for spare parts
DROP POLICY IF EXISTS "Admins and customer-care can manage all spare parts" ON lats_spare_parts;
DROP POLICY IF EXISTS "Technicians can update assigned spare parts" ON lats_spare_parts;
DROP POLICY IF EXISTS "Technicians can view assigned spare parts" ON lats_spare_parts;

-- Drop RLS policies for products
DROP POLICY IF EXISTS "Admins and customer-care can manage all products" ON lats_products;
DROP POLICY IF EXISTS "Technicians can update assigned products" ON lats_products;
DROP POLICY IF EXISTS "Technicians can view assigned products" ON lats_products;

-- Drop indexes
DROP INDEX IF EXISTS idx_lats_spare_parts_assigned_to;
DROP INDEX IF EXISTS idx_lats_products_assigned_to;

-- Drop assigned_to columns
ALTER TABLE lats_spare_parts DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE lats_products DROP COLUMN IF EXISTS assigned_to;
