#!/usr/bin/env node

/**
 * WhatsApp Automation Tables Migration Script
 * 
 * This script applies the missing WhatsApp automation tables migration
 * to fix the 404 errors in the WhatsApp Hub.
 * 
 * Usage: node scripts/apply-whatsapp-automation-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting WhatsApp Automation Tables Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241226000001_create_whatsapp_automation_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Applying WhatsApp automation tables migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error executing statement:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error executing statement:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Created tables:');
      console.log('   - whatsapp_automation_workflows');
      console.log('   - whatsapp_automation_executions');
      console.log('   - whatsapp_message_templates');
      console.log('   - whatsapp_notifications');
      console.log('   - whatsapp_analytics_events');
      
      console.log('\n🔧 Next steps:');
      console.log('   1. Refresh your application');
      console.log('   2. The 404 errors should be resolved');
      console.log('   3. WhatsApp Hub automation features will be fully functional');
    } else {
      console.log('\n⚠️  Migration completed with errors. Some features may not work properly.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyMigrationAlternative() {
  console.log('🚀 Starting WhatsApp Automation Tables Migration (Alternative Method)...\n');

  try {
    // Create tables one by one
    const tables = [
      {
        name: 'whatsapp_automation_workflows',
        sql: `
          CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('message_received', 'order_placed', 'customer_registered', 'appointment_scheduled', 'payment_received')),
            conditions JSONB DEFAULT '[]',
            actions JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            priority INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'whatsapp_automation_executions',
        sql: `
          CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            workflow_id UUID REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
            customer_id UUID,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'test')),
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            test_mode BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of tables) {
      console.log(`📋 Creating ${table.name} table...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          console.error(`❌ Error creating ${table.name}:`, error.message);
        } else {
          console.log(`✅ ${table.name} table created successfully`);
        }
      } catch (err) {
        console.error(`❌ Error creating ${table.name}:`, err.message);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n🔧 Next steps:');
    console.log('   1. Refresh your application');
    console.log('   2. The 404 errors should be resolved');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  // Try the main method first, fallback to alternative
  applyMigration().catch(() => {
    console.log('\n🔄 Trying alternative migration method...\n');
    applyMigrationAlternative();
  });
}

module.exports = { applyMigration, applyMigrationAlternative };
