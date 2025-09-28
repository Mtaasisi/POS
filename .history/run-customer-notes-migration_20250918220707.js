const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running customer_notes table migration...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-customer-notes-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error(`Statement: ${statement}`);
          return false;
        }
      }
    }
    
    console.log('✅ All SQL statements executed successfully');
    
    // Test the table by trying to insert a test record
    console.log('🧪 Testing table functionality...');
    
    const testNote = {
      id: '00000000-0000-0000-0000-000000000001',
      customer_id: '00000000-0000-0000-0000-000000000001', // This will fail due to foreign key, but that's expected
      content: 'Test note',
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    };
    
    const { error: testError } = await supabase
      .from('customer_notes')
      .insert(testNote);
    
    if (testError && testError.code === '23503') {
      console.log('✅ Table created successfully (foreign key constraint working as expected)');
    } else if (testError) {
      console.error('❌ Unexpected test error:', testError);
      return false;
    } else {
      console.log('✅ Table created and test insert successful');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting customer_notes table migration...');
  
  const success = await runMigration();
  
  if (success) {
    console.log('🎉 Migration completed successfully!');
    console.log('💡 The customer_notes table is now available and the 400 error should be resolved.');
  } else {
    console.log('💥 Migration failed!');
    process.exit(1);
  }
}

main().catch(console.error);
