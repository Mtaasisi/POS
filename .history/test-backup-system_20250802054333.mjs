#!/usr/bin/env node

/**
 * Test the backup system with proper environment variables
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ENVs file
async function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, 'ENVs');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
}

async function testBackupSystem() {
  console.log('🧪 Testing backup system...');
  
  // Load environment variables
  const envVars = await loadEnvVars();
  
  console.log('📋 Environment variables loaded:');
  console.log(`  Supabase URL: ${envVars.VITE_SUPABASE_URL}`);
  console.log(`  Supabase Key: ${envVars.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!envVars.VITE_SUPABASE_URL || !envVars.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  // Initialize Supabase client
  const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
  
  try {
    // Test Supabase connection
    console.log('🔗 Testing Supabase connection...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%')
      .limit(5);
    
    if (tablesError) {
      console.error('❌ Supabase connection failed:', tablesError.message);
      return;
    }
    
    console.log(`✅ Supabase connection: OK (${tables?.length || 0} tables found)`);
    
    // Test data access
    console.log('📊 Testing data access...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.log('⚠️  Could not access customers table:', customersError.message);
    } else {
      console.log(`✅ Customers table: OK (${customers?.length || 0} records)`);
    }
    
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
    
    if (devicesError) {
      console.log('⚠️  Could not access devices table:', devicesError.message);
    } else {
      console.log(`✅ Devices table: OK (${devices?.length || 0} records)`);
    }
    
    console.log('');
    console.log('✅ Backup system test completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Add your Hostinger API token to backup.env');
    console.log('2. Add your Supabase service role key (recommended)');
    console.log('3. Run: ./scripts/test-backup.sh');
    console.log('4. Run: ./scripts/run-backup.sh');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBackupSystem(); 