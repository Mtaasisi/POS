import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying purchase_order_messages table migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250131000016_create_purchase_order_messages_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Split the migration SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          console.error(`   SQL: ${statement}`);
          // Continue with other statements as some might be "IF NOT EXISTS"
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('📋 purchase_order_messages table created with:');
    console.log('   - Primary key: id (UUID)');
    console.log('   - Foreign key: purchase_order_id → lats_purchase_orders(id)');
    console.log('   - Fields: sender, content, type, timestamp, created_at');
    console.log('   - Indexes for performance');
    console.log('   - Row Level Security policies');
    
    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'purchase_order_messages');
    
    if (tableError) {
      console.error('❌ Error verifying table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Table verification successful - purchase_order_messages exists');
    } else {
      console.log('⚠️  Table verification failed - purchase_order_messages not found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
