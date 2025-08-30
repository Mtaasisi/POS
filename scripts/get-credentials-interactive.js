#!/usr/bin/env node

/**
 * Interactive Green API Credentials Setup
 * This script helps you get and test Green API credentials
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testCredentials(instanceId, apiToken) {
  console.log('\n🧪 Testing your credentials...');
  
  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/getStateInstance?token=${apiToken}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Credentials are VALID!');
      console.log('📊 Instance State:', data.stateInstance);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Credentials are INVALID');
      console.log('📊 Status:', response.status);
      console.log('📊 Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing credentials:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔑 Green API Credentials Setup');
  console.log('==============================\n');

  console.log('📋 Instructions:');
  console.log('1. Go to https://console.green-api.com/');
  console.log('2. Log in to your account');
  console.log('3. Find your WhatsApp instance or create a new one');
  console.log('4. Copy the Instance ID and API Token\n');

  const instanceId = await question('📱 Enter your Instance ID: ');
  const apiToken = await question('🔑 Enter your API Token: ');

  console.log('\n📊 Your Credentials:');
  console.log('Instance ID:', instanceId);
  console.log('API Token:', apiToken);

  const isValid = await testCredentials(instanceId, apiToken);

  if (isValid) {
    console.log('\n🎉 Great! Your credentials are working!');
    
    const updateDb = await question('\n💾 Do you want to update your database with these credentials? (y/n): ');
    
    if (updateDb.toLowerCase() === 'y' || updateDb.toLowerCase() === 'yes') {
      console.log('\n🔄 Updating database...');
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.log('❌ Missing Supabase environment variables');
          console.log('Please check your .env file');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if instance already exists
        const { data: existingInstance } = await supabase
          .from('whatsapp_instances_comprehensive')
          .select('*')
          .eq('idInstance', instanceId)
          .single();

        if (existingInstance) {
          // Update existing instance
          const { error } = await supabase
            .from('whatsapp_instances_comprehensive')
            .update({
              apiTokenInstance: apiToken,
              updated_at: new Date().toISOString()
            })
            .eq('idInstance', instanceId);

          if (error) {
            console.log('❌ Error updating database:', error.message);
          } else {
            console.log('✅ Database updated successfully!');
          }
        } else {
          // Create new instance
          const { error } = await supabase
            .from('whatsapp_instances_comprehensive')
            .insert({
              idInstance: instanceId,
              apiTokenInstance: apiToken,
              name: `Instance ${instanceId}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.log('❌ Error creating database record:', error.message);
          } else {
            console.log('✅ New instance created in database!');
          }
        }
      } catch (error) {
        console.log('❌ Database error:', error.message);
      }
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test your WhatsApp integration in the app');
    console.log('2. Generate QR code to authorize WhatsApp');
    console.log('3. Start sending/receiving messages');
    
  } else {
    console.log('\n❌ Please check your credentials and try again');
    console.log('Make sure you copied them correctly from the Green API console');
  }

  rl.close();
}

main()
  .then(() => {
    console.log('\n🎉 Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
