import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyEnhancedMigration() {
  console.log('🚀 Applying Enhanced WhatsApp Bulk Messaging Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241225000001_fix_enhanced_bulk_messaging_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration file loaded successfully');
    console.log('🔧 Applying migration...\n');

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
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            console.error(`❌ Error executing statement:`, error.message);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
            console.log(`✅ Executed statement successfully`);
          }
        }
      } catch (error) {
        console.error(`❌ Error executing statement:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Verify tables were created in your Supabase dashboard');
      console.log('2. Check that the whatsapp_opt_out column was added to customers table');
      console.log('3. Test the enhanced bulk messaging system');
    } else {
      console.log('\n⚠️ Migration completed with errors. Please check the logs above.');
      console.log('You may need to manually apply some statements.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Manual SQL execution
async function manualMigration() {
  console.log('🔧 Manual Migration Approach\n');
  
  console.log('If the automated migration fails, you can manually run the SQL:');
  console.log('\n1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of:');
  console.log('   supabase/migrations/20241225000001_fix_enhanced_bulk_messaging_tables.sql');
  console.log('4. Execute the SQL');
  console.log('\nThis will create all the necessary tables for the enhanced bulk messaging system.');
}

// Check if exec_sql function exists
async function checkExecSqlFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1;'
    });
    
    if (error) {
      console.log('⚠️ exec_sql function not available, using manual approach');
      await manualMigration();
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('⚠️ exec_sql function not available, using manual approach');
    await manualMigration();
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking database access...\n');
  
  const hasExecSql = await checkExecSqlFunction();
  
  if (hasExecSql) {
    await applyEnhancedMigration();
  }
}

main().catch(console.error);
