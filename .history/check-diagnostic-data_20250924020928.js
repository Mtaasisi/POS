#!/usr/bin/env node

/**
 * Diagnostic Data Checker
 * This script checks if all diagnostic data is properly saved in the database
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevicesDiagnosticData() {
  console.log('🔍 Checking Devices Diagnostic Data...\n');
  
  try {
    // Get all devices with diagnostic_checklist data
    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, brand, model, serial_number, status, diagnostic_checklist, created_at, updated_at')
      .not('diagnostic_checklist', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.log(`❌ Error fetching devices: ${error.message}`);
      return;
    }

    console.log(`📱 Found ${devices?.length || 0} devices with diagnostic data\n`);

    if (!devices || devices.length === 0) {
      console.log('⚠️  No devices with diagnostic data found');
      return;
    }

    // Analyze each device's diagnostic data
    devices.forEach((device, index) => {
      console.log(`📋 Device ${index + 1}: ${device.brand} ${device.model}`);
      console.log(`   ID: ${device.id}`);
      console.log(`   Serial: ${device.serial_number || 'N/A'}`);
      console.log(`   Status: ${device.status}`);
      console.log(`   Updated: ${new Date(device.updated_at).toLocaleString()}`);
      
      try {
        const diagnosticData = typeof device.diagnostic_checklist === 'string' 
          ? JSON.parse(device.diagnostic_checklist) 
          : device.diagnostic_checklist;

        if (diagnosticData) {
          console.log(`   ✅ Diagnostic data structure:`);
          
          // Check for summary data
          if (diagnosticData.summary) {
            const { total, passed, failed, pending, lastUpdated } = diagnosticData.summary;
            console.log(`      📊 Summary: ${total} total, ${passed} passed, ${failed} failed, ${pending} pending`);
            if (lastUpdated) {
              console.log(`      🕒 Last updated: ${new Date(lastUpdated).toLocaleString()}`);
            }
          }

          // Check for items
          if (diagnosticData.items && Array.isArray(diagnosticData.items)) {
            console.log(`      📝 Items: ${diagnosticData.items.length} diagnostic items`);
            diagnosticData.items.forEach((item, itemIndex) => {
              if (itemIndex < 3) { // Show first 3 items
                console.log(`         - ${item.test || item.title || 'Unknown'}: ${item.result || 'N/A'}`);
              }
            });
            if (diagnosticData.items.length > 3) {
              console.log(`         ... and ${diagnosticData.items.length - 3} more items`);
            }
          }

          // Check for overall status
          if (diagnosticData.overallStatus) {
            console.log(`      🎯 Overall Status: ${diagnosticData.overallStatus}`);
          }

          // Check for individual checks
          if (diagnosticData.individualChecks && Array.isArray(diagnosticData.individualChecks)) {
            console.log(`      🔧 Individual Checks: ${diagnosticData.individualChecks.length} records`);
          }

          // Check for notes
          if (diagnosticData.notes) {
            console.log(`      📄 Notes: ${diagnosticData.notes.length} characters`);
          }

          // Check for admin notes
          if (diagnosticData.adminNotes) {
            console.log(`      👨‍💼 Admin Notes: ${diagnosticData.adminNotes.length} characters`);
          }

        } else {
          console.log(`   ❌ No diagnostic data structure found`);
        }
      } catch (parseError) {
        console.log(`   ❌ Error parsing diagnostic data: ${parseError.message}`);
      }
      
      console.log('');
    });

  } catch (error) {
    console.log(`❌ Error checking devices diagnostic data: ${error.message}`);
  }
}

async function checkDiagnosticChecksTable() {
  console.log('🔍 Checking Diagnostic Checks Table...\n');
  
  try {
    const { data: checks, error } = await supabase
      .from('diagnostic_checks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`❌ Error fetching diagnostic checks: ${error.message}`);
      return;
    }

    console.log(`🔧 Found ${checks?.length || 0} diagnostic check records\n`);

    if (!checks || checks.length === 0) {
      console.log('⚠️  No diagnostic check records found in diagnostic_checks table');
      return;
    }

    // Group by device
    const checksByDevice = {};
    checks.forEach(check => {
      if (!checksByDevice[check.diagnostic_device_id]) {
        checksByDevice[check.diagnostic_device_id] = [];
      }
      checksByDevice[check.diagnostic_device_id].push(check);
    });

    Object.entries(checksByDevice).forEach(([deviceId, deviceChecks]) => {
      console.log(`📱 Device: ${deviceId.substring(0, 8)}...`);
      console.log(`   🔧 Checks: ${deviceChecks.length} records`);
      
      const passed = deviceChecks.filter(c => c.result === 'passed').length;
      const failed = deviceChecks.filter(c => c.result === 'failed').length;
      
      console.log(`   ✅ Passed: ${passed}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   🕒 Latest: ${new Date(deviceChecks[0].created_at).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.log(`❌ Error checking diagnostic checks: ${error.message}`);
  }
}

async function checkDiagnosticTemplates() {
  console.log('🔍 Checking Diagnostic Templates...\n');
  
  try {
    const { data: templates, error } = await supabase
      .from('diagnostic_templates')
      .select('*')
      .order('device_type');

    if (error) {
      console.log(`❌ Error fetching templates: ${error.message}`);
      return;
    }

    console.log(`📋 Found ${templates?.length || 0} diagnostic templates\n`);

    if (!templates || templates.length === 0) {
      console.log('⚠️  No diagnostic templates found');
      return;
    }

    templates.forEach((template, index) => {
      console.log(`📋 Template ${index + 1}: ${template.device_type}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Items: ${template.checklist_items?.length || 0} checklist items`);
      console.log(`   Created: ${new Date(template.created_at).toLocaleString()}`);
      
      if (template.checklist_items && Array.isArray(template.checklist_items)) {
        console.log(`   📝 Sample items:`);
        template.checklist_items.slice(0, 3).forEach((item, itemIndex) => {
          console.log(`      - ${item.title || item.test || 'Unknown'}: ${item.description || 'No description'}`);
        });
        if (template.checklist_items.length > 3) {
          console.log(`      ... and ${template.checklist_items.length - 3} more items`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.log(`❌ Error checking templates: ${error.message}`);
  }
}

async function checkDiagnosticChecklistResults() {
  console.log('🔍 Checking Diagnostic Checklist Results...\n');
  
  try {
    const { data: results, error } = await supabase
      .from('diagnostic_checklist_results')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.log(`❌ Error fetching checklist results: ${error.message}`);
      return;
    }

    console.log(`📊 Found ${results?.length || 0} diagnostic checklist results\n`);

    if (!results || results.length === 0) {
      console.log('⚠️  No diagnostic checklist results found');
      return;
    }

    results.forEach((result, index) => {
      console.log(`📊 Result ${index + 1}:`);
      console.log(`   Device ID: ${result.device_id}`);
      console.log(`   Status: ${result.overall_status}`);
      console.log(`   Items: ${result.checklist_items?.length || 0} checklist items`);
      console.log(`   Completed: ${result.completed_at ? new Date(result.completed_at).toLocaleString() : 'Not completed'}`);
      console.log(`   By: ${result.completed_by || 'Unknown'}`);
      if (result.technician_notes) {
        console.log(`   Notes: ${result.technician_notes.substring(0, 100)}${result.technician_notes.length > 100 ? '...' : ''}`);
      }
      console.log('');
    });

  } catch (error) {
    console.log(`❌ Error checking checklist results: ${error.message}`);
  }
}

async function checkAllDiagnosticData() {
  console.log('🔍 COMPREHENSIVE DIAGNOSTIC DATA CHECK\n');
  console.log('=====================================\n');

  await checkDevicesDiagnosticData();
  await checkDiagnosticChecksTable();
  await checkDiagnosticTemplates();
  await checkDiagnosticChecklistResults();

  console.log('✅ Diagnostic data check completed!');
}

// Run the comprehensive check
checkAllDiagnosticData().catch(console.error);
