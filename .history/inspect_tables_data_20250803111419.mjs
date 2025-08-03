#!/usr/bin/env node

// Inspect Tables Data to See What Needs Cleaning
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Inspecting tables data to see what needs cleaning...');

async function inspectTablesData() {
  try {
    console.log('📋 Let\'s see what data we have in the tables');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('📝 Copy and paste this SQL into the SQL editor:');
    console.log('');
    console.log(`
-- Inspect tables data to see what needs cleaning

-- 1. Check products table structure and data
SELECT 
    'PRODUCTS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Check sample products data
SELECT 
    'PRODUCTS DATA SAMPLE' as info,
    id,
    name,
    category_id,
    supplier_id,
    CASE 
        WHEN category_id = '' THEN 'EMPTY_STRING'
        WHEN category_id IS NULL THEN 'NULL'
        WHEN category_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'VALID_UUID'
        ELSE 'INVALID_UUID'
    END as category_id_status,
    CASE 
        WHEN supplier_id = '' THEN 'EMPTY_STRING'
        WHEN supplier_id IS NULL THEN 'NULL'
        WHEN supplier_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'VALID_UUID'
        ELSE 'INVALID_UUID'
    END as supplier_id_status
FROM products 
LIMIT 20;

-- 3. Count invalid values
SELECT 
    'INVALID VALUES COUNT' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN category_id = '' THEN 1 END) as empty_category_id,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as null_category_id,
    COUNT(CASE WHEN category_id != '' AND category_id IS NOT NULL AND category_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as invalid_category_id,
    COUNT(CASE WHEN supplier_id = '' THEN 1 END) as empty_supplier_id,
    COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as null_supplier_id,
    COUNT(CASE WHEN supplier_id != '' AND supplier_id IS NOT NULL AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as invalid_supplier_id
FROM products;

-- 4. Show examples of invalid values
SELECT 
    'EXAMPLES OF INVALID VALUES' as info,
    id,
    name,
    category_id,
    supplier_id
FROM products 
WHERE (category_id != '' AND category_id IS NOT NULL AND category_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
   OR (supplier_id != '' AND supplier_id IS NOT NULL AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
LIMIT 10;

-- 5. Check inventory_categories table
SELECT 
    'INVENTORY_CATEGORIES TABLE' as info,
    id,
    name,
    description
FROM inventory_categories 
LIMIT 10;

-- 6. Check suppliers table
SELECT 
    'SUPPLIERS TABLE' as info,
    id,
    name,
    contact_person
FROM suppliers 
LIMIT 10;
    `);
    
    console.log('');
    console.log('🎯 This SQL will show you:');
    console.log('1. Products table structure');
    console.log('2. Sample products data with status');
    console.log('3. Count of invalid/empty values');
    console.log('4. Examples of invalid values');
    console.log('5. Available categories');
    console.log('6. Available suppliers');
    console.log('');
    console.log('💡 Run this first, then share the results with me so I can create the right fix!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the inspection
inspectTablesData(); 