#!/usr/bin/env node

/**
 * Apply Foreign Key Fix for Purchase Orders
 * This script applies the SQL fix to establish proper foreign key relationships
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function applyForeignKeyFix() {
  console.log('🔧 Applying Foreign Key Fix for Purchase Orders...\n');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('./fix-purchase-order-foreign-keys.sql', 'utf8');
    
    console.log('📋 SQL Fix Content:');
    console.log(sqlContent);
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('⚠️  IMPORTANT: This SQL script needs to be executed in your Supabase SQL Editor.');
    console.log('📝 Copy the SQL content above and paste it into your Supabase SQL Editor.');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql');
    console.log('\n📋 Steps:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Paste the SQL content from the file above');
    console.log('4. Click "Run" to execute the fix');
    console.log('5. Test the query again');
    
    // Test the current state
    console.log('\n🧪 Testing current query state...');
    const { data: testData, error: testError } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        supplier:lats_suppliers(id, name, company_name)
      `)
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .single();
    
    if (testError) {
      console.log('❌ Current query fails:', testError.message);
      console.log('✅ This confirms the foreign key relationship needs to be fixed');
    } else {
      console.log('✅ Query already works!', {
        id: testData?.id,
        order_number: testData?.order_number,
        supplier: testData?.supplier
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyForeignKeyFix().catch(console.error);
