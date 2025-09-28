-- Fix sale totals trigger that overrides discount calculations
-- Migration: 20250131000040_fix_sale_totals_trigger.sql

-- Drop the problematic trigger that overrides total_amount with sum of sale items
-- This trigger was causing total_amount to show subtotal instead of final amount after discount
DROP TRIGGER IF EXISTS update_sale_totals_trigger ON lats_sale_items;

-- Drop the function as well since it's no longer needed
-- The total_amount should be set correctly by the application logic, not by database triggers
DROP FUNCTION IF EXISTS update_sale_totals();

-- Add comment to document the change
COMMENT ON TABLE lats_sales IS 'Sales table - total_amount should reflect final amount after discounts, not sum of items';
