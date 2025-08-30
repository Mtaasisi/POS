import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettingsTable() {
  console.log('🔧 Checking settings table...\n');

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) {
      console.error('❌ Error fetching settings:', error);
      return;
    }

    console.log(`📊 Found ${data.length} settings records:\n`);

    for (const setting of data) {
      console.log(`Setting ID: ${setting.id}`);
      console.log(`Key: ${setting.key || 'N/A'}`);
      console.log(`Value: ${setting.value || 'N/A'}`);
      console.log(`Type: ${setting.type || 'N/A'}`);
      console.log(`Created: ${new Date(setting.created_at).toLocaleString()}`);
      
      // Check if this setting contains WhatsApp data
      const settingStr = JSON.stringify(setting).toLowerCase();
      if (settingStr.includes('whatsapp') || settingStr.includes('green') || settingStr.includes('instance')) {
        console.log('🎯 This setting contains WhatsApp-related data!');
        console.log('📋 Full setting data:', JSON.stringify(setting, null, 2));
      }
      
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkIntegrationsTable() {
  console.log('\n🔗 Checking integrations table...\n');

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*');

    if (error) {
      console.error('❌ Error fetching integrations:', error);
      return;
    }

    console.log(`📊 Found ${data.length} integration records:\n`);

    for (const integration of data) {
      console.log(`Integration ID: ${integration.id}`);
      console.log(`Name: ${integration.name || 'N/A'}`);
      console.log(`Type: ${integration.type || 'N/A'}`);
      console.log(`Status: ${integration.status || 'N/A'}`);
      console.log(`Created: ${new Date(integration.created_at).toLocaleString()}`);
      
      // Check if this integration contains WhatsApp data
      const integrationStr = JSON.stringify(integration).toLowerCase();
      if (integrationStr.includes('whatsapp') || integrationStr.includes('green') || integrationStr.includes('instance')) {
        console.log('🎯 This integration contains WhatsApp-related data!');
        console.log('📋 Full integration data:', JSON.stringify(integration, null, 2));
      }
      
      console.log('---');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkForWhatsAppData() {
  console.log('\n🔍 Searching for WhatsApp data in all tables...\n');

  const tables = ['settings', 'integrations', 'whatsapp_instances'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.log(`❌ Error accessing ${tableName}: ${error.message}`);
        continue;
      }

      console.log(`📋 Table: ${tableName} (${data.length} records)`);
      
      for (const record of data) {
        const recordStr = JSON.stringify(record).toLowerCase();
        if (recordStr.includes('whatsapp') || recordStr.includes('green') || recordStr.includes('instance')) {
          console.log(`   🎯 Found WhatsApp data in ${tableName}:`);
          console.log(`   📊 Record:`, JSON.stringify(record, null, 2));
        }
      }
    } catch (err) {
      console.log(`❌ Error checking ${tableName}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Settings & Integrations Diagnostic Tool\n');
  
  await checkSettingsTable();
  await checkIntegrationsTable();
  await checkForWhatsAppData();
  
  console.log('\n✨ Diagnostic complete!');
  console.log('\n💡 Next steps:');
  console.log('1. If no WhatsApp data is found, you need to create your first instance');
  console.log('2. Go to WhatsApp Hub in your app');
  console.log('3. Click "Add New Instance" and enter your Green API credentials');
  console.log('4. Scan the QR code with WhatsApp to connect');
}

main().catch(console.error);
