import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWhatsAppFix() {
  console.log('🧪 Testing WhatsApp database fix...\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking table structure...');
    const { data: tables, error: tablesError } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.log('❌ WhatsApp tables not accessible:', tablesError.message);
      console.log('💡 Please run the SQL fix from fix-400-errors-comprehensive.sql');
      return;
    }

    console.log('✅ WhatsApp tables are accessible');

    // Test 2: Create a test chat
    console.log('\n📱 Test 2: Creating test chat...');
    const { data: testChat, error: chatError } = await supabase
      .from('whatsapp_chats')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        phone_number: '+1234567890',
        customer_name: 'Test Customer'
      })
      .select()
      .single();

    if (chatError) {
      console.log('❌ Cannot create test chat:', chatError.message);
      return;
    }

    console.log('✅ Test chat created:', testChat.id);

    // Test 3: Insert a test message
    console.log('\n💬 Test 3: Inserting test message...');
    const { data: testMessage, error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        chat_id: testChat.id,
        content: 'Test message from fix verification',
        message_type: 'text',
        direction: 'outbound',
        status: 'sent'
      })
      .select()
      .single();

    if (messageError) {
      console.log('❌ Cannot insert test message:', messageError.message);
      console.log('💡 This indicates the 400 error is still occurring');
      return;
    }

    console.log('✅ Test message inserted:', testMessage.id);

    // Test 4: Query messages
    console.log('\n🔍 Test 4: Querying messages...');
    const { data: messages, error: queryError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', testChat.id);

    if (queryError) {
      console.log('❌ Cannot query messages:', queryError.message);
      return;
    }

    console.log('✅ Messages query successful, found:', messages.length, 'messages');

    // Test 5: Update message status
    console.log('\n📝 Test 5: Updating message status...');
    const { error: updateError } = await supabase
      .from('whatsapp_messages')
      .update({ status: 'delivered' })
      .eq('id', testMessage.id);

    if (updateError) {
      console.log('❌ Cannot update message:', updateError.message);
      return;
    }

    console.log('✅ Message status updated successfully');

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('whatsapp_messages').delete().eq('chat_id', testChat.id);
    await supabase.from('whatsapp_chats').delete().eq('id', testChat.id);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! WhatsApp database is working correctly.');
    console.log('💡 The 400 error should now be resolved.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWhatsAppFix().catch(console.error);
