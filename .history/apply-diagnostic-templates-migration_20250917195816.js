const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Running diagnostic problem templates migration...');

async function runMigration() {
  try {
    // Read the SQL file
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./create-diagnostic-problem-templates-table.sql', 'utf8');
    
    // Execute the SQL
    console.log('📋 Creating diagnostic_problem_templates table and inserting default data...');
    const { error } = await supabase.rpc('exec', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error running migration:', error);
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      
      // Verify the table was created
      const { data, error: selectError } = await supabase
        .from('diagnostic_problem_templates')
        .select('id, problem_name, category')
        .limit(5);
      
      if (selectError) {
        console.error('❌ Error verifying table:', selectError);
      } else {
        console.log('✅ Table verification successful!');
        console.log('📊 Sample templates:');
        data.forEach(template => {
          console.log(`   - ${template.problem_name} (${template.category})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
