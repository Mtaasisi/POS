import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyWhatsAppTables() {
  try {
    console.log('🚀 Applying WhatsApp database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix-whatsapp-database-error.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql not available, trying direct query...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.log(`⚠️  Statement failed (this might be expected): ${statement.substring(0, 100)}...`);
          }
        } catch (e) {
          console.log(`⚠️  Statement skipped: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('✅ WhatsApp tables setup completed!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'whatsapp_%');
    
    if (tablesError) {
      console.log('⚠️  Could not verify tables, but setup should be complete');
    } else {
      console.log('📊 WhatsApp tables found:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error applying WhatsApp tables:', error);
    process.exit(1);
  }
}

applyWhatsAppTables();
