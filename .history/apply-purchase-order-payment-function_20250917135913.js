#!/usr/bin/env node

/**
 * Apply the process_purchase_order_payment function to fix the 404 error
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Test configurations
const configs = [
  {
    name: 'Remote Supabase (from env)',
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY
  },
  {
    name: 'Local Supabase',
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
];

async function applyFunction(config) {
  console.log(`\n🔧 Applying function to ${config.name}...`);
  console.log(`   URL: ${config.url}`);
  
  if (!config.url || !config.key) {
    console.log('   ❌ Missing URL or key');
    return false;
  }
  
  try {
    const supabase = createClient(config.url, config.key);
    
    // Read the SQL file
    const sql = readFileSync('apply-purchase-order-payment-function.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   📝 Executing: ${statement.trim().substring(0, 50)}...`);
        
        // Try to execute as RPC first
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.log(`   ⚠️  RPC failed, trying direct query: ${error.message}`);
            // If RPC fails, try direct execution (this won't work for function creation)
            throw error;
          }
          
          console.log('   ✅ Statement executed successfully');
        } catch (rpcError) {
          console.log(`   ⚠️  Could not execute via RPC: ${rpcError.message}`);
          // Skip function creation if RPC is not available
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('   ⚠️  Function creation requires direct database access');
          }
        }
      }
    }
    
    // Test if the function exists
    console.log('   🧪 Testing function existence...');
    try {
      const { data, error } = await supabase.rpc('process_purchase_order_payment', {
        purchase_order_id_param: '00000000-0000-0000-0000-000000000000',
        payment_account_id_param: '00000000-0000-0000-0000-000000000000',
        amount_param: 0,
        currency_param: 'TZS',
        payment_method_param: 'test',
        payment_method_id_param: '00000000-0000-0000-0000-000000000000',
        user_id_param: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) {
        if (error.message.includes('not found')) {
          console.log('   ✅ Function exists (expected error for test data)');
          return true;
        } else {
          console.log(`   ⚠️  Function test error: ${error.message}`);
        }
      } else {
        console.log('   ✅ Function exists and is callable');
        return true;
      }
    } catch (testError) {
      console.log(`   ⚠️  Function test failed: ${testError.message}`);
    }
    
    return false;
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying process_purchase_order_payment function');
  console.log('=' .repeat(60));
  
  let anyApplied = false;
  
  for (const config of configs) {
    const applied = await applyFunction(config);
    if (applied) {
      anyApplied = true;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (anyApplied) {
    console.log('✅ Function application completed successfully');
    console.log('🔧 Purchase Order Payment functionality should now work');
  } else {
    console.log('❌ Function application failed');
    console.log('⚠️  You may need to apply the function manually via Supabase dashboard');
    console.log('\n💡 To fix this:');
    console.log('   1. Open your Supabase dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Run the contents of apply-purchase-order-payment-function.sql');
  }
}

main().catch(console.error);
