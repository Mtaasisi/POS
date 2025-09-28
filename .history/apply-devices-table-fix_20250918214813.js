#!/usr/bin/env node

/**
 * Apply devices table fix for missing columns
 * This script adds the missing repair_price column to the devices table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  console.log('❌ Missing required environment variables');
  console.log('   VITE_SUPABASE_URL:', envUrl ? 'SET' : 'MISSING');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', envKey ? 'SET' : 'MISSING');
  process.exit(1);
};

async function applyDevicesTableFix() {
  try {
    console.log('🚀 Starting devices table fix...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-devices-table-missing-columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Read SQL migration file');
    console.log('📝 Applying SQL migration...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        // Use the REST API to execute SQL
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', statement);
          
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          
          // Try alternative approach using rpc
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('exec', {
              sql: statement
            });
            
            if (rpcError) {
              console.log(`   ❌ RPC Error: ${rpcError.message}`);
            } else {
              console.log(`   ✅ Success via RPC`);
            }
          } catch (rpcErr) {
            console.log(`   ❌ RPC Exception: ${rpcErr.message}`);
          }
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    const { data: testData, error: testError } = await supabase
      .from('devices')
      .select('id, repair_price, repair_cost, deposit_amount')
      .limit(1);
      
    if (testError) {
      console.log('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test successful - columns are now accessible');
      if (testData && testData.length > 0) {
        console.log('📊 Sample data:', testData[0]);
      }
    }
    
    console.log('\n🎉 Devices table fix completed!');
    
  } catch (error) {
    console.error('❌ Error applying devices table fix:', error);
    process.exit(1);
  }
}

// Run the fix
applyDevicesTableFix();
