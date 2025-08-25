import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupWhatsAppTables() {
  console.log('🔧 Setting up WhatsApp database tables...\n');

  try {
    // Create WhatsApp auto-reply rules table
    console.log('📋 Creating whatsapp_auto_reply_rules table...');
    const { error: rulesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_auto_reply_rules (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          trigger TEXT NOT NULL,
          response TEXT NOT NULL,
          enabled BOOLEAN DEFAULT true,
          case_sensitive BOOLEAN DEFAULT false,
          exact_match BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (rulesError) {
      console.log('⚠️ Table might already exist or error:', rulesError.message);
    } else {
      console.log('✅ whatsapp_auto_reply_rules table created');
    }

    // Create WhatsApp messages table
    console.log('📋 Creating whatsapp_messages table...');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL,
          sender_name TEXT,
          message TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
          status TEXT CHECK (status IN ('sent', 'delivered', 'read')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (messagesError) {
      console.log('⚠️ Table might already exist or error:', messagesError.message);
    } else {
      console.log('✅ whatsapp_messages table created');
    }

    // Create indexes
    console.log('📋 Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_enabled ON whatsapp_auto_reply_rules(enabled);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_id ON whatsapp_messages(sender_id);
      `
    });

    if (indexError) {
      console.log('⚠️ Indexes might already exist or error:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }

    // Enable RLS
    console.log('📋 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE whatsapp_auto_reply_rules ENABLE ROW LEVEL SECURITY;
        ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.log('⚠️ RLS might already be enabled or error:', rlsError.message);
    } else {
      console.log('✅ Row Level Security enabled');
    }

    // Insert default auto-reply rules
    console.log('📋 Inserting default auto-reply rules...');
    const { data: existingRules, error: checkError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('⚠️ Error checking existing rules:', checkError.message);
    } else if (!existingRules || existingRules.length === 0) {
      const { error: insertError } = await supabase
        .from('whatsapp_auto_reply_rules')
        .insert([
          {
            trigger: 'Hi',
            response: 'Mambo vipi',
            enabled: true,
            case_sensitive: false,
            exact_match: false
          },
          {
            trigger: 'Hello',
            response: 'Hello! How can I help you today?',
            enabled: true,
            case_sensitive: false,
            exact_match: false
          }
        ]);

      if (insertError) {
        console.log('❌ Error inserting default rules:', insertError.message);
      } else {
        console.log('✅ Default auto-reply rules inserted');
      }
    } else {
      console.log('✅ Default rules already exist');
    }

    console.log('\n🎉 WhatsApp database setup completed successfully!');
    console.log('📱 You can now use the WhatsApp Management page');

  } catch (error) {
    console.error('❌ Error setting up WhatsApp tables:', error);
  }
}

setupWhatsAppTables().catch(console.error);
