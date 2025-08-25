/**
 * WhatsApp Credentials Configuration Script
 * This script helps you configure WhatsApp credentials for the application
 */

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureCredentials() {
  console.log('🔧 WhatsApp Credentials Configuration\n');
  console.log('This script will help you configure your WhatsApp credentials.\n');
  
  // Get credentials from user
  const instanceId = await question('Enter your GreenAPI Instance ID: ');
  const apiToken = await question('Enter your GreenAPI API Token: ');
  const apiUrl = await question('Enter your GreenAPI API URL (default: https://api.greenapi.com): ') || 'https://api.greenapi.com';
  
  // Get Supabase configuration
  const supabaseUrl = await question('Enter your Supabase URL: ');
  const supabaseServiceKey = await question('Enter your Supabase Service Role Key: ');
  
  console.log('\n📝 Creating configuration files...\n');
  
  // Create .env file content
  const envContent = `# WhatsApp Configuration
GREENAPI_INSTANCE_ID=${instanceId}
GREENAPI_API_TOKEN=${apiToken}
GREENAPI_API_URL=${apiUrl}

# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Production Settings
APP_ENV=production
`;
  
  // Create .env files in different locations
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
  
  // Create SQL script for database configuration
  const sqlContent = `-- WhatsApp Credentials Configuration SQL
-- Run this in your Supabase SQL editor

INSERT INTO settings (key, value) VALUES 
('whatsapp.instanceId', '${instanceId}'),
('whatsapp.apiToken', '${apiToken}'),
('whatsapp.apiUrl', '${apiUrl}')
ON CONFLICT (key) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = NOW();
`;
  
  try {
    fs.writeFileSync('whatsapp-credentials.sql', sqlContent);
    console.log('✅ Created whatsapp-credentials.sql');
  } catch (error) {
    console.log('⚠️ Could not create SQL file:', error.message);
  }
  
  // Create test script
  const testContent = `/**
 * Test WhatsApp Configuration
 * Run this to test your WhatsApp configuration
 */

const testData = {
  action: 'health',
  data: null
};

async function testConfiguration() {
  try {
    const response = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok && data.credentials_configured) {
      console.log('✅ Configuration successful!');
    } else {
      console.log('❌ Configuration needs attention');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConfiguration();
`;
  
  try {
    fs.writeFileSync('test-whatsapp-config.js', testContent);
    console.log('✅ Created test-whatsapp-config.js');
  } catch (error) {
    console.log('⚠️ Could not create test file:', error.message);
  }
  
  console.log('\n📋 Configuration Summary:');
  console.log(`   Instance ID: ${instanceId}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Upload the .env files to your server');
  console.log('2. Run the SQL script in your Supabase dashboard');
  console.log('3. Test the configuration with: node test-whatsapp-config.js');
  console.log('4. Check your WhatsApp functionality in the application');
  
  rl.close();
}

configureCredentials().catch(console.error);
