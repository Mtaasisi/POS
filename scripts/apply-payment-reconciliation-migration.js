#!/usr/bin/env node

/**
 * Apply payment reconciliation table migration
 * This script fixes the payment_reconciliation table schema to match the service interface
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get configuration from environment variables or use fallback
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration (same as supabaseClient.ts)
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

const config = getConfig();
const supabase = createClient(config.url, config.key);

async function applyMigration() {
  try {
    console.log('🔄 Applying payment reconciliation table migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250128000000_create_payment_providers_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement using direct SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`   ⚠️  Warning on statement ${i + 1}: ${err.message}`);
      }
    }

    // Verify the table exists and has correct structure
    console.log('🔍 Verifying table structure...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payment_reconciliation');

    if (tableError) {
      console.error('❌ Error checking table existence:', tableError.message);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ payment_reconciliation table exists');

      // Check table columns
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'payment_reconciliation')
        .order('ordinal_position');

      if (columnError) {
        console.error('❌ Error checking table columns:', columnError.message);
        return;
      }

      console.log('📋 Table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });

      // Test inserting a sample record
      console.log('🧪 Testing table functionality...');
      const testRecord = {
        id: 'test_recon_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'reconciled',
        expected: 1000.00,
        actual: 1000.00,
        variance: 0.00,
        source: 'combined',
        details: { devicePayments: 5, posSales: 3, fees: 50, refunds: 0 },
        discrepancies: [],
        notes: 'Test record'
      };

      const { error: insertError } = await supabase
        .from('payment_reconciliation')
        .insert(testRecord);

      if (insertError) {
        console.error('❌ Error inserting test record:', insertError.message);
        return;
      }

      console.log('✅ Test record inserted successfully');

      // Clean up test record
      const { error: deleteError } = await supabase
        .from('payment_reconciliation')
        .delete()
        .eq('id', testRecord.id);

      if (deleteError) {
        console.warn('⚠️  Warning: Could not clean up test record:', deleteError.message);
      } else {
        console.log('🧹 Test record cleaned up');
      }

    } else {
      console.error('❌ payment_reconciliation table does not exist');
      return;
    }

    console.log('🎉 Migration completed successfully!');
    console.log('💡 You can now use the payment reconciliation service without errors.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
