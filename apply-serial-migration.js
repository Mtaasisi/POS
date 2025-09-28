#!/usr/bin/env node

/**
 * Apply Serial Number Migration
 * Creates the sale_inventory_items table and related structures
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Database configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Serial Number Migration');
  console.log('=' .repeat(50));
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('create-sale-inventory-items-table.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.log(`   ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`   ✅ Success`);
          }
        } catch (err) {
          console.log(`   ⚠️  Warning: ${err.message}`);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Migration completed');
    
    // Test the new table
    console.log('\n🧪 Testing new table...');
    const { data, error } = await supabase
      .from('sale_inventory_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table test failed: ${error.message}`);
    } else {
      console.log('✅ sale_inventory_items table is working');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Apply the migration manually through Supabase dashboard');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the contents of create-sale-inventory-items-table.sql');
  }
}

applyMigration().catch(console.error);
