import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('🚀 Adding missing columns to whatsapp_messages table...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241201000051_add_missing_whatsapp_columns.sql');
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
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Try to execute the statement by attempting to insert a test record
          // This is a workaround since we can't execute DDL directly
          console.log('⚠️ Cannot execute DDL directly, please run the migration manually');
          console.log('📝 SQL to run in Supabase dashboard:');
          console.log(statement);
        } catch (err) {
          console.log('⚠️ Statement execution warning:', err.message);
        }
      }
    }
    
    console.log('\n📋 MANUAL MIGRATION REQUIRED:');
    console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(50));
    console.log(migrationSQL);
    console.log('='.repeat(50));
    
    console.log('\n✅ Migration instructions provided!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the migration
addMissingColumns();
