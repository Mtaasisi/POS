#!/usr/bin/env node

// Database Fix Runner for Supabase
// This script runs the essential database fix using the Supabase client

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDatabaseFix() {
  console.log('🔧 Starting essential database fix...');
  
  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'essential-database-fix.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} result:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} failed:`, err.message);
        }
      }
    }
    
    console.log('🎉 Database fix completed!');
    
  } catch (error) {
    console.error('❌ Error running database fix:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Execute key statements directly
async function runDirectFix() {
  console.log('🔧 Running direct database fix...');
  
  try {
    // 1. Create lats_sale_items table
    console.log('📝 Creating lats_sale_items table...');
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS lats_sale_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_id UUID NOT NULL,
          product_id UUID NOT NULL,
          variant_id UUID,
          sku VARCHAR(100),
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(15,2) DEFAULT 0,
          total_price DECIMAL(15,2) DEFAULT 0,
          cost_price DECIMAL(15,2) DEFAULT 0,
          profit DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (itemsError) {
      console.log('⚠️  lats_sale_items table:', itemsError.message);
    } else {
      console.log('✅ lats_sale_items table created');
    }
    
    // 2. Add missing columns to lats_products
    console.log('📝 Adding missing columns to lats_products...');
    const productColumns = [
      'name VARCHAR(255)',
      'description TEXT', 
      'category VARCHAR(100)',
      'brand VARCHAR(100)',
      'status VARCHAR(20) DEFAULT \'active\'',
      'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    ];
    
    for (const column of productColumns) {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS ${column};`
      });
      
      if (error) {
        console.log(`⚠️  Column ${column}:`, error.message);
      } else {
        console.log(`✅ Added column: ${column}`);
      }
    }
    
    // 3. Add missing columns to lats_product_variants
    console.log('📝 Adding missing columns to lats_product_variants...');
    const variantColumns = [
      'name VARCHAR(255)',
      'sku VARCHAR(100)',
      'attributes JSONB',
      'price DECIMAL(15,2) DEFAULT 0',
      'cost_price DECIMAL(15,2) DEFAULT 0',
      'stock_quantity INTEGER DEFAULT 0',
      'status VARCHAR(20) DEFAULT \'active\'',
      'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    ];
    
    for (const column of variantColumns) {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS ${column};`
      });
      
      if (error) {
        console.log(`⚠️  Column ${column}:`, error.message);
      } else {
        console.log(`✅ Added column: ${column}`);
      }
    }
    
    // 4. Enable RLS
    console.log('📝 Enabling RLS...');
    const tables = ['lats_sale_items', 'lats_products', 'lats_product_variants'];
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (error) {
        console.log(`⚠️  RLS for ${table}:`, error.message);
      } else {
        console.log(`✅ RLS enabled for ${table}`);
      }
    }
    
    console.log('🎉 Direct database fix completed!');
    
  } catch (error) {
    console.error('❌ Error in direct fix:', error.message);
  }
}

// Check if we have the exec_sql function, if not use direct approach
async function checkAndRun() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1;' 
    });
    
    if (error) {
      console.log('⚠️  exec_sql function not available, using direct approach...');
      await runDirectFix();
    } else {
      console.log('✅ exec_sql function available, using full script...');
      await runDatabaseFix();
    }
  } catch (err) {
    console.log('⚠️  Using direct approach due to error...');
    await runDirectFix();
  }
}

// Run the fix
checkAndRun();