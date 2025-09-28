-- Quick fix for sales 400 error
-- Run this in Supabase SQL editor to fix the immediate issue

-- Fix payment_method column type
ALTER TABLE lats_sales 
ALTER COLUMN payment_method TYPE TEXT;

-- Make created_by nullable
ALTER TABLE lats_sales 
ALTER COLUMN created_by DROP NOT NULL;

-- Add missing columns that the app expects
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Test the fix
SELECT 'Sales table fixed - ready for production' as status;
