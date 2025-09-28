-- Make created_by field nullable in purchase_order_payments table
-- Migration: 20250131000041_make_created_by_nullable.sql

-- Make the created_by field nullable to avoid foreign key constraint issues
ALTER TABLE purchase_order_payments 
ALTER COLUMN created_by DROP NOT NULL;

-- Add a comment to explain the temporary fix
COMMENT ON COLUMN purchase_order_payments.created_by IS 'Temporarily nullable due to foreign key constraint issues. TODO: Fix foreign key to point to auth_users table.';
