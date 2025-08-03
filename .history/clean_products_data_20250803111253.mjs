#!/usr/bin/env node

// Clean Products Data Before Converting to UUID
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧹 Cleaning products data before UUID conversion...');

async function cleanProductsData() {
  try {
    console.log('⚠️  The issue is empty strings in category_id and supplier_id columns');
    console.log('📋 We need to convert empty strings to NULL first');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('📝 Copy and paste this SQL into the SQL editor:');
    console.log('');
    console.log(`
-- Clean products data before converting to UUID
-- This will handle empty strings and invalid UUIDs

-- First, let's see what data we have
SELECT 
    id,
    name,
    category_id,
    supplier_id,
    CASE 
        WHEN category_id = '' THEN 'EMPTY'
        WHEN category_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as category_status,
    CASE 
        WHEN supplier_id = '' THEN 'EMPTY'
        WHEN supplier_id IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as supplier_status
FROM products 
LIMIT 10;

-- Convert empty strings to NULL for category_id
UPDATE products 
SET category_id = NULL 
WHERE category_id = '' OR category_id IS NULL;

-- Convert empty strings to NULL for supplier_id
UPDATE products 
SET supplier_id = NULL 
WHERE supplier_id = '' OR supplier_id IS NULL;

-- Now convert the columns to UUID (NULL values will be preserved)
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

-- Add the foreign key constraints
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

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name IN ('category_id', 'supplier_id');

-- Check foreign key constraints
SELECT 
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

-- Show final data state
SELECT 
    id,
    name,
    category_id,
    supplier_id
FROM products 
LIMIT 5;
    `);
    
    console.log('');
    console.log('🎯 This SQL will:');
    console.log('1. Show you the current data state');
    console.log('2. Convert empty strings to NULL');
    console.log('3. Convert columns to UUID type');
    console.log('4. Add foreign key constraints');
    console.log('5. Verify everything works');
    console.log('');
    console.log('💡 This should fix the "invalid input syntax for type uuid" error!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
cleanProductsData(); 