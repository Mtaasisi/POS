import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyWhatsAppTablesMigration() {
  console.log('🚀 Applying WhatsApp tables migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241201000060_create_whatsapp_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Migration file loaded successfully');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.log(`⚠️ Statement ${i + 1} had an issue:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️ Exception in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log('\n🎉 Migration application completed!');
    
    // Verify the tables exist
    console.log('\n🔍 Verifying tables...');
    const tables = [
      'whatsapp_instances',
      'whatsapp_messages',
      'whatsapp_webhooks'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName} verification failed:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error verifying table ${tableName}:`, err.message);
      }
    }

    console.log('\n📋 Manual verification steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Table Editor');
    console.log('3. Verify that the following tables exist:');
    console.log('   - whatsapp_instances');
    console.log('   - whatsapp_messages');
    console.log('   - whatsapp_webhooks');
    console.log('4. Test the WhatsApp functionality in your app');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('\n📋 Alternative: Please apply the migration manually');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/20241201000060_create_whatsapp_tables.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the migration
applyWhatsAppTablesMigration();
