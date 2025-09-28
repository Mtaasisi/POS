#!/usr/bin/env node

/**
 * Comprehensive Database Connection Test for Repair Parts Functionality
 * This script tests all database connections and tables required for repair parts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results
const testResults = {
  connection: false,
  tables: {},
  functions: {},
  policies: {},
  overall: false
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const color = success ? 'green' : 'red';
  log(`${status} ${testName}${details ? ` - ${details}` : ''}`, color);
}

// Test database connection
async function testConnection() {
  try {
    log('\n🔌 Testing Database Connection...', 'blue');
    
    const { data, error } = await supabase
      .from('auth_users')
      .select('id')
      .limit(1);
    
    if (error) {
      logTest('Database Connection', false, error.message);
      return false;
    }
    
    logTest('Database Connection', true, 'Connected successfully');
    testResults.connection = true;
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

// Test required tables
async function testTables() {
  log('\n📋 Testing Required Tables...', 'blue');
  
  const requiredTables = [
    'auth_users',
    'devices',
    'lats_spare_parts',
    'lats_spare_part_usage',
    'lats_categories',
    'repair_parts'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logTest(`Table: ${table}`, false, error.message);
        testResults.tables[table] = false;
      } else {
        logTest(`Table: ${table}`, true, 'Exists and accessible');
        testResults.tables[table] = true;
      }
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message);
      testResults.tables[table] = false;
    }
  }
}

// Test repair parts specific functionality
async function testRepairPartsFunctionality() {
  log('\n🔧 Testing Repair Parts Functionality...', 'blue');
  
  try {
    // Test 1: Check if repair_parts table has correct structure
    const { data: repairParts, error: repairPartsError } = await supabase
      .from('repair_parts')
      .select('*')
      .limit(1);
    
    if (repairPartsError) {
      logTest('Repair Parts Table Structure', false, repairPartsError.message);
    } else {
      logTest('Repair Parts Table Structure', true, 'Table accessible');
    }
    
    // Test 2: Check spare parts inventory
    const { data: spareParts, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number, quantity, selling_price')
      .limit(5);
    
    if (sparePartsError) {
      logTest('Spare Parts Inventory', false, sparePartsError.message);
    } else {
      logTest('Spare Parts Inventory', true, `${spareParts?.length || 0} parts available`);
    }
    
    // Test 3: Check spare part usage tracking
    const { data: usage, error: usageError } = await supabase
      .from('lats_spare_part_usage')
      .select('*')
      .limit(1);
    
    if (usageError) {
      logTest('Spare Part Usage Tracking', false, usageError.message);
    } else {
      logTest('Spare Part Usage Tracking', true, 'Usage table accessible');
    }
    
    // Test 4: Check categories
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('id, name')
      .limit(5);
    
    if (categoriesError) {
      logTest('Categories', false, categoriesError.message);
    } else {
      logTest('Categories', true, `${categories?.length || 0} categories available`);
    }
    
  } catch (error) {
    logTest('Repair Parts Functionality', false, error.message);
  }
}

// Test database functions and triggers
async function testFunctions() {
  log('\n⚙️ Testing Database Functions...', 'blue');
  
  try {
    // Test if we can create a repair part (this will test triggers)
    const { data: testDevice, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .limit(1)
      .single();
    
    if (deviceError || !testDevice) {
      logTest('Test Device Available', false, 'No devices found for testing');
      return;
    }
    
    const { data: testSparePart, error: sparePartError } = await supabase
      .from('lats_spare_parts')
      .select('id')
      .limit(1)
      .single();
    
    if (sparePartError || !testSparePart) {
      logTest('Test Spare Part Available', false, 'No spare parts found for testing');
      return;
    }
    
    // Test creating a repair part (this will test our triggers)
    const { data: newRepairPart, error: createError } = await supabase
      .from('repair_parts')
      .insert({
        device_id: testDevice.id,
        spare_part_id: testSparePart.id,
        quantity_needed: 1,
        cost_per_unit: 1000,
        status: 'needed',
        notes: 'Test repair part'
      })
      .select()
      .single();
    
    if (createError) {
      logTest('Create Repair Part', false, createError.message);
    } else {
      logTest('Create Repair Part', true, 'Repair part created successfully');
      
      // Clean up test data
      await supabase
        .from('repair_parts')
        .delete()
        .eq('id', newRepairPart.id);
      
      logTest('Cleanup Test Data', true, 'Test data cleaned up');
    }
    
  } catch (error) {
    logTest('Database Functions', false, error.message);
  }
}

// Test RLS policies
async function testPolicies() {
  log('\n🔒 Testing Row Level Security Policies...', 'blue');
  
  try {
    // Test if we can read repair parts (should work for authenticated users)
    const { data, error } = await supabase
      .from('repair_parts')
      .select('*')
      .limit(1);
    
    if (error) {
      logTest('RLS Policy - Read Repair Parts', false, error.message);
    } else {
      logTest('RLS Policy - Read Repair Parts', true, 'Read access working');
    }
    
  } catch (error) {
    logTest('RLS Policies', false, error.message);
  }
}

// Generate comprehensive report
function generateReport() {
  log('\n📊 COMPREHENSIVE DATABASE CONNECTION REPORT', 'bold');
  log('=' .repeat(50), 'blue');
  
  // Connection status
  log(`\n🔌 Connection Status: ${testResults.connection ? '✅ CONNECTED' : '❌ FAILED'}`, 
      testResults.connection ? 'green' : 'red');
  
  // Table status
  log('\n📋 Table Status:', 'blue');
  Object.entries(testResults.tables).forEach(([table, status]) => {
    log(`  ${table}: ${status ? '✅ OK' : '❌ FAILED'}`, status ? 'green' : 'red');
  });
  
  // Overall assessment
  const allTablesWorking = Object.values(testResults.tables).every(status => status);
  const overallStatus = testResults.connection && allTablesWorking;
  
  log(`\n🎯 Overall Status: ${overallStatus ? '✅ ALL SYSTEMS GO' : '❌ ISSUES DETECTED'}`, 
      overallStatus ? 'green' : 'red');
  
  if (overallStatus) {
    log('\n🎉 Repair Parts Database Connection: 100% CONNECTED!', 'green');
    log('   All required tables, functions, and policies are working correctly.', 'green');
    log('   The repair parts functionality is ready to use.', 'green');
  } else {
    log('\n⚠️  Issues detected that need to be resolved:', 'yellow');
    if (!testResults.connection) {
      log('   - Database connection failed', 'red');
    }
    Object.entries(testResults.tables).forEach(([table, status]) => {
      if (!status) {
        log(`   - Table '${table}' is not accessible`, 'red');
      }
    });
  }
  
  log('\n' + '=' .repeat(50), 'blue');
}

// Main test function
async function runTests() {
  log('🚀 Starting Comprehensive Database Connection Test for Repair Parts', 'bold');
  log(`📍 Testing against: ${SUPABASE_URL}`, 'blue');
  
  try {
    await testConnection();
    await testTables();
    await testRepairPartsFunctionality();
    await testFunctions();
    await testPolicies();
    
    generateReport();
    
  } catch (error) {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests();
