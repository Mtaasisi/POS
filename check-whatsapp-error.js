import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWhatsAppInsert() {
  console.log('🔍 Testing WhatsApp messages insert...\n');

  try {
    // First, let's check the table structure
    console.log('📋 Checking whatsapp_messages table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log(`❌ Structure error: ${structureError.message}`);
      console.log('📋 Error details:', structureError);
      return;
    }

    console.log('✅ Table structure accessible');

    // Try to insert a test message
    console.log('\n🧪 Testing message insert...');
    const testMessage = {
      chat_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      content: 'Test message',
      message_type: 'text',
      direction: 'outbound',
      status: 'sent'
    };

    console.log('📤 Attempting insert with data:', testMessage);
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert(testMessage)
      .select();

    if (error) {
      console.log(`❌ Insert error: ${error.message}`);
      console.log('📋 Error details:', error);
      
      // Check if it's a foreign key constraint issue
      if (error.message.includes('foreign key') || error.message.includes('chat_id')) {
        console.log('\n🔍 This appears to be a foreign key constraint issue.');
        console.log('📋 The chat_id must reference an existing record in whatsapp_chats table.');
        
        // Check if we have any chats
        const { data: chats, error: chatsError } = await supabase
          .from('whatsapp_chats')
          .select('id')
          .limit(1);
          
        if (chatsError) {
          console.log(`❌ Cannot check chats: ${chatsError.message}`);
        } else if (chats && chats.length > 0) {
          console.log(`✅ Found ${chats.length} chat(s), trying with real chat_id...`);
          
          const realChatId = chats[0].id;
          const realTestMessage = {
            ...testMessage,
            chat_id: realChatId
          };
          
          const { data: realData, error: realError } = await supabase
            .from('whatsapp_messages')
            .insert(realTestMessage)
            .select();
            
          if (realError) {
            console.log(`❌ Still failing with real chat_id: ${realError.message}`);
          } else {
            console.log('✅ Success with real chat_id!');
            console.log('📋 Inserted data:', realData);
          }
        } else {
          console.log('❌ No chats found in whatsapp_chats table');
        }
      }
    } else {
      console.log('✅ Insert successful!');
      console.log('📋 Inserted data:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testWhatsAppInsert();
