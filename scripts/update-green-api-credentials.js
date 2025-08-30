#!/usr/bin/env node

/**
 * Update Green API Credentials in Database
 * This script updates your database with new valid Green API credentials
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateGreenApiCredentials() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('🔑 Update Green API Credentials');
    console.log('==============================\n');
    
    console.log('📋 Usage:');
    console.log('   node scripts/update-green-api-credentials.js <instanceId> <apiToken>');
    console.log('');
    
    console.log('📝 Example:');
    console.log('   node scripts/update-green-api-credentials.js 1234567890 abc123def456...');
    console.log('');
    
    console.log('💡 Get your credentials from: https://console.green-api.com/');
    console.log('');
    
    process.exit(1);
  }

  const [instanceId, apiToken] = args;

  console.log('🔑 Updating Green API Credentials');
  console.log('=================================\n');

  console.log('📋 New Credentials:');
  console.log(`   Instance ID: ${instanceId}`);
  console.log(`   API Token: ${apiToken.substring(0, 10)}...`);
  console.log('');

  // First, test the credentials
  console.log('🧪 Testing credentials...');
  try {
    const testUrl = `https://api.green-api.com/waInstance${instanceId}/getStateInstance?token=${apiToken}`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Updater/1.0'
      },
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Credentials are valid!');
      console.log(`   Instance state: ${data.stateInstance}`);
      console.log('');
    } else {
      const errorText = await response.text();
      console.log(`❌ Credentials are invalid: ${response.status} - ${errorText}`);
      console.log('');
      console.log('🔧 Please check your credentials and try again.');
      console.log('   Get valid credentials from: https://console.green-api.com/');
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Error testing credentials: ${error.message}`);
    console.log('');
    console.log('🔧 Please check your credentials and try again.');
    process.exit(1);
  }

  // Update the database
  console.log('💾 Updating database...');
  try {
    // First, check if instance exists
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('id, instance_id, api_token')
      .eq('instance_id', instanceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log(`❌ Error checking database: ${checkError.message}`);
      process.exit(1);
    }

    if (existingInstance) {
      // Update existing instance
      const { error: updateError } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          api_token: apiToken,
          status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId);

      if (updateError) {
        console.log(`❌ Error updating instance: ${updateError.message}`);
        process.exit(1);
      }

      console.log('✅ Updated existing instance in database');
    } else {
      // Create new instance
      const { error: insertError } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          instance_id: instanceId,
          api_token: apiToken,
          instance_name: `WhatsApp Instance ${instanceId}`,
          description: 'Updated via script',
          green_api_host: 'https://api.green-api.com',
          green_api_url: `https://api.green-api.com/waInstance${instanceId}`,
          state_instance: 'notAuthorized',
          status: 'disconnected',
          is_active: true
        });

      if (insertError) {
        console.log(`❌ Error creating instance: ${insertError.message}`);
        process.exit(1);
      }

      console.log('✅ Created new instance in database');
    }

    console.log('');
    console.log('🎉 Database updated successfully!');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Refresh your application');
    console.log('   2. Go to WhatsApp settings');
    console.log('   3. Generate QR code to authorize WhatsApp');
    console.log('   4. Test sending/receiving messages');
    console.log('');

  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
updateGreenApiCredentials()
  .then(() => {
    console.log('✅ Credential update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
