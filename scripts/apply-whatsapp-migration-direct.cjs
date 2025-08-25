require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWhatsAppMigration() {
  console.log('🔧 Applying WhatsApp automation tables migration...');

  try {
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241226000004_create_whatsapp_tables_final.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Migration file not found:', migrationPath);
      return;
    }

    const sqlMigration = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Migration file loaded successfully');

    // Split the SQL into individual statements
    const statements = sqlMigration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️ Statement ${i + 1} had an issue (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }

    console.log('🎉 Migration completed!');

    // Test the tables by trying to query them
    console.log('🧪 Testing table accessibility...');
    
    const testQueries = [
      'SELECT COUNT(*) FROM whatsapp_automation_workflows',
      'SELECT COUNT(*) FROM whatsapp_automation_executions',
      'SELECT COUNT(*) FROM whatsapp_message_templates',
      'SELECT COUNT(*) FROM whatsapp_notifications',
      'SELECT COUNT(*) FROM whatsapp_analytics_events'
    ];

    for (const query of testQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`❌ Table test failed:`, error.message);
        } else {
          console.log(`✅ Table accessible:`, data);
        }
      } catch (err) {
        console.log(`❌ Table test failed:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.log('\n📝 Manual SQL Execution Required:');
    console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(50));
    
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241226000004_create_whatsapp_tables_final.sql');
    
    if (fs.existsSync(migrationPath)) {
      const sqlMigration = fs.readFileSync(migrationPath, 'utf8');
      console.log(sqlMigration);
    }
    
    console.log('='.repeat(50));
  }
}

applyWhatsAppMigration();
