#!/usr/bin/env node

/**
 * Diagnostic Database Checker
 * This script checks if all diagnostic-related tables exist in the database
 * and verifies their structure matches the expected schema.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected diagnostic tables and their structures
const expectedTables = {
  'devices': {
    requiredColumns: ['id', 'diagnostic_checklist'],
    description: 'Main devices table with diagnostic_checklist JSONB column'
  },
  'diagnostic_checks': {
    requiredColumns: ['id', 'diagnostic_device_id', 'test_item', 'result', 'remarks', 'image_url', 'created_at', 'updated_at'],
    description: 'Individual diagnostic test results'
  },
  'diagnostic_templates': {
    requiredColumns: ['id', 'device_type', 'checklist_items', 'created_at', 'updated_at'],
    description: 'Diagnostic templates for different device types'
  },
  'diagnostic_checklist_results': {
    requiredColumns: ['id', 'device_id', 'problem_template_id', 'checklist_items', 'overall_status', 'technician_notes', 'completed_by', 'started_at', 'completed_at', 'created_at', 'updated_at'],
    description: 'Completed diagnostic checklist results'
  },
  'diagnostic_problem_templates': {
    requiredColumns: ['id', 'problem_name', 'problem_description', 'category', 'checklist_items', 'is_active', 'created_by', 'created_at', 'updated_at'],
    description: 'Problem-specific diagnostic templates'
  },
  'diagnostic_requests': {
    requiredColumns: ['id', 'title', 'created_by', 'assigned_to', 'notes', 'status', 'created_at', 'updated_at'],
    description: 'Diagnostic request management'
  },
  'diagnostic_devices': {
    requiredColumns: ['id', 'diagnostic_request_id', 'device_name', 'serial_number', 'model', 'notes', 'result_status', 'created_at', 'updated_at'],
    description: 'Devices within diagnostic requests'
  }
};

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error(`❌ Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`❌ Error getting columns for table ${tableName}:`, error.message);
    return [];
  }
}

async function getTableRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error(`❌ Error getting row count for table ${tableName}:`, error.message);
    return -1;
  }
}

async function checkDiagnosticDatabase() {
  console.log('🔍 Checking Diagnostic Database Structure...\n');

  let allTablesExist = true;
  let allStructuresCorrect = true;

  for (const [tableName, expected] of Object.entries(expectedTables)) {
    console.log(`📋 Checking table: ${tableName}`);
    console.log(`   Description: ${expected.description}`);

    // Check if table exists
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      console.log(`   ❌ Table does not exist`);
      allTablesExist = false;
      continue;
    }

    console.log(`   ✅ Table exists`);

    // Get table columns
    const columns = await getTableColumns(tableName);
    const columnNames = columns.map(col => col.column_name);

    // Check required columns
    const missingColumns = expected.requiredColumns.filter(col => !columnNames.includes(col));
    if (missingColumns.length > 0) {
      console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
      allStructuresCorrect = false;
    } else {
      console.log(`   ✅ All required columns present`);
    }

    // Show all columns
    console.log(`   📊 Columns (${columns.length}):`);
    columns.forEach(col => {
      const required = expected.requiredColumns.includes(col.column_name) ? '🔹' : '🔸';
      console.log(`      ${required} ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Get row count
    const rowCount = await getTableRowCount(tableName);
    if (rowCount >= 0) {
      console.log(`   📈 Row count: ${rowCount}`);
    } else {
      console.log(`   ❌ Could not get row count`);
    }

    console.log('');
  }

  // Summary
  console.log('📊 DIAGNOSTIC DATABASE SUMMARY');
  console.log('================================');
  console.log(`Tables exist: ${allTablesExist ? '✅ All' : '❌ Some missing'}`);
  console.log(`Structures correct: ${allStructuresCorrect ? '✅ All' : '❌ Some incorrect'}`);

  if (allTablesExist && allStructuresCorrect) {
    console.log('\n🎉 All diagnostic tables are properly configured!');
  } else {
    console.log('\n⚠️  Some diagnostic tables need attention.');
    console.log('   Run the diagnostic migrations to fix missing tables/columns.');
  }

  // Check for sample data
  console.log('\n🔍 Checking for sample diagnostic data...');
  
  try {
    // Check devices with diagnostic_checklist
    const { data: devicesWithDiagnostics, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, diagnostic_checklist')
      .not('diagnostic_checklist', 'is', null)
      .limit(5);

    if (devicesError) {
      console.log('❌ Error checking devices with diagnostic data:', devicesError.message);
    } else {
      console.log(`📱 Devices with diagnostic_checklist: ${devicesWithDiagnostics?.length || 0}`);
      if (devicesWithDiagnostics && devicesWithDiagnostics.length > 0) {
        console.log('   Sample devices:');
        devicesWithDiagnostics.forEach(device => {
          console.log(`   - ${device.brand} ${device.model} (${device.id})`);
        });
      }
    }

    // Check diagnostic_checks table
    const { data: diagnosticChecks, error: checksError } = await supabase
      .from('diagnostic_checks')
      .select('id, diagnostic_device_id, test_item, result')
      .limit(5);

    if (checksError) {
      console.log('❌ Error checking diagnostic_checks:', checksError.message);
    } else {
      console.log(`🔧 Diagnostic checks records: ${diagnosticChecks?.length || 0}`);
      if (diagnosticChecks && diagnosticChecks.length > 0) {
        console.log('   Sample checks:');
        diagnosticChecks.forEach(check => {
          console.log(`   - ${check.test_item}: ${check.result} (device: ${check.diagnostic_device_id})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Error checking sample data:', error.message);
  }

  console.log('\n✅ Diagnostic database check completed!');
}

// Run the check
checkDiagnosticDatabase().catch(console.error);
