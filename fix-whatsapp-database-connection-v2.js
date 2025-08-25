/**
 * WhatsApp Database Connection Fix - V2
 * This script fixes the database connection issues for the WhatsApp proxy
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = 'https://xqjqjqjqjqjqjqjqjqj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5NzI5NCwiZXhwIjoyMDUwNTczMjk0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp.instanceId', 'whatsapp.apiToken', 'whatsapp.apiUrl'])
      .limit(3);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Found settings:', data.length);
    
    data.forEach(setting => {
      console.log(`   ${setting.key}: ${setting.value.substring(0, 10)}...`);
    });
    
    return data.length > 0;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

async function createEnvironmentFile() {
  console.log('\n📝 Creating environment file...');
  
  const envContent = `# WhatsApp Configuration
GREENAPI_INSTANCE_ID=your_instance_id_here
GREENAPI_API_TOKEN=your_api_token_here
GREENAPI_API_URL=https://api.greenapi.com

# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# Production Settings
APP_ENV=production
`;
  
  const envPaths = [
    '.env',
    'public/.env',
    'hosting-ready/.env'
  ];
  
  for (const envPath of envPaths) {
    try {
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Created ${envPath}`);
    } catch (error) {
      console.log(`⚠️ Could not create ${envPath}:`, error.message);
    }
  }
}

async function updateWhatsAppSettings() {
  console.log('\n🔧 Updating WhatsApp settings in database...');
  
  try {
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp.instanceId', 'whatsapp.apiToken', 'whatsapp.apiUrl']);
    
    if (existingSettings && existingSettings.length > 0) {
      console.log('✅ WhatsApp settings already exist in database');
      existingSettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value.substring(0, 10)}...`);
      });
      return true;
    }
    
    // Insert default settings if they don't exist
    const defaultSettings = [
      { key: 'whatsapp.instanceId', value: 'your_instance_id_here' },
      { key: 'whatsapp.apiToken', value: 'your_api_token_here' },
      { key: 'whatsapp.apiUrl', value: 'https://api.greenapi.com' }
    ];
    
    const { error } = await supabase
      .from('settings')
      .insert(defaultSettings);
    
    if (error) {
      console.error('❌ Failed to insert settings:', error);
      return false;
    }
    
    console.log('✅ Default WhatsApp settings created');
    return true;
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    return false;
  }
}

async function testWhatsAppProxy() {
  console.log('\n🧪 Testing WhatsApp proxy after fixes...');
  
  const testData = {
    action: 'health',
    data: null
  };
  
  try {
    const response = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📡 Response Data:', data);
    
    if (response.ok && data.status === 'healthy') {
      console.log('✅ WhatsApp proxy is working correctly!');
      return true;
    } else {
      console.log('❌ WhatsApp proxy has issues');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 WhatsApp Database Connection Fix - V2\n');
  
  // Step 1: Check database connection
  const dbConnected = await checkDatabaseConnection();
  
  if (!dbConnected) {
    console.log('\n❌ Database connection failed. Please check your Supabase configuration.');
    return;
  }
  
  // Step 2: Create environment file
  await createEnvironmentFile();
  
  // Step 3: Update WhatsApp settings
  await updateWhatsAppSettings();
  
  // Step 4: Test the proxy
  await testWhatsAppProxy();
  
  console.log('\n✅ Fix completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Configure your actual WhatsApp credentials in the database');
  console.log('2. Update the .env file with your real credentials');
  console.log('3. Test the WhatsApp functionality in your application');
}

main().catch(console.error);
