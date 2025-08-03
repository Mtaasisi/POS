#!/usr/bin/env node

// Fix Invalid UUID Values in Products Table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Fixing invalid UUID values in products table...');

async function fixInvalidUUIDs() {
  try {
    console.log('⚠️  The issue is invalid UUID values like "1" in category_id and supplier_id');
    console.log('📋 We need to convert these to NULL and then set up proper relationships');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('📝 Copy and paste this SQL into the SQL editor:');
    console.log('');
    console.log(`
-- Fix invalid UUID values in products table
-- This will handle values like "1", "", and other invalid UUIDs

-- First, let's see what we're dealing with
SELECT 
    'BEFORE FIX - INVALID VALUES' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN category_id = '' THEN 1 END) as empty_category_id,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as null_category_id,
    COUNT(CASE WHEN category_id != '' AND category_id IS NOT NULL AND category_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as invalid_category_id,
    COUNT(CASE WHEN supplier_id = '' THEN 1 END) as empty_supplier_id,
    COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as null_supplier_id,
    COUNT(CASE WHEN supplier_id != '' AND supplier_id IS NOT NULL AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as invalid_supplier_id
FROM products;

-- Show examples of invalid values
SELECT 
    'EXAMPLES OF INVALID VALUES' as info,
    id,
    name,
    category_id,
    supplier_id
FROM products 
WHERE (category_id != '' AND category_id IS NOT NULL AND category_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
   OR (supplier_id != '' AND supplier_id IS NOT NULL AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
LIMIT 5;

-- Step 1: Convert all invalid values to NULL
UPDATE products 
SET category_id = NULL 
WHERE category_id = '' 
   OR category_id IS NULL 
   OR category_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE products 
SET supplier_id = NULL 
WHERE supplier_id = '' 
   OR supplier_id IS NULL 
   OR supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Convert columns to UUID type (NULL values will be preserved)
ALTER TABLE products 
ALTER COLUMN category_id TYPE UUID USING 
    CASE 
        WHEN category_id IS NULL THEN NULL
        ELSE category_id::UUID
    END;

ALTER TABLE products 
ALTER COLUMN supplier_id TYPE UUID USING 
    CASE 
        WHEN supplier_id IS NULL THEN NULL
        ELSE supplier_id::UUID
    END;

-- Step 3: Add foreign key constraints
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) 
REFERENCES inventory_categories(id) 
ON DELETE SET NULL;

ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) 
REFERENCES suppliers(id) 
ON DELETE SET NULL;

-- Step 4: Verify the fix
SELECT 
    'AFTER FIX - VERIFICATION' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as null_category_id,
    COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as null_supplier_id
FROM products;

-- Show final data state
SELECT 
    'FINAL DATA STATE' as info,
    id,
    name,
    category_id,
    supplier_id
FROM products 
LIMIT 5;

-- Verify column types
SELECT 
    'COLUMN TYPES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name IN ('category_id', 'supplier_id');

-- Check foreign key constraints
SELECT 
    'FOREIGN KEY CONSTRAINTS' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='products';
    `);
    
    console.log('');
    console.log('🎯 This SQL will:');
    console.log('1. Show you the current invalid values');
    console.log('2. Convert all invalid UUIDs (like "1") to NULL');
    console.log('3. Convert columns to proper UUID type');
    console.log('4. Add foreign key constraints');
    console.log('5. Verify everything is working');
    console.log('');
    console.log('💡 This should completely fix the "invalid input syntax for type uuid" error!');
    console.log('🚀 After this, your app should work without the 400 Bad Request error.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixInvalidUUIDs(); 