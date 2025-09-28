#!/usr/bin/env node

/**
 * Simple Database Connection Check
 * Tests connection to both local and remote Supabase instances
 */

import { createClient } from '@supabase/supabase-js';

// Test configurations
const configs = [
  {
    name: 'Local Supabase',
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  },
  {
    name: 'Remote Supabase (from env)',
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY
  }
];

async function testConnection(config) {
  console.log(`\n🔌 Testing ${config.name}...`);
  console.log(`   URL: ${config.url}`);
  
  if (!config.url || !config.key) {
    console.log('   ❌ Missing URL or key');
    return false;
  }
  
  try {
    const supabase = createClient(config.url, config.key);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('auth_users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Connection successful');
    
    // Test repair parts table
    const { data: repairParts, error: repairPartsError } = await supabase
      .from('repair_parts')
      .select('id')
      .limit(1);
    
    if (repairPartsError) {
      console.log(`   ⚠️  Repair parts table: ${repairPartsError.message}`);
    } else {
      console.log('   ✅ Repair parts table accessible');
    }
    
    // Test spare parts table
    const { data: spareParts, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select('id')
      .limit(1);
    
    if (sparePartsError) {
      console.log(`   ⚠️  Spare parts table: ${sparePartsError.message}`);
    } else {
      console.log('   ✅ Spare parts table accessible');
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Connection Check for Repair Parts');
  console.log('=' .repeat(50));
  
  let anyConnected = false;
  
  for (const config of configs) {
    const connected = await testConnection(config);
    if (connected) {
      anyConnected = true;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (anyConnected) {
    console.log('✅ At least one database connection is working');
    console.log('🔧 Repair parts functionality should be available');
  } else {
    console.log('❌ No database connections are working');
    console.log('⚠️  Repair parts functionality may not work properly');
    console.log('\n💡 To fix this:');
    console.log('   1. Start local Supabase: npx supabase start');
    console.log('   2. Or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  }
}

main().catch(console.error);
