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

async function checkWhatsAppInstances() {
  try {
    console.log('🔍 Checking WhatsApp instances table...');
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*');
    
    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
        console.log('❌ Table "whatsapp_instances" does not exist');
        console.log('📋 You need to create the WhatsApp instances table');
        return;
      } else {
        console.log('❌ Error checking table:', error);
        return;
      }
    }
    
    console.log(`📊 Found ${data.length} WhatsApp instances:`);
    data.forEach((instance, index) => {
      console.log(`\n📱 Instance ${index + 1}:`);
      console.log(`   Instance ID: ${instance.instance_id}`);
      console.log(`   Name: ${instance.name}`);
      console.log(`   Status: ${instance.status}`);
      console.log(`   API Token: ${instance.api_token ? 'Set' : 'Not set'}`);
      console.log(`   Green API Host: ${instance.green_api_host || 'Not set'}`);
      console.log(`   Created At: ${instance.created_at}`);
      console.log(`   Updated At: ${instance.updated_at}`);
    });
    
    // Check if instance 7105306911 exists
    const targetInstance = data.find(instance => instance.instance_id === '7105306911');
    if (targetInstance) {
      console.log('\n✅ Target instance 7105306911 found!');
      console.log(`   Name: ${targetInstance.name}`);
      console.log(`   Status: ${targetInstance.status}`);
      console.log(`   Green API Host: ${targetInstance.green_api_host || 'Not set'}`);
    } else {
      console.log('\n❌ Target instance 7105306911 not found');
      console.log('📋 You need to create this instance in the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWhatsAppInstances();
