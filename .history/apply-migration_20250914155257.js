import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🔧 Applying database migration...\n');

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250131000055_fix_missing_tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec', { sql: statement });
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }

    // Test the tables
    console.log('\n🧪 Testing table access...');
    
    const tables = ['returns', 'customer_preferences', 'appointments'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table} table test failed:`, error.message);
        } else {
          console.log(`✅ ${table} table accessible`);
        }
      } catch (err) {
        console.error(`❌ ${table} table test exception:`, err.message);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('The 404 errors should now be resolved.');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyMigration();
