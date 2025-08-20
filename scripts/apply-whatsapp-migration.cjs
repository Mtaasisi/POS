const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyWhatsAppMigration() {
  console.log('🚀 Applying WhatsApp tables migration...');

  try {
    // Check if whatsapp_chats table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'whatsapp_chats');

    if (checkError) {
      console.log('ℹ️  Could not check existing table, proceeding with creation...');
    } else if (existingTable && existingTable.length > 0) {
      console.log('✅ whatsapp_chats table already exists');
      return;
    }

    // Create whatsapp_chats table
    const { error: createChatsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_chats (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id UUID REFERENCES lats_customers(id) ON DELETE CASCADE,
          phone_number TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createChatsError) {
      console.error('❌ Error creating whatsapp_chats table:', createChatsError);
      return;
    }

    // Create whatsapp_messages table
    const { error: createMessagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
          message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location')),
          content TEXT,
          media_url TEXT,
          direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createMessagesError) {
      console.error('❌ Error creating whatsapp_messages table:', createMessagesError);
      return;
    }

    // Create whatsapp_templates table
    const { error: createTemplatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          variables JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTemplatesError) {
      console.error('❌ Error creating whatsapp_templates table:', createTemplatesError);
      return;
    }

    // Create indexes
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_customer_id ON whatsapp_chats(customer_id);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone_number ON whatsapp_chats(phone_number);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_status ON whatsapp_chats(status);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_updated_at ON whatsapp_chats(updated_at);
        
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
        
        CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_is_active ON whatsapp_templates(is_active);
      `
    });

    if (indexesError) {
      console.error('❌ Error creating indexes:', indexesError);
      return;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
        ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }

    // Create RLS policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_chats" ON whatsapp_chats;
        CREATE POLICY "Enable all operations for authenticated users on whatsapp_chats" 
        ON whatsapp_chats FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_messages" ON whatsapp_messages;
        CREATE POLICY "Enable all operations for authenticated users on whatsapp_messages" 
        ON whatsapp_messages FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_templates" ON whatsapp_templates;
        CREATE POLICY "Enable all operations for authenticated users on whatsapp_templates" 
        ON whatsapp_templates FOR ALL USING (auth.role() = 'authenticated');
      `
    });

    if (policiesError) {
      console.error('❌ Error creating RLS policies:', policiesError);
      return;
    }

    console.log('✅ WhatsApp tables migration completed successfully!');

    // Verify the tables were created
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['whatsapp_chats', 'whatsapp_messages', 'whatsapp_templates']);

    if (verifyError) {
      console.error('❌ Error verifying tables:', verifyError);
    } else {
      console.log('📋 Created tables:', tables.map(t => t.table_name));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyWhatsAppMigration();
