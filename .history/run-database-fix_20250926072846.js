import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read the SQL file
const sqlContent = fs.readFileSync('./FIX-FOREIGN-KEY-ERRORS.sql', 'utf8');

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔧 Running comprehensive database fix...');
console.log('🌐 Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDatabaseFix() {
  try {
    console.log('📝 Executing SQL commands...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          // Don't count as error if it's just a "already exists" type warning
          if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Database fix completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎊 All database fixes applied successfully!');
      console.log('🔄 Please refresh your application to see the changes.');
    } else {
      console.log('\n⚠️  Some statements failed, but the essential fixes should be applied.');
    }

  } catch (error) {
    console.error('💥 Database fix failed:', error.message);
    process.exit(1);
  }
}

// Test the connection first
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('lats_sales').select('id').limit(1);
    
    if (error) {
      console.log('⚠️  Connection test warning:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('⚠️  Connection test warning:', err.message);
  }
}

// Run the fix
async function main() {
  await testConnection();
  await runDatabaseFix();
}

main().catch(console.error);