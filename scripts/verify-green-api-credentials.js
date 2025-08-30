#!/usr/bin/env node

/**
 * Verify Green API Credentials
 * This script helps verify and fix Green API credentials that are causing 403 errors
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function verifyGreenApiCredentials() {
  console.log('🔍 Green API Credentials Verification');
  console.log('=====================================\n');

  // Test credentials from the error logs
  const testCredentials = [
    {
      instanceId: '7105306911',
      token: 'baa5bd7cb4d7468a91ffc6df4afb0ad2b8de4db7b1f3424cbf',
      description: 'From error logs'
    },
    {
      instanceId: 'fghjklkjklnk',
      token: '986756585686585r85697',
      description: 'From error logs'
    }
  ];

  console.log('📋 Testing Current Credentials:\n');

  for (const cred of testCredentials) {
    console.log(`🔍 Testing: ${cred.description}`);
    console.log(`   Instance ID: ${cred.instanceId}`);
    console.log(`   Token: ${cred.token.substring(0, 10)}...`);
    
    try {
      const url = `https://api.green-api.com/waInstance${cred.instanceId}/getStateInstance?token=${cred.token}`;
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhatsApp-Verifier/1.0'
        },
        timeout: 10000
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText}`);
        
        if (response.status === 403) {
          console.log(`   🚫 403 Forbidden - Credentials are invalid or instance doesn't exist`);
        } else if (response.status === 401) {
          console.log(`   🔐 401 Unauthorized - API token is invalid`);
        } else if (response.status === 404) {
          console.log(`   🔍 404 Not Found - Instance ID doesn't exist`);
        }
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🚀 Solutions:\n');

  console.log('1. Create New Green API Instance:');
  console.log('   - Go to https://console.green-api.com/');
  console.log('   - Log in to your account');
  console.log('   - Create a new WhatsApp instance');
  console.log('   - Copy the new instance ID and API token');
  console.log('');

  console.log('2. Verify Existing Instance:');
  console.log('   - Go to https://console.green-api.com/');
  console.log('   - Check if instances 7105306911 or fghjklkjklnk exist');
  console.log('   - If they exist, verify the API tokens');
  console.log('   - If they don\'t exist, create new ones');
  console.log('');

  console.log('3. Update Database:');
  console.log('   Run this SQL to update with new credentials:');
  console.log('   UPDATE whatsapp_instances_comprehensive');
  console.log('   SET');
  console.log('     instance_id = \'NEW_INSTANCE_ID\',');
  console.log('     api_token = \'NEW_API_TOKEN\',');
  console.log('     status = \'disconnected\'');
  console.log('   WHERE instance_id IN (\'7105306911\', \'fghjklkjklnk\');');
  console.log('');

  console.log('4. Test New Credentials:');
  console.log('   After updating, test with:');
  console.log('   curl -X GET "https://api.green-api.com/waInstanceNEW_ID/getStateInstance?token=NEW_TOKEN"');
  console.log('');

  console.log('📚 Additional Resources:');
  console.log('   - Green API Console: https://console.green-api.com/');
  console.log('   - Green API Documentation: https://green-api.com/docs/');
  console.log('   - Green API Status: https://status.green-api.com/');
  console.log('');

  console.log('🎯 Expected Result:');
  console.log('   After fixing credentials:');
  console.log('   ✅ No more 403 Forbidden errors');
  console.log('   ✅ Instance state shows correctly');
  console.log('   ✅ WhatsApp connection works');
  console.log('   ✅ Messages can be sent/received');
}

// Run the verification
verifyGreenApiCredentials()
  .then(() => {
    console.log('\n🎉 Credential verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
