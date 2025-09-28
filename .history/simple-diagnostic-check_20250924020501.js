#!/usr/bin/env node

/**
 * Simple Diagnostic Database Checker
 * Directly queries the diagnostic tables to check their existence and data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envContent = readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message);
    return {};
  }
}

const envVars = loadEnvFile();
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName, description) {
  console.log(`\n📋 Checking table: ${tableName}`);
  console.log(`   Description: ${description}`);
  
  try {
    // Try to query the table with a simple select
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Table does not exist or error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Table exists`);
    console.log(`   📈 Row count: ${count || 0}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error accessing table: ${error.message}`);
    return false;
  }
}

async function checkDiagnosticData() {
  console.log('🔍 Checking Diagnostic Database Tables...\n');

  const tables = [
    { name: 'devices', description: 'Main devices table with diagnostic_checklist JSONB column' },
    { name: 'diagnostic_checks', description: 'Individual diagnostic test results' },
    { name: 'diagnostic_templates', description: 'Diagnostic templates for different device types' },
    { name: 'diagnostic_checklist_results', description: 'Completed diagnostic checklist results' },
    { name: 'diagnostic_problem_templates', description: 'Problem-specific diagnostic templates' },
    { name: 'diagnostic_requests', description: 'Diagnostic request management' },
    { name: 'diagnostic_devices', description: 'Devices within diagnostic requests' }
  ];

  let existingTables = 0;
  let totalTables = tables.length;

  for (const table of tables) {
    const exists = await checkTable(table.name, table.description);
    if (exists) existingTables++;
  }

  // Check for diagnostic data in devices table
  console.log('\n🔍 Checking for diagnostic data in devices table...');
  try {
    const { data: devicesWithDiagnostics, error } = await supabase
      .from('devices')
      .select('id, brand, model, diagnostic_checklist')
      .not('diagnostic_checklist', 'is', null)
      .limit(10);

    if (error) {
      console.log(`❌ Error checking devices: ${error.message}`);
    } else {
      console.log(`📱 Devices with diagnostic_checklist: ${devicesWithDiagnostics?.length || 0}`);
      if (devicesWithDiagnostics && devicesWithDiagnostics.length > 0) {
        console.log('   Sample devices:');
        devicesWithDiagnostics.forEach(device => {
          const hasData = device.diagnostic_checklist ? '✅' : '❌';
          console.log(`   ${hasData} ${device.brand} ${device.model} (${device.id.substring(0, 8)}...)`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error checking devices: ${error.message}`);
  }

  // Check diagnostic_checks table data
  console.log('\n🔍 Checking diagnostic_checks table data...');
  try {
    const { data: diagnosticChecks, error } = await supabase
      .from('diagnostic_checks')
      .select('id, diagnostic_device_id, test_item, result, created_at')
      .limit(10);

    if (error) {
      console.log(`❌ Error checking diagnostic_checks: ${error.message}`);
    } else {
      console.log(`🔧 Diagnostic checks records: ${diagnosticChecks?.length || 0}`);
      if (diagnosticChecks && diagnosticChecks.length > 0) {
        console.log('   Sample checks:');
        diagnosticChecks.forEach(check => {
          console.log(`   - ${check.test_item}: ${check.result} (device: ${check.diagnostic_device_id.substring(0, 8)}...)`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error checking diagnostic_checks: ${error.message}`);
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC DATABASE SUMMARY');
  console.log('================================');
  console.log(`Tables exist: ${existingTables}/${totalTables} (${Math.round(existingTables/totalTables*100)}%)`);
  
  if (existingTables === totalTables) {
    console.log('🎉 All diagnostic tables are properly configured!');
  } else if (existingTables > 0) {
    console.log('⚠️  Some diagnostic tables exist, but not all.');
    console.log('   Run the diagnostic migrations to create missing tables.');
  } else {
    console.log('❌ No diagnostic tables found.');
    console.log('   Run the diagnostic migrations to create all tables.');
  }

  console.log('\n✅ Diagnostic database check completed!');
}

// Run the check
checkDiagnosticData().catch(console.error);
