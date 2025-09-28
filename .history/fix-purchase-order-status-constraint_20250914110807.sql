-- Fix purchase order status constraint to include partial_received
-- Run this in your Supabase SQL Editor

-- First, drop the existing check constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add the updated check constraint with all required status values
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft', 
    'sent', 
    'confirmed', 
    'shipped', 
    'partial_received', 
    'received', 
    'cancelled'
));
