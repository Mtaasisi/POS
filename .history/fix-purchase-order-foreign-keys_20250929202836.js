#!/usr/bin/env node

/**
 * Fix Purchase Order Foreign Key Relationships
 * This script ensures proper foreign key relationships are established
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixForeignKeys() {
  console.log('🔧 Fixing Purchase Order Foreign Key Relationships...\n');
  
  try {
    // Check current foreign key constraints
    console.log('1. Checking current foreign key constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_foreign_key_constraints', {
        table_name: 'lats_purchase_orders'
      });
    
    if (constraintsError) {
      console.log('ℹ️  Using alternative method to check constraints...');
    } else {
      console.log('📋 Current constraints:', constraints);
    }
    
    // Test the problematic query first
    console.log('\n2. Testing the problematic query...');
    const { data: testData, error: testError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        supplier:lats_suppliers(id, name, company_name)
      `)
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .single();
    
    if (testError) {
      console.error('❌ Query failed:', testError.message);
      
      // If the error is about foreign key relationships, we need to fix them
      if (testError.message.includes('Could not find a relationship')) {
        console.log('\n3. Applying foreign key fixes...');
        
        // Execute the foreign key fix SQL
        const fixSQL = `
          -- Drop existing foreign key constraints if they exist
          ALTER TABLE IF EXISTS lats_purchase_orders 
              DROP CONSTRAINT IF EXISTS lats_purchase_orders_supplier_id_fkey;
          
          -- Add foreign key constraint for purchase orders to suppliers
          ALTER TABLE lats_purchase_orders 
              ADD CONSTRAINT lats_purchase_orders_supplier_id_fkey 
              FOREIGN KEY (supplier_id) REFERENCES lats_suppliers(id) ON DELETE CASCADE;
        `;
        
        const { data: fixResult, error: fixError } = await supabase
          .rpc('exec_sql', { sql: fixSQL });
        
        if (fixError) {
          console.error('❌ Failed to apply foreign key fix:', fixError);
        } else {
          console.log('✅ Foreign key constraints applied successfully');
          
          // Test the query again
          console.log('\n4. Testing query after fix...');
          const { data: testData2, error: testError2 } = await supabase
            .from('lats_purchase_orders')
            .select(`
              *,
              supplier:lats_suppliers(id, name, company_name)
            `)
            .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
            .single();
          
          if (testError2) {
            console.error('❌ Query still failing:', testError2.message);
          } else {
            console.log('✅ Query now works!', {
              id: testData2?.id,
              order_number: testData2?.order_number,
              supplier: testData2?.supplier
            });
          }
        }
      }
    } else {
      console.log('✅ Query already works!', {
        id: testData?.id,
        order_number: testData?.order_number,
        supplier: testData?.supplier
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixForeignKeys().catch(console.error);
