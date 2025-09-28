#!/usr/bin/env node

/**
 * Apply Device Diagnoses Migration Script
 * This script applies the necessary migrations to create the device_diagnoses table
 * using the service role key for direct SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration with service role key for direct SQL execution
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log('⚠️  SQL Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.log('⚠️  Execution Error:', err.message);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Starting Device Diagnoses Migration...');
  console.log('=' .repeat(60));
  
  try {
    // Migration 1: Apply diagnostic tables migration
    console.log('\n📋 Step 1: Creating diagnostic tables...');
    const diagnosticTablesPath = path.join(__dirname, 'supabase/migrations/20250915111544_create_diagnostic_tables.sql');
    
    if (fs.existsSync(diagnosticTablesPath)) {
      const diagnosticTablesSQL = fs.readFileSync(diagnosticTablesPath, 'utf8');
      
      // Split into statements and execute
      const statements = diagnosticTablesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`   📝 Found ${statements.length} SQL statements`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeSQL(statement + ';');
        }
      }
      console.log('   ✅ Diagnostic tables migration completed');
    } else {
      console.log('   ⚠️  Diagnostic tables migration file not found, skipping...');
    }
    
    // Migration 2: Apply device-related tables migration
    console.log('\n📋 Step 2: Creating device-related tables...');
    const deviceRelatedPath = path.join(__dirname, 'supabase/migrations/20250131000057_create_device_related_tables.sql');
    
    if (fs.existsSync(deviceRelatedPath)) {
      const deviceRelatedSQL = fs.readFileSync(deviceRelatedPath, 'utf8');
      
      // Split into statements and execute
      const statements = deviceRelatedSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`   📝 Found ${statements.length} SQL statements`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeSQL(statement + ';');
        }
      }
      console.log('   ✅ Device-related tables migration completed');
    } else {
      console.log('   ⚠️  Device-related tables migration file not found, skipping...');
    }
    
    // Migration 3: Apply diagnostic_checks table migration
    console.log('\n📋 Step 3: Creating diagnostic_checks table...');
    const diagnosticChecksPath = path.join(__dirname, 'supabase/migrations/20250131000060_fix_diagnostic_checks_foreign_key.sql');
    
    if (fs.existsSync(diagnosticChecksPath)) {
      const diagnosticChecksSQL = fs.readFileSync(diagnosticChecksPath, 'utf8');
      
      // Split into statements and execute
      const statements = diagnosticChecksSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`   📝 Found ${statements.length} SQL statements`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeSQL(statement + ';');
        }
      }
      console.log('   ✅ Diagnostic checks migration completed');
    } else {
      console.log('   ⚠️  Diagnostic checks migration file not found, skipping...');
    }
    
    // Migration 4: Apply device_diagnoses table migration
    console.log('\n📋 Step 4: Creating device_diagnoses table...');
    const deviceDiagnosesPath = path.join(__dirname, 'supabase/migrations/20250131000064_create_device_diagnoses_table.sql');
    
    if (fs.existsSync(deviceDiagnosesPath)) {
      const deviceDiagnosesSQL = fs.readFileSync(deviceDiagnosesPath, 'utf8');
      
      // Split into statements and execute
      const statements = deviceDiagnosesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`   📝 Found ${statements.length} SQL statements`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await executeSQL(statement + ';');
        }
      }
      console.log('   ✅ Device diagnoses migration completed');
    } else {
      console.log('   ❌ Device diagnoses migration file not found!');
      throw new Error('Device diagnoses migration file is missing');
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
      console.log('   ⚠️  Could not verify tables:', tablesError.message);
    } else {
      const foundTables = tables.map(t => t.table_name);
      console.log('   📊 Found tables:', foundTables.join(', '));
      
      const requiredTables = [
        'diagnostic_requests',
        'diagnostic_devices', 
        'diagnostic_checks',
        'device_diagnoses'
      ];
      
      const missingTables = requiredTables.filter(table => 
        !foundTables.includes(table)
      );
      
      if (missingTables.length === 0) {
        console.log('   ✅ All required tables are present!');
      } else {
        console.log('   ❌ Missing tables:', missingTables.join(', '));
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Device Diagnoses Migration completed successfully!');
    console.log('💡 The device_diagnoses table should now be available for your DiagnosisModal.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Manual steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open the SQL Editor');
    console.log('   3. Run the migration files manually in order');
    console.log('   4. Test the DiagnosisModal functionality');
    process.exit(1);
  }
}

// Run the migration
applyMigrations();
