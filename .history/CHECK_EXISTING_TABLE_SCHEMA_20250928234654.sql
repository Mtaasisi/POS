-- =====================================================
-- CHECK EXISTING TABLE SCHEMA
-- =====================================================
-- This script checks the existing table structure
-- Run this in your Supabase SQL Editor to see the current schema

-- Check if table exists and get its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_order_quality_checks'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'purchase_order_quality_checks';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'purchase_order_quality_checks';
