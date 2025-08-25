#!/usr/bin/env node

/**
 * WhatsApp 400 Error Fix - Credentials Setup
 * 
 * This script helps fix the 400 Bad Request error by:
 * 1. Checking current WhatsApp credentials status
 * 2. Providing instructions for setting up Green API credentials
 * 3. Updating the database with proper credentials
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentCredentials() {
  console.log('🔍 Checking current WhatsApp credentials...\n');
  
  try {
    // Check database settings
    const { data: dbSettings, error: dbError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp.instanceId', 'whatsapp.apiToken', 'whatsapp.apiUrl']);
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }
    
    console.log('📊 Database Settings:');
    dbSettings.forEach(setting => {
      const isPlaceholder = setting.value.includes('your_') || setting.value.includes('here');
      const status = isPlaceholder ? '❌ Placeholder' : '✅ Configured';
      console.log(`  ${setting.key}: ${setting.value} ${status}`);
    });
    
    // Check .env file
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      console.log('\n📄 .env File Settings:');
      const envSettings = {
        'GREENAPI_INSTANCE_ID': '',
        'GREENAPI_API_TOKEN': '',
        'GREENAPI_API_URL': ''
      };
      
      envLines.forEach(line => {
        const match = line.match(/^(GREENAPI_\w+)=(.*)$/);
        if (match) {
          envSettings[match[1]] = match[2];
        }
      });
      
      Object.entries(envSettings).forEach(([key, value]) => {
        const isPlaceholder = value.includes('your_') || value.includes('here');
        const status = isPlaceholder ? '❌ Placeholder' : '✅ Configured';
        console.log(`  ${key}: ${value} ${status}`);
      });
    } else {
      console.log('\n❌ .env file not found');
    }
    
    // Check if any credentials are properly configured
    const hasValidCredentials = dbSettings.some(setting => 
      !setting.value.includes('your_') && !setting.value.includes('here') && setting.value.trim() !== ''
    );
    
    if (!hasValidCredentials) {
      console.log('\n❌ No valid WhatsApp credentials found!');
      console.log('\n📋 To fix this issue, you need to:');
      console.log('1. Sign up for Green API at https://console.green-api.com');
      console.log('2. Create a WhatsApp instance');
      console.log('3. Get your Instance ID and API Token');
      console.log('4. Update the credentials in the database or .env file');
      
      console.log('\n🔧 Would you like to:');
      console.log('a) Update credentials in database (recommended)');
      console.log('b) Update credentials in .env file');
      console.log('c) Test the WhatsApp proxy with current settings');
      console.log('d) Exit');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nEnter your choice (a/b/c/d): ', async (choice) => {
        switch (choice.toLowerCase()) {
          case 'a':
            await updateDatabaseCredentials(rl);
            break;
          case 'b':
            await updateEnvCredentials(rl);
            break;
          case 'c':
            await testWhatsAppProxy();
            break;
          case 'd':
            console.log('👋 Goodbye!');
            rl.close();
            break;
          default:
            console.log('❌ Invalid choice');
            rl.close();
        }
      });
    } else {
      console.log('\n✅ Valid credentials found!');
      await testWhatsAppProxy();
    }
    
  } catch (error) {
    console.error('❌ Error checking credentials:', error);
  }
}

async function updateDatabaseCredentials(rl) {
  console.log('\n📝 Updating database credentials...');
  
  rl.question('Enter your Green API Instance ID: ', async (instanceId) => {
    rl.question('Enter your Green API Token: ', async (apiToken) => {
      rl.question('Enter your Green API URL (default: https://api.greenapi.com): ', async (apiUrl) => {
        const finalApiUrl = apiUrl || 'https://api.greenapi.com';
        
        try {
          // Update settings in database
          const updates = [
            { key: 'whatsapp.instanceId', value: instanceId },
            { key: 'whatsapp.apiToken', value: apiToken },
            { key: 'whatsapp.apiUrl', value: finalApiUrl }
          ];
          
          for (const update of updates) {
            const { error } = await supabase
              .from('settings')
              .upsert({ key: update.key, value: update.value });
            
            if (error) {
              console.error(`❌ Error updating ${update.key}:`, error);
            } else {
              console.log(`✅ Updated ${update.key}`);
            }
          }
          
          console.log('\n✅ Database credentials updated successfully!');
          await testWhatsAppProxy();
          
        } catch (error) {
          console.error('❌ Error updating database:', error);
        } finally {
          rl.close();
        }
      });
    });
  });
}

async function updateEnvCredentials(rl) {
  console.log('\n📝 Updating .env file credentials...');
  
  rl.question('Enter your Green API Instance ID: ', async (instanceId) => {
    rl.question('Enter your Green API Token: ', async (apiToken) => {
      rl.question('Enter your Green API URL (default: https://api.greenapi.com): ', async (apiUrl) => {
        const finalApiUrl = apiUrl || 'https://api.greenapi.com';
        
        try {
          const envPath = path.join(process.cwd(), '.env');
          let envContent = fs.readFileSync(envPath, 'utf8');
          
          // Update the environment variables
          envContent = envContent.replace(
            /GREENAPI_INSTANCE_ID=.*/,
            `GREENAPI_INSTANCE_ID=${instanceId}`
          );
          envContent = envContent.replace(
            /GREENAPI_API_TOKEN=.*/,
            `GREENAPI_API_TOKEN=${apiToken}`
          );
          envContent = envContent.replace(
            /GREENAPI_API_URL=.*/,
            `GREENAPI_API_URL=${finalApiUrl}`
          );
          
          fs.writeFileSync(envPath, envContent);
          console.log('\n✅ .env file updated successfully!');
          await testWhatsAppProxy();
          
        } catch (error) {
          console.error('❌ Error updating .env file:', error);
        } finally {
          rl.close();
        }
      });
    });
  });
}

async function testWhatsAppProxy() {
  console.log('\n🧪 Testing WhatsApp proxy...');
  
  try {
    const response = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'health' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ WhatsApp proxy is working!');
      console.log('📊 Health check response:', JSON.stringify(data, null, 2));
      
      if (data.credentials_configured) {
        console.log('\n🎉 WhatsApp credentials are properly configured!');
        console.log('✅ The 400 error should now be resolved.');
      } else {
        console.log('\n⚠️  Credentials are still not configured properly.');
        console.log('Please check your Green API credentials.');
      }
    } else {
      console.log('❌ WhatsApp proxy test failed:');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing WhatsApp proxy:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkCurrentCredentials();
}

module.exports = {
  checkCurrentCredentials,
  updateDatabaseCredentials,
  updateEnvCredentials,
  testWhatsAppProxy
};
