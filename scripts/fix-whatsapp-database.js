/**
 * Fix WhatsApp Database Issues
 * 
 * This script runs the migration to fix the whatsapp_messages table schema
 * and resolves the 400 errors you're experiencing.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWhatsAppDatabase() {
  console.log('🔧 Fixing WhatsApp database issues...\n');

  try {
    // Step 1: Drop the conflicting table
    console.log('📋 Step 1: Dropping conflicting whatsapp_messages table...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS whatsapp_messages CASCADE;'
    });
    
    if (dropError) {
      console.warn('⚠️ Warning: Could not drop table (might not exist):', dropError.message);
    } else {
      console.log('✅ Table dropped successfully');
    }

    // Step 2: Create the unified table
    console.log('\n📋 Step 2: Creating unified whatsapp_messages table...');
    const createTableSQL = `
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

    // Step 3: Create indexes
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

    // Step 4: Enable RLS
    console.log('\n📋 Step 4: Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.warn('⚠️ Warning: Could not enable RLS:', rlsError.message);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Step 5: Create policies
    console.log('\n📋 Step 5: Creating RLS policies...');
    const policiesSQL = `
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

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: policiesSQL
    });

    if (policyError) {
      console.warn('⚠️ Warning: Could not create policies:', policyError.message);
    } else {
      console.log('✅ Policies created successfully');
    }

    // Step 6: Insert sample data
    console.log('\n📋 Step 6: Inserting sample data...');
    const sampleDataSQL = `
      INSERT INTO whatsapp_messages (id, sender_id, sender_name, content, message, direction, status, timestamp)
      VALUES 
        ('msg_001', '255746605561@c.us', 'Test User', 'Hello there!', 'Hello there!', 'incoming', 'read', NOW() - INTERVAL '1 hour'),
        ('msg_002', 'system', 'System', 'Welcome to our service!', 'Welcome to our service!', 'outgoing', 'sent', NOW() - INTERVAL '30 minutes')
      ON CONFLICT (id) DO NOTHING;
    `;

    const { error: sampleError } = await supabase.rpc('exec_sql', {
      sql: sampleDataSQL
    });

    if (sampleError) {
      console.warn('⚠️ Warning: Could not insert sample data:', sampleError.message);
    } else {
      console.log('✅ Sample data inserted successfully');
    }

    // Step 7: Test the table
    console.log('\n📋 Step 7: Testing the table...');
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(5);

    if (testError) {
      throw new Error(`Table test failed: ${testError.message}`);
    }

    console.log('✅ Table test successful');
    console.log(`📊 Found ${testData?.length || 0} messages in the table`);

    console.log('\n🎉 WhatsApp database issues fixed successfully!');
    console.log('📱 You should now be able to use the WhatsApp management features without 400 errors.');

  } catch (error) {
    console.error('❌ Error fixing WhatsApp database:', error);
    process.exit(1);
  }
}

// Run the fix
fixWhatsAppDatabase().then(() => {
  console.log('\n✨ Script completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
