#!/usr/bin/env node

/**
 * Create New WhatsApp Instance
 * This script helps you create a new WhatsApp instance and update your database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createNewWhatsAppInstance() {
  console.log('🔧 Create New WhatsApp Instance');
  console.log('==============================\n');

  console.log('📋 Instructions:');
  console.log('1. Go to https://console.green-api.com/');
  console.log('2. Log in to your account');
  console.log('3. Create a new WhatsApp instance');
  console.log('4. Copy the instance ID and API token');
  console.log('5. Enter them below\n');

  try {
    // Get user input
    const newInstanceId = await question('Enter the new instance ID: ');
    const newApiToken = await question('Enter the new API token: ');
    const phoneNumber = await question('Enter the phone number (optional, press Enter to skip): ');

    if (!newInstanceId || !newApiToken) {
      console.log('❌ Instance ID and API token are required');
      rl.close();
      return;
    }

    console.log('\n🔍 Validating input...');
    console.log(`   Instance ID: ${newInstanceId}`);
    console.log(`   API Token: ${newApiToken.substring(0, 10)}...`);
    console.log(`   Phone Number: ${phoneNumber || 'Not provided'}`);

    // Test the new credentials
    console.log('\n🧪 Testing new credentials...');
    try {
      const response = await fetch('http://localhost:8888/green-api-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/waInstance${newInstanceId}/getStateInstance`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newApiToken}`
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ New credentials are valid!');
        console.log(`📊 Instance state: ${result.data.stateInstance}`);
      } else {
        console.log('❌ New credentials failed');
        console.log(`📊 Error: ${result.error || 'Unknown error'}`);
        console.log('Please check your instance ID and API token');
        rl.close();
        return;
      }
    } catch (error) {
      console.log('❌ Failed to test credentials:', error.message);
      rl.close();
      return;
    }

    // Ask for confirmation
    const confirm = await question('\n🤔 Do you want to update the database with these new credentials? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      rl.close();
      return;
    }

    // Update the database
    console.log('\n💾 Updating database...');
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({
        instance_id: newInstanceId,
        api_token: newApiToken,
        phone_number: phoneNumber || null,
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', '7105306911')
      .select();

    if (error) {
      console.log('❌ Database update failed:', error.message);
      
      // Try to create a new record instead
      console.log('🔄 Trying to create new record...');
      const { data: newData, error: createError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_id: newInstanceId,
          api_token: newApiToken,
          phone_number: phoneNumber || '+255123456789',
          status: 'disconnected',
          is_green_api: true,
          green_api_instance_id: newInstanceId,
          green_api_token: newApiToken
        })
        .select();

      if (createError) {
        console.log('❌ Failed to create new record:', createError.message);
        rl.close();
        return;
      }

      console.log('✅ New WhatsApp instance created successfully!');
      console.log('📊 New record:', newData[0]);
    } else {
      console.log('✅ Database updated successfully!');
      console.log('📊 Updated record:', data[0]);
    }

    // Test the updated instance
    console.log('\n🧪 Testing updated instance...');
    try {
      const testResponse = await fetch('http://localhost:8888/green-api-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/waInstance${newInstanceId}/getStateInstance`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newApiToken}`
          }
        })
      });

      const testResult = await testResponse.json();
      
      if (testResult.success) {
        console.log('✅ Instance is working correctly!');
        console.log(`📊 State: ${testResult.data.stateInstance}`);
        
        if (testResult.data.stateInstance === 'notAuthorized') {
          console.log('\n📱 Next steps:');
          console.log('1. Get the QR code for this instance');
          console.log('2. Scan it with WhatsApp');
          console.log('3. Wait for the instance to become "authorized"');
        }
      } else {
        console.log('⚠️ Instance test failed:', testResult.error);
      }
    } catch (error) {
      console.log('⚠️ Failed to test updated instance:', error.message);
    }

    console.log('\n🎉 Setup completed!');
    console.log('📝 Summary:');
    console.log(`   - Old instance ID: 7105306911`);
    console.log(`   - New instance ID: ${newInstanceId}`);
    console.log(`   - Status: Updated in database`);
    console.log(`   - Next: Test in your app`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
createNewWhatsAppInstance()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
