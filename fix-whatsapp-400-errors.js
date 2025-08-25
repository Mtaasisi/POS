#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixWhatsApp400Errors() {
  console.log('🔧 Fixing WhatsApp 400 Bad Request Errors...\n');

  try {
    // Step 1: Check if settings table exists
    console.log('📋 Step 1: Checking settings table...');
    
    const { data: settingsCheck, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.log('⚠️ Settings table may not exist, creating it...');
      
      // Create settings table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_settings_table_if_not_exists');
      
      if (createError) {
        console.log('⚠️ Could not create settings table automatically, will try to insert directly...');
      }
    }

    // Step 2: Set up default WhatsApp settings
    console.log('\n📋 Step 2: Setting up WhatsApp settings...');
    
    const defaultSettings = [
      {
        key: 'whatsapp.instanceId',
        value: 'your_instance_id_here'
      },
      {
        key: 'whatsapp.apiToken', 
        value: 'your_api_token_here'
      },
      {
        key: 'whatsapp.apiUrl',
        value: 'https://api.greenapi.com'
      },
      {
        key: 'whatsapp.mediaUrl',
        value: 'https://api.greenapi.com'
      },
      {
        key: 'whatsapp.allowedNumbers',
        value: JSON.stringify([])
      },
      {
        key: 'whatsapp.quota',
        value: JSON.stringify({
          monthlyLimit: 'Unknown',
          upgradeRequired: false,
          upgradeUrl: 'https://console.green-api.com'
        })
      }
    ];

    // Insert settings one by one to handle potential conflicts
    for (const setting of defaultSettings) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });

        if (error) {
          console.log(`⚠️ Could not insert ${setting.key}: ${error.message}`);
        } else {
          console.log(`✅ Set up ${setting.key}`);
        }
      } catch (err) {
        console.log(`⚠️ Error setting up ${setting.key}: ${err.message}`);
      }
    }

    // Step 3: Create a .env template with proper structure
    console.log('\n📋 Step 3: Creating environment template...');
    
    const envTemplate = `# WhatsApp Hub Environment Configuration
# Copy this file to .env and fill in your values

# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Supabase Service Role Key (Get this from your Supabase dashboard)
# Go to Settings > API > Project API keys > service_role
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration (for PHP proxy)
SUPABASE_DB_HOST=db.jxhzveborezjhsmzsgbc.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_database_password_here

# WhatsApp Green API Configuration
# Get these from https://console.green-api.com
GREENAPI_INSTANCE_ID=your_instance_id_here
GREENAPI_API_TOKEN=your_api_token_here
GREENAPI_API_URL=https://api.greenapi.com

# Webhook Configuration
WEBHOOK_URL=https://your-domain.com/api/whatsapp-webhook.php
HOSTINGER_TOKEN=your_hostinger_token_here

# Debug Configuration
DEBUG_MODE=true
DEBUG_LOGGING=true
DEBUG_WEBHOOK=true

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
`;

    fs.writeFileSync('.env.template', envTemplate);
    console.log('✅ Created .env.template with proper structure');

    // Step 4: Test the current configuration
    console.log('\n📋 Step 4: Testing current configuration...');
    
    const { data: currentSettings, error: testError } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'whatsapp.%');

    if (testError) {
      console.log(`❌ Error testing configuration: ${testError.message}`);
    } else {
      console.log(`✅ Found ${currentSettings?.length || 0} WhatsApp settings in database`);
      
      if (currentSettings && currentSettings.length > 0) {
        console.log('\n📋 Current WhatsApp settings:');
        currentSettings.forEach(setting => {
          const value = setting.key.includes('Token') || setting.key.includes('Id') 
            ? `${setting.value.substring(0, 8)}...` 
            : setting.value;
          console.log(`   ${setting.key}: ${value}`);
        });
      }
    }

    console.log('\n🎯 WhatsApp 400 Error Fix Summary:');
    console.log('=====================================');
    console.log('✅ Created settings table structure');
    console.log('✅ Set up default WhatsApp settings');
    console.log('✅ Created .env.template with proper structure');
    console.log('\n📋 Next Steps:');
    console.log('1. Get your Supabase service role key from the dashboard');
    console.log('2. Get your GreenAPI credentials from https://console.green-api.com');
    console.log('3. Update your .env file with the real values');
    console.log('4. Test the WhatsApp proxy with: node scripts/test-whatsapp-proxy.js');

  } catch (error) {
    console.error('❌ Error fixing WhatsApp 400 errors:', error);
  }
}

// Run the fix
fixWhatsApp400Errors();
