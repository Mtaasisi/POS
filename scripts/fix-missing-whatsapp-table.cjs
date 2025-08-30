#!/usr/bin/env node

// Fix Missing WhatsApp Table Script
// This script recreates the missing whatsapp_messages table

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingWhatsAppTable() {
  console.log('🔧 Fixing missing WhatsApp messages table...\n');

  try {
    // Check if table exists
    console.log('📋 Step 1: Checking if whatsapp_messages table exists...');
    const { data: tables, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages'
      );`
    });

    if (checkError) {
      console.warn('⚠️ Warning: Could not check table existence:', checkError.message);
    } else {
      const tableExists = tables?.[0]?.exists;
      console.log(`📊 Table exists: ${tableExists ? 'YES' : 'NO'}`);
      
      if (tableExists) {
        console.log('✅ Table already exists, no action needed.');
        return;
      }
    }

    // Create the whatsapp_messages table
    console.log('\n📋 Step 2: Creating whatsapp_messages table...');
    const createTableSQL = `
      -- Create WhatsApp messages table with unified schema
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id TEXT PRIMARY KEY,
        instance_id TEXT,
        chat_id TEXT,
        sender_id TEXT,
        sender_name TEXT,
        type TEXT CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll')) DEFAULT 'text',
        content TEXT NOT NULL,
        message TEXT,
        direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
        status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      throw new Error(`Failed to create table: ${createError.message}`);
    }

    console.log('✅ Table created successfully');

    // Create indexes
    console.log('\n📋 Step 3: Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_id ON whatsapp_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_id ON whatsapp_messages(instance_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });

    if (indexError) {
      console.warn('⚠️ Warning: Could not create some indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Enable RLS and create policies
    console.log('\n📋 Step 4: Setting up Row Level Security...');
    const rlsSQL = `
      -- Enable Row Level Security
      ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

      -- Create policies for authenticated users
      DROP POLICY IF EXISTS "Users can view messages" ON whatsapp_messages;
      DROP POLICY IF EXISTS "Users can insert messages" ON whatsapp_messages;
      DROP POLICY IF EXISTS "Users can update messages" ON whatsapp_messages;

      CREATE POLICY "Users can view messages" ON whatsapp_messages
        FOR SELECT USING (auth.uid() IS NOT NULL);

      CREATE POLICY "Users can insert messages" ON whatsapp_messages
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      CREATE POLICY "Users can update messages" ON whatsapp_messages
        FOR UPDATE USING (auth.uid() IS NOT NULL);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.warn('⚠️ Warning: Could not set up RLS:', rlsError.message);
    } else {
      console.log('✅ Row Level Security configured successfully');
    }

    // Create update trigger
    console.log('\n📋 Step 5: Creating update trigger...');
    const triggerSQL = `
      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger to automatically update updated_at
      DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at_trigger ON whatsapp_messages;
      CREATE TRIGGER update_whatsapp_messages_updated_at_trigger
          BEFORE UPDATE ON whatsapp_messages
          FOR EACH ROW
          EXECUTE FUNCTION update_whatsapp_messages_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: triggerSQL
    });

    if (triggerError) {
      console.warn('⚠️ Warning: Could not create trigger:', triggerError.message);
    } else {
      console.log('✅ Update trigger created successfully');
    }

    console.log('\n🎉 WhatsApp messages table has been successfully recreated!');
    console.log('\n📊 Table Schema Summary:');
    console.log('- id (TEXT PRIMARY KEY)');
    console.log('- instance_id, chat_id, sender_id, sender_name (TEXT)');
    console.log('- type, content, message, direction, status (TEXT)');
    console.log('- metadata (JSONB)');
    console.log('- timestamp, created_at, updated_at (TIMESTAMP WITH TIME ZONE)');
    console.log('\n✅ Your WhatsApp chat functionality should now work correctly!');

  } catch (error) {
    console.error('❌ Error fixing WhatsApp table:', error);
    process.exit(1);
  }
}

// Run the fix
fixMissingWhatsAppTable();
