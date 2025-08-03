#!/usr/bin/env node

// Fix Missing Foreign Key Relationships
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Fixing missing foreign key relationships...');

async function fixForeignKeys() {
  try {
    console.log('⚠️  The issue is missing foreign key relationships');
    console.log('📋 Missing relationships:');
    console.log('- products.category_id -> inventory_categories.id');
    console.log('- products.supplier_id -> suppliers.id');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('📝 Copy and paste this SQL into the SQL editor:');
    console.log('');
    console.log(`
-- Fix missing foreign key relationships
-- This will add the missing foreign key constraints

-- Add foreign key for products.category_id -> inventory_categories.id
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) 
REFERENCES inventory_categories(id) 
ON DELETE SET NULL;

-- Add foreign key for products.supplier_id -> suppliers.id
ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) 
REFERENCES suppliers(id) 
ON DELETE SET NULL;

-- Verify the constraints were added
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
    `);
    
    console.log('');
    console.log('🎯 After running this SQL:');
    console.log('1. The foreign key relationships will be established');
    console.log('2. Your app should work without the 400 Bad Request error');
    console.log('3. The inventory system will be fully functional');
    console.log('');
    console.log('💡 If you get any errors about constraints already existing, that\'s fine - it means they were already added.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixForeignKeys(); 