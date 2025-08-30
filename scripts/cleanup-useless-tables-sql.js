import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupUselessTablesSQL() {
  console.log('🧹 Starting Database Cleanup - Removing Useless Tables\n');

  try {
    // Read the SQL script
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'cleanup-useless-tables-direct.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 Executing SQL cleanup script...\n');

    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const statement of statements) {
      if (statement.trim() === '') continue;
      
      try {
        console.log(`🗑️  Executing: ${statement.substring(0, 50)}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try alternative approach - direct query
          console.log(`   ⚠️  RPC failed, trying direct approach...`);
          
          // For DROP statements, we'll try a different approach
          if (statement.toUpperCase().includes('DROP TABLE')) {
            console.log(`   ⚠️  Cannot execute DROP TABLE via client, skipping...`);
            console.log(`   💡 Please run the SQL script manually in Supabase Dashboard`);
            continue;
          }
          
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
          errors.push({ statement: statement.substring(0, 50), error: error.message });
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Unexpected error: ${error.message}`);
        errorCount++;
        errors.push({ statement: statement.substring(0, 50), error: error.message });
      }
    }

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   ✅ Successfully executed: ${successCount} statements`);
    console.log(`   ❌ Failed to execute: ${errorCount} statements`);
    console.log(`   📋 Total processed: ${statements.length} statements`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ statement, error }) => {
        console.log(`   - ${statement}: ${error}`);
      });
    }

    console.log('\n💡 Manual Cleanup Required:');
    console.log('   Since DROP TABLE statements cannot be executed via the client,');
    console.log('   please run the SQL script manually in your Supabase Dashboard:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of: scripts/cleanup-useless-tables-direct.sql');
    console.log('   4. Click "Run" to execute the cleanup');

    console.log('\n🎉 Database cleanup instructions provided!');
    console.log('💾 Your database will be cleaner after manual execution.');

  } catch (error) {
    console.error('❌ Error reading or executing SQL script:', error.message);
  }
}

// Run the cleanup
cleanupUselessTablesSQL().catch(console.error);
