#!/usr/bin/env node

/**
 * Apply Device Diagnoses Migration Script
 * This script applies the necessary migrations to create the device_diagnoses table
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
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function applyMigrations() {
  try {
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    console.log('🚀 Starting migration application...');
    
    // Migration 1: Apply diagnostic tables migration
    console.log('\n📋 Step 1: Applying diagnostic tables migration...');
    const diagnosticTablesPath = path.join(__dirname, 'supabase/migrations/20250915111544_create_diagnostic_tables.sql');
    const diagnosticTablesSQL = fs.readFileSync(diagnosticTablesPath, 'utf8');
    
    const { data: diagnosticData, error: diagnosticError } = await supabase.rpc('exec_sql', {
      sql: diagnosticTablesSQL
    });
    
    if (diagnosticError) {
      console.log('⚠️  Diagnostic tables migration error (might already exist):', diagnosticError.message);
    } else {
      console.log('✅ Diagnostic tables migration applied successfully');
    }
    
    // Migration 2: Apply device-related tables migration
    console.log('\n📋 Step 2: Applying device-related tables migration...');
    const deviceRelatedPath = path.join(__dirname, 'supabase/migrations/20250131000057_create_device_related_tables.sql');
    const deviceRelatedSQL = fs.readFileSync(deviceRelatedPath, 'utf8');
    
    const { data: deviceRelatedData, error: deviceRelatedError } = await supabase.rpc('exec_sql', {
      sql: deviceRelatedSQL
    });
    
    if (deviceRelatedError) {
      console.log('⚠️  Device-related tables migration error (might already exist):', deviceRelatedError.message);
    } else {
      console.log('✅ Device-related tables migration applied successfully');
    }
    
    // Migration 3: Apply diagnostic_checks table migration
    console.log('\n📋 Step 3: Applying diagnostic_checks table migration...');
    const diagnosticChecksPath = path.join(__dirname, 'supabase/migrations/20250131000060_fix_diagnostic_checks_foreign_key.sql');
    const diagnosticChecksSQL = fs.readFileSync(diagnosticChecksPath, 'utf8');
    
    const { data: diagnosticChecksData, error: diagnosticChecksError } = await supabase.rpc('exec_sql', {
      sql: diagnosticChecksSQL
    });
    
    if (diagnosticChecksError) {
      console.log('⚠️  Diagnostic checks migration error (might already exist):', diagnosticChecksError.message);
    } else {
      console.log('✅ Diagnostic checks migration applied successfully');
    }
    
    // Migration 4: Apply device_diagnoses table migration
    console.log('\n📋 Step 4: Applying device_diagnoses table migration...');
    const deviceDiagnosesPath = path.join(__dirname, 'supabase/migrations/20250131000064_create_device_diagnoses_table.sql');
    const deviceDiagnosesSQL = fs.readFileSync(deviceDiagnosesPath, 'utf8');
    
    const { data: deviceDiagnosesData, error: deviceDiagnosesError } = await supabase.rpc('exec_sql', {
      sql: deviceDiagnosesSQL
    });
    
    if (deviceDiagnosesError) {
      console.log('❌ Device diagnoses migration error:', deviceDiagnosesError.message);
      throw deviceDiagnosesError;
    } else {
      console.log('✅ Device diagnoses migration applied successfully');
    }
    
    // Verification: Check if tables exist
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'diagnostic_requests',
        'diagnostic_devices', 
        'diagnostic_checks',
        'device_diagnoses',
        'device_remarks',
        'device_transitions',
        'device_ratings'
      ]);
    
    if (tablesError) {
      console.log('⚠️  Could not verify tables:', tablesError.message);
    } else {
      console.log('📊 Found tables:', tables.map(t => t.table_name).join(', '));
      
      const requiredTables = [
        'diagnostic_requests',
        'diagnostic_devices', 
        'diagnostic_checks',
        'device_diagnoses'
      ];
      
      const missingTables = requiredTables.filter(table => 
        !tables.some(t => t.table_name === table)
      );
      
      if (missingTables.length === 0) {
        console.log('✅ All required tables are present!');
      } else {
        console.log('❌ Missing tables:', missingTables.join(', '));
      }
    }
    
    console.log('\n🎉 Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyMigrations();
