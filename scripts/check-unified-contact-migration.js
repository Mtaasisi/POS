#!/usr/bin/env node

/**
 * Script to check if the unified contact migration has already been applied
 * This script checks for the existence of the required tables and triggers
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigration() {
  try {
    console.log('🔍 Checking unified contact migration status...\n');
    
    const checks = [
      { name: 'contact_preferences table', query: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'contact_preferences\')' },
      { name: 'contact_history table', query: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'contact_history\')' },
      { name: 'contact_methods table', query: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'contact_methods\')' },
      { name: 'sync_contact_numbers function', query: 'SELECT EXISTS (SELECT FROM information_schema.routines WHERE routine_name = \'sync_contact_numbers\')' },
      { name: 'initialize_contact_preferences function', query: 'SELECT EXISTS (SELECT FROM information_schema.routines WHERE routine_name = \'initialize_contact_preferences\')' },
      { name: 'update_contact_methods function', query: 'SELECT EXISTS (SELECT FROM information_schema.routines WHERE routine_name = \'update_contact_methods\')' },
      { name: 'trigger_sync_contact_numbers trigger', query: 'SELECT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = \'trigger_sync_contact_numbers\')' },
      { name: 'trigger_initialize_contact_preferences trigger', query: 'SELECT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = \'trigger_initialize_contact_preferences\')' },
      { name: 'trigger_update_contact_methods trigger', query: 'SELECT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = \'trigger_update_contact_methods\')' }
    ];
    
    let allPassed = true;
    const results = [];
    
    for (const check of checks) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: check.query });
        
        if (error) {
          // Try alternative approach
          const { data: altData, error: altError } = await supabase
            .from('_dummy')
            .select('*')
            .limit(0);
          
          if (altError && altError.message.includes('exec_sql')) {
            console.log(`⚠️  ${check.name}: Cannot check (exec_sql not available)`);
            results.push({ name: check.name, status: 'unknown', error: 'exec_sql not available' });
            continue;
          } else {
            throw error;
          }
        }
        
        const exists = data && data[0] && data[0].exists;
        const status = exists ? '✅ EXISTS' : '❌ MISSING';
        
        console.log(`${status} ${check.name}`);
        results.push({ name: check.name, status: exists ? 'exists' : 'missing' });
        
        if (!exists) {
          allPassed = false;
        }
        
      } catch (error) {
        console.log(`❌ ERROR ${check.name}: ${error.message}`);
        results.push({ name: check.name, status: 'error', error: error.message });
        allPassed = false;
      }
    }
    
    console.log('\n📊 Summary:');
    const existing = results.filter(r => r.status === 'exists').length;
    const missing = results.filter(r => r.status === 'missing').length;
    const errors = results.filter(r => r.status === 'error').length;
    const unknown = results.filter(r => r.status === 'unknown').length;
    
    console.log(`✅ Existing: ${existing}`);
    console.log(`❌ Missing: ${missing}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log(`❓ Unknown: ${unknown}`);
    
    if (allPassed) {
      console.log('\n🎉 All unified contact system components are present!');
      console.log('The migration has been successfully applied.');
    } else {
      console.log('\n⚠️  Some components are missing or have errors.');
      console.log('You may need to run the migration again or fix the issues.');
      
      if (missing > 0) {
        console.log('\n📋 Missing components:');
        results.filter(r => r.status === 'missing').forEach(r => {
          console.log(`   - ${r.name}`);
        });
      }
      
      if (errors > 0) {
        console.log('\n🚨 Components with errors:');
        results.filter(r => r.status === 'error').forEach(r => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
      }
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Error checking migration:', error);
    return false;
  }
}

// Alternative check using direct table queries
async function checkMigrationAlternative() {
  try {
    console.log('🔍 Checking unified contact migration status (alternative method)...\n');
    
    const checks = [
      { name: 'contact_preferences table', table: 'contact_preferences' },
      { name: 'contact_history table', table: 'contact_history' },
      { name: 'contact_methods table', table: 'contact_methods' }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      try {
        const { data, error } = await supabase
          .from(check.table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ MISSING ${check.name}: ${error.message}`);
          allPassed = false;
        } else {
          console.log(`✅ EXISTS ${check.name}`);
        }
        
      } catch (error) {
        console.log(`❌ ERROR ${check.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    console.log('\n📊 Summary:');
    if (allPassed) {
      console.log('✅ All tables exist!');
      console.log('Note: This method only checks tables, not functions or triggers.');
    } else {
      console.log('❌ Some tables are missing.');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Error checking migration:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking SQL execution capability...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error) {
      console.log('⚠️  exec_sql not available, using alternative method...');
      await checkMigrationAlternative();
    } else {
      await checkMigration();
    }
    
  } catch (error) {
    console.log('⚠️  exec_sql not available, using alternative method...');
    await checkMigrationAlternative();
  }
}

// Run the check
main().catch(console.error);
