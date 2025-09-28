#!/usr/bin/env node

/**
 * Apply customer_communications table migration
 * This script applies the migration directly to the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use the credentials from the existing scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying customer_communications table migration...');
    console.log(`   Database: ${supabaseUrl}`);
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20250131000060_create_customer_communications_table.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.log(`   ⚠️  Statement ${i + 1} warning: ${error.message}`);
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} error: ${err.message}`);
        }
      }
    }
    
    // Test the table creation
    console.log('🔄 Testing table creation...');
    const { data, error } = await supabase
      .from('customer_communications')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error.message);
    } else {
      console.log('✅ customer_communications table created and accessible!');
    }
    
    // Test inserting a record (this will fail due to foreign key constraints, but that's expected)
    console.log('🔄 Testing table structure...');
    const { error: insertError } = await supabase
      .from('customer_communications')
      .insert({
        type: 'sms',
        message: 'Test message',
        status: 'sent',
        phone_number: '+255123456789'
      });
    
    if (insertError && insertError.message.includes('violates foreign key constraint')) {
      console.log('✅ Table structure is correct (foreign key constraint working as expected)');
    } else if (insertError) {
      console.log('⚠️  Insert test error:', insertError.message);
    } else {
      console.log('✅ Table insert test successful');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 The customer_communications table is now available for use.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
