-- Fix payment_method column type to support JSON data
-- This migration addresses the 400 error when inserting sales with complex payment data

-- Check current column type
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name = 'payment_method';

-- Update payment_method column to TEXT to support JSON data
ALTER TABLE lats_sales 
ALTER COLUMN payment_method TYPE TEXT;

-- Verify the change
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name = 'payment_method';

-- Test insert with complex payment data
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by
) VALUES (
    'TEST-SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NULL,
    500000.00,
    '{"type":"CRDB","details":{"payments":[{"method":"CRDB","amount":500000,"accountId":"1ff7da5b-340c-4d16-b2b6-0c65076c4ab8","timestamp":"2025-09-26T10:06:15.232Z"}],"totalPaid":500000},"amount":500000}',
    'completed',
    NULL
) RETURNING id, sale_number, total_amount, payment_method, created_at;

-- Clean up test data
DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-SALE-%';
