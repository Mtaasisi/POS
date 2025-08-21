#!/usr/bin/env node

/**
 * Add WhatsApp Instance Script
 * 
 * This script adds a WhatsApp instance to the database using Green API credentials.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// WhatsApp instance data from user
const instanceData = {
  instance_id: '7105284900',
  api_token: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  phone_number: '', // Will be fetched from API
  status: 'disconnected',
  name: 'Instance 7105284900',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function checkInstanceStatus(instanceId, apiToken) {
  try {
    const response = await fetch(`https://7105.api.greenapi.com/waInstance${instanceId}/getStateInstance/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📱 Instance Status:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking instance status:', error.message);
    return null;
  }
}

async function getQRCode(instanceId, apiToken) {
  try {
    const response = await fetch(`https://7105.api.greenapi.com/waInstance${instanceId}/qr/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📱 QR Code Response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error getting QR code:', error.message);
    return null;
  }
}

async function addWhatsAppInstance() {
  console.log('🚀 Adding WhatsApp instance to database...\n');

  try {
    // First, check if the instance already exists
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', instanceData.instance_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing instance:', checkError);
      return;
    }

    // Check instance status
    const status = await checkInstanceStatus(instanceData.instance_id, instanceData.api_token);
    let qrCode = null;
    
    if (status?.stateInstance === 'notAuthorized') {
      qrCode = await getQRCode(instanceData.instance_id, instanceData.api_token);
    }

    if (existingInstance) {
      console.log('⚠️  Instance already exists. Updating...');
      
      // Update the instance
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          api_token: instanceData.api_token,
          status: status?.stateInstance || 'disconnected',
          qr_code: qrCode?.qr || null,
          name: instanceData.name,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceData.instance_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating instance:', updateError);
        return;
      }

      console.log('✅ Instance updated successfully!');
      console.log('📋 Instance Details:');
      console.log(`   ID: ${updatedInstance.id}`);
      console.log(`   Instance ID: ${updatedInstance.instance_id}`);
      console.log(`   Name: ${updatedInstance.name}`);
      console.log(`   Status: ${updatedInstance.status}`);
      console.log(`   Phone: ${updatedInstance.phone_number || 'Not connected'}`);
      
      if (qrCode?.qr) {
        console.log(`   QR Code: Available (scan to connect)`);
      }
      
    } else {
      console.log('➕ Creating new instance...');
      
      // Create the instance
      const { data: newInstance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          ...instanceData,
          status: status?.stateInstance || 'disconnected',
          qr_code: qrCode?.qr || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating instance:', insertError);
        return;
      }

      console.log('✅ Instance created successfully!');
      console.log('📋 Instance Details:');
      console.log(`   ID: ${newInstance.id}`);
      console.log(`   Instance ID: ${newInstance.instance_id}`);
      console.log(`   Name: ${newInstance.name}`);
      console.log(`   Status: ${newInstance.status}`);
      console.log(`   Phone: ${newInstance.phone_number || 'Not connected'}`);
      
      if (qrCode?.qr) {
        console.log(`   QR Code: Available (scan to connect)`);
      }
    }

    console.log('\n🎉 WhatsApp instance setup completed!');
    console.log('\n📝 Next steps:');
    
    if (status?.stateInstance === 'authorized') {
      console.log('✅ Instance is already authorized and ready to use!');
      console.log('1. You can now send messages through the WhatsApp API');
      console.log('2. Check the WhatsApp management page to see your instance');
    } else if (status?.stateInstance === 'notAuthorized') {
      console.log('📱 Instance needs to be authorized:');
      console.log('1. Check the WhatsApp management page for the QR code');
      console.log('2. Scan the QR code with your WhatsApp mobile app');
      console.log('3. Once connected, the status will update automatically');
    } else {
      console.log('1. Check the instance status in your WhatsApp management page');
      console.log('2. If status is "notAuthorized", scan the QR code to connect');
      console.log('3. Once connected, the phone number will be automatically detected');
      console.log('4. You can then start sending messages through the API');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addWhatsAppInstance();
