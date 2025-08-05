import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPOSTables() {
  console.log('🔧 Creating POS tables...\n');

  try {
    // Read the SQL file
    const sqlContent = readFileSync('setup_pos_tables.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\n${i + 1}/${statements.length}: Executing statement...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
      }
    }

    console.log('\n✅ POS Tables Creation Complete!');

  } catch (error) {
    console.error('❌ Error creating POS tables:', error);
  }
}

createPOSTables(); 