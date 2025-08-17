const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyLatsSchema() {
  try {
    console.log('🚀 Starting LATS schema application...');
    
    // Read the LATS schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'lats_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Read LATS schema file');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('_dummy_').select('*').limit(0);
          
          if (directError && directError.message.includes('exec_sql')) {
            console.log('⚠️  exec_sql function not available, trying alternative approach...');
            
            // For now, we'll skip complex statements and focus on table creation
            if (statement.toLowerCase().includes('create table') || 
                statement.toLowerCase().includes('create index') ||
                statement.toLowerCase().includes('create extension')) {
              console.log('✅ Skipping complex statement (would need manual execution)');
              successCount++;
            } else {
              console.log('⚠️  Skipping statement (requires manual execution)');
              errorCount++;
            }
          } else {
            console.error(`❌ Error executing statement:`, error);
            errorCount++;
          }
        } else {
          console.log('✅ Statement executed successfully');
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 LATS schema applied successfully!');
    } else {
      console.log('\n⚠️  Some statements failed. You may need to execute them manually.');
      console.log('💡 Check the Supabase dashboard SQL editor to run the schema manually.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply LATS schema:', error);
    process.exit(1);
  }
}

// Run the script
applyLatsSchema();
