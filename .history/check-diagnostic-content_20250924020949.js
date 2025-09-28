#!/usr/bin/env node

/**
 * Diagnostic Content Checker
 * This script checks the actual content of diagnostic_checklist fields
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

async function checkDiagnosticContent() {
  console.log('🔍 Checking Diagnostic Content Details...\n');
  
  try {
    // Get a few devices with diagnostic_checklist data
    const { data: devices, error } = await supabase
      .from('devices')
      .select('id, brand, model, serial_number, status, diagnostic_checklist')
      .not('diagnostic_checklist', 'is', null)
      .limit(5);

    if (error) {
      console.log(`❌ Error fetching devices: ${error.message}`);
      return;
    }

    console.log(`📱 Checking ${devices?.length || 0} devices with diagnostic data\n`);

    if (!devices || devices.length === 0) {
      console.log('⚠️  No devices with diagnostic data found');
      return;
    }

    devices.forEach((device, index) => {
      console.log(`📋 Device ${index + 1}: ${device.brand} ${device.model}`);
      console.log(`   ID: ${device.id}`);
      console.log(`   Serial: ${device.serial_number || 'N/A'}`);
      console.log(`   Status: ${device.status}`);
      
      // Check the raw diagnostic_checklist content
      console.log(`   🔍 Raw diagnostic_checklist type: ${typeof device.diagnostic_checklist}`);
      console.log(`   🔍 Raw diagnostic_checklist value: ${JSON.stringify(device.diagnostic_checklist, null, 2)}`);
      
      try {
        let diagnosticData;
        
        if (typeof device.diagnostic_checklist === 'string') {
          diagnosticData = JSON.parse(device.diagnostic_checklist);
        } else {
          diagnosticData = device.diagnostic_checklist;
        }

        console.log(`   ✅ Parsed diagnostic data:`);
        console.log(`      Type: ${typeof diagnosticData}`);
        console.log(`      Keys: ${Object.keys(diagnosticData || {}).join(', ')}`);
        
        if (diagnosticData) {
          // Check each property
          Object.entries(diagnosticData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              console.log(`      ${key}: Array with ${value.length} items`);
              if (value.length > 0) {
                console.log(`         First item: ${JSON.stringify(value[0], null, 8)}`);
              }
            } else if (typeof value === 'object' && value !== null) {
              console.log(`      ${key}: Object with keys: ${Object.keys(value).join(', ')}`);
              console.log(`         Value: ${JSON.stringify(value, null, 8)}`);
            } else {
              console.log(`      ${key}: ${typeof value} = ${value}`);
            }
          });
        } else {
          console.log(`      ❌ No diagnostic data found after parsing`);
        }
        
      } catch (parseError) {
        console.log(`   ❌ Error parsing diagnostic data: ${parseError.message}`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

  } catch (error) {
    console.log(`❌ Error checking diagnostic content: ${error.message}`);
  }
}

// Run the check
checkDiagnosticContent().catch(console.error);
