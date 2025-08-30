#!/usr/bin/env node

/**
 * Get Valid Green API Credentials
 * This script helps you get valid Green API credentials and update your database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

async function getValidGreenApiCredentials() {
  console.log('🔑 Green API Credentials Setup');
  console.log('==============================\n');

  console.log('📋 Current Issue:');
  console.log('   Your current Green API credentials are invalid (403 Forbidden)');
  console.log('   This script will help you get new valid credentials');
  console.log('');

  console.log('🚀 Step-by-Step Guide:\n');

  console.log('1. 🌐 Go to Green API Console');
  console.log('   - Open: https://console.green-api.com/');
  console.log('   - Log in to your account (or create one if needed)');
  console.log('');

  console.log('2. 📱 Create New WhatsApp Instance');
  console.log('   - Click "Create Instance" or "Add Instance"');
  console.log('   - Choose "WhatsApp" as the type');
  console.log('   - Give it a name (e.g., "LATS CHANCE WhatsApp")');
  console.log('   - Copy the Instance ID and API Token');
  console.log('');

  console.log('3. 🔐 Copy Your Credentials');
  console.log('   - Instance ID: (e.g., 1234567890)');
  console.log('   - API Token: (e.g., abc123def456...)');
  console.log('');

  console.log('4. 🧪 Test Your Credentials');
  console.log('   Run this command with your new credentials:');
  console.log('   curl -X GET "https://api.green-api.com/waInstanceYOUR_INSTANCE_ID/getStateInstance?token=YOUR_API_TOKEN"');
  console.log('');

  console.log('5. 💾 Update Database (Optional)');
  console.log('   If you want to update your database automatically,');
  console.log('   run this script with your new credentials:');
  console.log('   node scripts/update-green-api-credentials.js YOUR_INSTANCE_ID YOUR_API_TOKEN');
  console.log('');

  console.log('📚 Additional Resources:');
  console.log('   - Green API Documentation: https://green-api.com/docs/');
  console.log('   - WhatsApp Integration Guide: https://green-api.com/docs/waInstance/');
  console.log('   - API Reference: https://green-api.com/docs/api/');
  console.log('');

  console.log('🎯 Expected Result:');
  console.log('   After getting valid credentials:');
  console.log('   ✅ No more 403 Forbidden errors');
  console.log('   ✅ Instance state shows correctly');
  console.log('   ✅ WhatsApp connection works');
  console.log('   ✅ QR code can be generated');
  console.log('   ✅ Messages can be sent/received');
  console.log('');

  // Check current database records
  try {
    console.log('📊 Current Database Records:');
    const { data: instances, error } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('instance_id, api_token, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('   ❌ Error reading database:', error.message);
    } else if (instances && instances.length > 0) {
      console.log(`   Found ${instances.length} WhatsApp instance(s):`);
      instances.forEach((instance, index) => {
        console.log(`   ${index + 1}. Instance ID: ${instance.instance_id}`);
        console.log(`      Token: ${instance.api_token.substring(0, 10)}...`);
        console.log(`      Status: ${instance.status}`);
        console.log(`      Created: ${new Date(instance.created_at).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('   No WhatsApp instances found in database');
    }
  } catch (error) {
    console.log('   ❌ Error checking database:', error.message);
  }

  console.log('💡 Pro Tips:');
  console.log('   - Keep your API tokens secure and don\'t share them');
  console.log('   - Test credentials before using them in production');
  console.log('   - Monitor your Green API usage and limits');
  console.log('   - Set up webhooks for real-time message handling');
  console.log('');

  console.log('🎉 Ready to get started!');
  console.log('Follow the steps above to get your valid Green API credentials.');
}

// Run the script
getValidGreenApiCredentials()
  .then(() => {
    console.log('\n✅ Setup guide completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
