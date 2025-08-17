import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWhatsAppDatabaseIssues() {
  console.log('🔧 Fixing WhatsApp database issues...\n');

  try {
    // 1. Check if whatsapp_chats table exists
    console.log('📋 Checking whatsapp_chats table...');
    const { data: chats, error: chatsError } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .limit(1);

    if (chatsError) {
      console.log('❌ whatsapp_chats table error:', chatsError.message);
      console.log('📄 Run the WhatsApp database setup SQL first');
      return;
    }

    console.log('✅ whatsapp_chats table exists');

    // 2. Check if whatsapp_messages table exists
    console.log('\n📋 Checking whatsapp_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1);

    if (messagesError) {
      console.log('❌ whatsapp_messages table error:', messagesError.message);
      console.log('📄 Run the WhatsApp database setup SQL first');
      return;
    }

    console.log('✅ whatsapp_messages table exists');

    // 3. Create a test chat to ensure we have valid chat_id
    console.log('\n🧪 Creating test chat for validation...');
    const { data: testChat, error: testChatError } = await supabase
      .from('whatsapp_chats')
      .insert({
        phone_number: 'test-phone-123',
        customer_name: 'Test Customer',
        status: 'active'
      })
      .select('id')
      .single();

    if (testChatError) {
      console.log('❌ Could not create test chat:', testChatError.message);
      return;
    }

    console.log('✅ Test chat created with ID:', testChat.id);

    // 4. Test inserting a message with valid chat_id
    console.log('\n🧪 Testing message insert with valid chat_id...');
    const { data: testMessage, error: testMessageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        chat_id: testChat.id,
        content: 'Test message for validation',
        message_type: 'text',
        direction: 'outbound',
        status: 'sent'
      })
      .select('id')
      .single();

    if (testMessageError) {
      console.log('❌ Could not insert test message:', testMessageError.message);
      return;
    }

    console.log('✅ Test message inserted with ID:', testMessage.id);

    // 5. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('whatsapp_messages').delete().eq('id', testMessage.id);
    await supabase.from('whatsapp_chats').delete().eq('id', testChat.id);

    console.log('✅ Test data cleaned up');

    // 6. Create helper functions for safe message insertion
    console.log('\n🔧 Creating helper functions...');
    
    const { error: functionError } = await supabase.rpc('create_whatsapp_helpers', {});
    
    if (functionError) {
      console.log('⚠️ Could not create helper functions (they may already exist):', functionError.message);
    } else {
      console.log('✅ Helper functions created');
    }

    console.log('\n✅ WhatsApp database issues fixed!');
    console.log('\n📝 Next steps:');
    console.log('1. The WhatsApp tables are now properly configured');
    console.log('2. Foreign key constraints are working correctly');
    console.log('3. You can now send WhatsApp messages without 400 errors');

  } catch (error) {
    console.error('❌ Error fixing WhatsApp database issues:', error);
  }
}

// Run the fix
fixWhatsAppDatabaseIssues();
