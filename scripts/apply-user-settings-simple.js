import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUserSettingsTable() {
  try {
    console.log('🔧 Applying user_settings table to database...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'add-user-settings-table.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ SQL file not found:', sqlFile);
      return;
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📄 SQL content loaded');
    console.log('Raw SQL:', sql);

    // Split SQL into individual statements and filter out comments
    const lines = sql.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('--'));
    const filteredSql = filteredLines.join('\n');
    
    const statements = filteredSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    statements.forEach((stmt, i) => {
      console.log(`Statement ${i + 1}:`, stmt.substring(0, 100) + '...');
    });

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.log('Statement:', statement);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, execError);
          console.log('Statement:', statement);
        }
      }
    }

    console.log('🎉 user_settings table setup completed!');

  } catch (error) {
    console.error('❌ Error applying user_settings table:', error);
  }
}

// Run the script
applyUserSettingsTable();
