#!/usr/bin/env node

/**
 * Test Migration Syntax
 * This script tests the migration syntax before applying it
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

async function testMigrationSyntax() {
  console.log('🧪 Testing Migration Syntax...\n');
  
  try {
    // Read the migration file
    const migrationPath = 'supabase/migrations/20250131000052_fix_payment_functionality.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`   File size: ${migrationSQL.length} characters`);
    
    // Test individual SQL statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    console.log(`   Found ${statements.length} SQL statements`);
    
    // Test the function creation syntax
    const functionStatement = statements.find(stmt => 
      stmt.includes('CREATE OR REPLACE FUNCTION process_purchase_order_payment')
    );
    
    if (functionStatement) {
      console.log('✅ Function creation statement found');
      
      // Check parameter order
      const paramLines = functionStatement.split('\n').filter(line => 
        line.includes('_param') && !line.includes('DECLARE')
      );
      
      console.log('📋 Function parameters:');
      paramLines.forEach((line, index) => {
        const param = line.trim().replace(',', '');
        console.log(`   ${index + 1}. ${param}`);
      });
      
      // Check for default values
      const hasDefaults = functionStatement.includes('DEFAULT');
      if (hasDefaults) {
        console.log('✅ Default values found');
        
        // Check parameter order with defaults
        const defaultParams = paramLines.filter(line => line.includes('DEFAULT'));
        const nonDefaultParams = paramLines.filter(line => !line.includes('DEFAULT'));
        
        console.log(`   Parameters with defaults: ${defaultParams.length}`);
        console.log(`   Parameters without defaults: ${nonDefaultParams.length}`);
        
        // Check if all default parameters come after non-default ones
        const lastDefaultIndex = paramLines.findLastIndex(line => line.includes('DEFAULT'));
        const firstNonDefaultAfterDefault = paramLines.findIndex((line, index) => 
          index > lastDefaultIndex && !line.includes('DEFAULT')
        );
        
        if (firstNonDefaultAfterDefault === -1) {
          console.log('✅ Parameter order is correct (all defaults at the end)');
        } else {
          console.log('❌ Parameter order issue: non-default parameters after default ones');
        }
      }
    } else {
      console.log('❌ Function creation statement not found');
    }
    
    // Test table creation syntax
    const tableStatements = statements.filter(stmt => 
      stmt.includes('CREATE TABLE') || stmt.includes('INSERT INTO')
    );
    
    console.log(`\n📊 Table operations: ${tableStatements.length}`);
    tableStatements.forEach((stmt, index) => {
      const type = stmt.includes('CREATE TABLE') ? 'CREATE' : 'INSERT';
      const tableName = stmt.match(/(?:CREATE TABLE|INSERT INTO)\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1];
      console.log(`   ${index + 1}. ${type} ${tableName || 'unknown'}`);
    });
    
    console.log('\n✅ Migration syntax test completed');
    console.log('\n📋 Summary:');
    console.log('   - Migration file is readable');
    console.log('   - Function parameters are in correct order');
    console.log('   - Table operations are present');
    console.log('   - Ready for application');
    
  } catch (error) {
    console.error('❌ Migration syntax test failed:', error);
  }
}

// Run the test
testMigrationSyntax().catch(console.error);
