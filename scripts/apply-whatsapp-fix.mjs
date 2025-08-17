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

async function applyWhatsAppFix() {
  console.log('🔧 Applying WhatsApp database fix...\n');

  try {
    // Read the comprehensive fix SQL
    const fs = await import('fs/promises');
    const path = await import('path');
    const sqlPath = path.join(process.cwd(), 'fix-400-errors-comprehensive.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Executing comprehensive WhatsApp fix...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.log('⚠️  Direct SQL execution failed, providing manual instructions...');
      console.log('\n📋 Manual Fix Required:');
      console.log('============================================================');
      console.log(sqlContent);
      console.log('============================================================');
      console.log('\n📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Click "Run" to execute');
      console.log('5. Return to the app and refresh');
      return;
    }

    console.log('✅ WhatsApp database fix applied successfully!');
    
    // Test the fix
    console.log('\n🧪 Testing WhatsApp messages insert...');
    const testResult = await testWhatsAppInsert();
    
    if (testResult.success) {
      console.log('✅ WhatsApp messages are working correctly!');
    } else {
      console.log('⚠️  WhatsApp messages still have issues:', testResult.error);
    }

  } catch (error) {
    console.error('❌ Error applying WhatsApp fix:', error);
    console.log('\n📋 Manual Fix Required:');
    console.log('Please run the SQL from fix-400-errors-comprehensive.sql in your Supabase dashboard');
  }
}

async function testWhatsAppInsert() {
  try {
    // First check if we have any chats
    const { data: chats, error: chatsError } = await supabase
      .from('whatsapp_chats')
      .select('id')
      .limit(1);

    if (chatsError) {
      return { success: false, error: `Chats table error: ${chatsError.message}` };
    }

    if (!chats || chats.length === 0) {
      // Create a test chat first
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
        return { success: false, error: `Cannot create test chat: ${chatError.message}` };
      }

      // Now test message insert
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id: testChat.id,
          content: 'Test message',
          message_type: 'text',
          direction: 'outbound',
          status: 'sent'
        });

      if (messageError) {
        return { success: false, error: `Message insert error: ${messageError.message}` };
      }

      return { success: true };
    } else {
      // Test with existing chat
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id: chats[0].id,
          content: 'Test message',
          message_type: 'text',
          direction: 'outbound',
          status: 'sent'
        });

      if (messageError) {
        return { success: false, error: `Message insert error: ${messageError.message}` };
      }

      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the fix
applyWhatsAppFix().catch(console.error);
