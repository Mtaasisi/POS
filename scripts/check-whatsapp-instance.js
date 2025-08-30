import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppInstances() {
  console.log('🔍 Checking WhatsApp instances...\n');

  try {
    // Fetch all WhatsApp instances
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching instances:', error);
      return;
    }

    if (!instances || instances.length === 0) {
      console.log('❌ No WhatsApp instances found in database');
      console.log('\n📋 To create a new instance:');
      console.log('1. Go to WhatsApp Hub in your app');
      console.log('2. Click "Add New Instance"');
      console.log('3. Enter your Green API credentials');
      console.log('4. Scan the QR code with WhatsApp');
      return;
    }

    console.log(`📱 Found ${instances.length} WhatsApp instance(s):\n`);

    for (const instance of instances) {
      console.log(`Instance ID: ${instance.instance_id}`);
      console.log(`Status: ${instance.status}`);
      console.log(`Phone Number: ${instance.phone_number || 'Not set'}`);
      console.log(`API Token: ${instance.api_token ? 'Present' : 'Missing'}`);
      console.log(`Green API Token: ${instance.green_api_token ? 'Present' : 'Missing'}`);
      console.log(`Created: ${new Date(instance.created_at).toLocaleString()}`);
      
      if (instance.connection_error) {
        console.log(`❌ Connection Error: ${instance.connection_error}`);
      }
      
      console.log('---');
    }

    // Check connection status
    const connectedInstances = instances.filter(i => i.status === 'connected');
    const disconnectedInstances = instances.filter(i => i.status === 'disconnected');
    const errorInstances = instances.filter(i => i.status === 'error');

    console.log('\n📊 Connection Summary:');
    console.log(`✅ Connected: ${connectedInstances.length}`);
    console.log(`⚠️  Disconnected: ${disconnectedInstances.length}`);
    console.log(`❌ Error: ${errorInstances.length}`);

    if (connectedInstances.length === 0) {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Check if your Green API credentials are correct');
      console.log('2. Verify that your WhatsApp instance is authorized');
      console.log('3. Try reconnecting the instance using QR code');
      console.log('4. Check if your Green API account is active');
      
      if (disconnectedInstances.length > 0) {
        console.log('\n🔄 To reconnect instances:');
        console.log('1. Go to WhatsApp Hub in your app');
        console.log('2. Find the disconnected instance');
        console.log('3. Click "Reconnect" or "Generate QR Code"');
        console.log('4. Scan the QR code with WhatsApp on your phone');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testGreenApiConnection() {
  console.log('\n🌐 Testing Green API connection...\n');

  try {
    // Get the first instance to test
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (error || !instances || instances.length === 0) {
      console.log('❌ No instances found to test');
      return;
    }

    const instance = instances[0];
    console.log(`Testing instance: ${instance.instance_id}`);

    // Test basic connection
    const apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
    const testUrl = `${apiBaseUrl}/waInstance${instance.instance_id}/getStateInstance/${instance.green_api_token || instance.api_token}`;

    console.log(`Testing URL: ${apiBaseUrl}/waInstance${instance.instance_id}/getStateInstance/***`);

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Green API connection successful');
        console.log(`Instance state: ${data.stateInstance}`);
        
        if (data.stateInstance === 'authorized') {
          console.log('✅ Instance is authorized and ready to use');
        } else if (data.stateInstance === 'notAuthorized') {
          console.log('⚠️  Instance is not authorized - needs QR code scan');
        } else if (data.stateInstance === 'blocked') {
          console.log('❌ Instance is blocked - check your Green API account');
        } else {
          console.log(`⚠️  Unknown state: ${data.stateInstance}`);
        }
      } else {
        console.log(`❌ Green API connection failed: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
          console.log('🔑 Invalid API token - check your credentials');
        } else if (response.status === 404) {
          console.log('🔍 Instance not found - check your instance ID');
        } else if (response.status === 403) {
          console.log('🚫 Access forbidden - check your Green API account status');
        }
      }
    } catch (fetchError) {
      console.log('❌ Network error:', fetchError.message);
      console.log('🌐 Check your internet connection and Green API service status');
    }

  } catch (error) {
    console.error('❌ Error testing connection:', error);
  }
}

// Run the checks
async function main() {
  console.log('🚀 WhatsApp Instance Diagnostic Tool\n');
  
  await checkWhatsAppInstances();
  await testGreenApiConnection();
  
  console.log('\n✨ Diagnostic complete!');
  console.log('\n📱 Next steps:');
  console.log('1. If instances are disconnected, reconnect them in WhatsApp Hub');
  console.log('2. If no instances exist, create a new one');
  console.log('3. If connection fails, check your Green API credentials');
  console.log('4. Visit https://green-api.com to verify your account status');
}

main().catch(console.error);
