#!/usr/bin/env node

/**
 * Script to apply the unified contact migration
 * This script creates the necessary tables for the unified contact system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function applyMigration() {
  try {
    console.log('🚀 Applying unified contact migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250123000001_create_unified_contact_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('_dummy').select('*').limit(0);
          
          if (directError && directError.message.includes('exec_sql')) {
            console.log('⚠️  exec_sql function not available, trying alternative approach...');
            
            // For now, just log the statement
            console.log('📝 Statement to execute manually:');
            console.log(statement);
            console.log(';');
          } else {
            throw error;
          }
        } else {
          console.log('✅ Statement executed successfully');
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        
        // Continue with next statement
        continue;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify the tables were created in your Supabase dashboard');
    console.log('2. Test the unified contact functionality');
    console.log('3. Update your customer forms to use the new UnifiedContactInput component');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function applyMigrationAlternative() {
  try {
    console.log('🚀 Applying unified contact migration (alternative method)...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250123000001_create_unified_contact_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Execute the entire migration as one statement
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      console.log('\n📝 Please execute the following SQL manually in your Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
    } else {
      console.log('✅ Migration executed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Please execute the following SQL manually in your Supabase SQL Editor:');
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250123000001_create_unified_contact_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n' + migrationSQL);
  }
}

// Check if we can execute SQL directly
async function checkSQLCapability() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    return !error;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking SQL execution capability...');
  
  const canExecuteSQL = await checkSQLCapability();
  
  if (canExecuteSQL) {
    await applyMigration();
  } else {
    console.log('⚠️  Direct SQL execution not available');
    await applyMigrationAlternative();
  }
}

// Run the migration
main().catch(console.error);
