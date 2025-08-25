const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWhatsAppTemplatesMigration() {
  console.log('🔧 Applying WhatsApp templates migration...');

  try {
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250125000001_create_whatsapp_templates_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const sqlMigration = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlMigration });

    if (error) {
      console.error('❌ Error applying migration:', error);
      throw error;
    }

    console.log('✅ WhatsApp templates migration applied successfully!');
    console.log('📊 Migration result:', data);

    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('whatsapp_message_templates')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
    } else {
      console.log('✅ WhatsApp templates table verified successfully');
    }

    // Get template count
    const { count, error: countError } = await supabase
      .from('whatsapp_message_templates')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting templates:', countError);
    } else {
      console.log(`📈 Total templates in database: ${count}`);
    }

  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyWhatsAppTemplatesMigration()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
