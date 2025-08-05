import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration - UPDATE THESE WITH YOUR ACTUAL CREDENTIALS
const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

const setupBrandsTable = async () => {
  try {
    console.log('🔧 Setting up brands table...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('create-brands-table-safe.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} had an issue (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }

    console.log('✅ Brands table setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Supabase dashboard to verify the brands table exists');
    console.log('2. Test the brand management in your app');
    console.log('3. Update the Supabase credentials in save-brand-logos-locally.mjs');

  } catch (error) {
    console.error('❌ Error in setup:', error);
  }
};

// Check if credentials are set
if (supabaseUrl === 'https://your-project-ref.supabase.co' || supabaseKey === 'your-anon-key') {
  console.log('❌ Please update the Supabase credentials in this file first!');
  console.log('📝 Update these lines with your actual Supabase project URL and anon key:');
  console.log('   const supabaseUrl = "https://your-project-ref.supabase.co";');
  console.log('   const supabaseKey = "your-anon-key";');
} else {
  setupBrandsTable();
} 