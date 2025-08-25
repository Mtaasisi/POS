#!/usr/bin/env node

/**
 * Script to apply subcategories migration
 * This script adds parent_id column and related features to lats_categories table
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

async function applySubcategoriesMigration() {
  console.log('🚀 Applying subcategories migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000003_add_subcategories.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 Subcategories migration applied successfully!');
    console.log('\n📋 Changes applied:');
    console.log('   ✅ Added parent_id column to lats_categories');
    console.log('   ✅ Added is_active column');
    console.log('   ✅ Added sort_order column');
    console.log('   ✅ Added icon column');
    console.log('   ✅ Added metadata column');
    console.log('   ✅ Created index for parent_id');
    console.log('   ✅ Updated unique constraint for name + parent_id');
    console.log('   ✅ Added circular reference prevention trigger');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applySubcategoriesMigration();
