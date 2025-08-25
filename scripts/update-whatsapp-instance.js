import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateWhatsAppInstance() {
  try {
    console.log('🔄 Updating WhatsApp instance with correct Green API host...');
    
    const instanceId = '7105306911';
    const correctApiHost = 'https://7105.api.greenapi.com';
    const apiToken = '48cbc4699b2f441498a968945b34c297d5392883105846ec9e';
    
    // Update the instance
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({
        green_api_host: correctApiHost,
        api_token: apiToken,
        name: 'Instance 7105306911',
        status: 'connected',
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', instanceId)
      .select();
    
    if (error) {
      console.error('❌ Error updating instance:', error);
      return;
    }
    
    console.log('✅ Instance updated successfully!');
    console.log('📋 Updated instance data:');
    console.log(`   Instance ID: ${data[0].instance_id}`);
    console.log(`   Name: ${data[0].name}`);
    console.log(`   Status: ${data[0].status}`);
    console.log(`   Green API Host: ${data[0].green_api_host}`);
    console.log(`   API Token: ${data[0].api_token ? 'Set' : 'Not set'}`);
    console.log(`   Updated At: ${data[0].updated_at}`);
    
    console.log('\n🎉 The WhatsApp instance has been updated with the correct Green API configuration!');
    console.log('📱 You can now test sending messages without 403 errors.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateWhatsAppInstance();
