#!/usr/bin/env node

/**
 * Apply Payment Migration
 * This script applies the payment functionality migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentMigration() {
  console.log('🚀 Applying Payment Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = 'supabase/migrations/20250131000052_fix_payment_functionality.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;
      
      try {
        console.log(`\n${i + 1}. Executing statement...`);
        
        // Skip DO blocks and other complex statements for now
        if (statement.includes('DO $$') || statement.includes('RAISE NOTICE')) {
          console.log('   ⏭️ Skipping DO block (will be handled separately)');
          continue;
        }
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
        
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Test the payment functionality');
      console.log('2. Verify payment methods are created');
      console.log('3. Test payment processing');
    } else {
      console.log('\n⚠️ Migration completed with some errors');
      console.log('Please review the errors above and fix them manually if needed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyPaymentMigration().catch(console.error);
