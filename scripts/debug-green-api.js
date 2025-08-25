#!/usr/bin/env node

/**
 * Debug Green API Connection Issues
 * This script helps diagnose 403 errors and connection problems
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function debugGreenApi() {
  console.log('🔍 Debugging Green API Connection Issues');
  console.log('========================================\n');

  try {
    // Step 1: Check if user is authenticated
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ User not authenticated');
      console.log('Please log in to your account first');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);

    // Step 2: Get WhatsApp instances from database
    console.log('\n2️⃣ Fetching WhatsApp instances...');
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (instancesError) {
      console.log('❌ Error fetching instances:', instancesError.message);
      return;
    }

    if (!instances || instances.length === 0) {
      console.log('❌ No WhatsApp instances found in database');
      console.log('Please create a WhatsApp instance first');
      return;
    }

    console.log(`✅ Found ${instances.length} WhatsApp instance(s):`);
    instances.forEach((instance, index) => {
      console.log(`   ${index + 1}. ID: ${instance.instance_id}`);
      console.log(`      Phone: ${instance.phone_number}`);
      console.log(`      Status: ${instance.status}`);
      console.log(`      API Token: ${instance.api_token ? '✅ Set' : '❌ Missing'}`);
      console.log('');
    });

    // Step 3: Test each instance
    for (const instance of instances) {
      console.log(`3️⃣ Testing instance: ${instance.instance_id}`);
      console.log(`   Phone: ${instance.phone_number}`);
      
      if (!instance.api_token) {
        console.log('   ❌ No API token found');
        continue;
      }

      // Test basic connection
      try {
        const response = await fetch('http://localhost:8888/green-api-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `/waInstance${instance.instance_id}/getStateInstance`,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${instance.api_token}`
            }
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('   ✅ Connection successful');
          console.log(`   📊 State: ${result.data.stateInstance}`);
        } else {
          console.log('   ❌ Connection failed');
          console.log(`   📊 Error: ${result.error || 'Unknown error'}`);
          
          // Check specific error types
          if (result.status === 403) {
            console.log('   🔍 403 Error - Possible causes:');
            console.log('      - Invalid API token');
            console.log('      - Instance ID does not exist');
            console.log('      - Instance not authorized');
            console.log('      - Wrong Green API account');
          } else if (result.status === 404) {
            console.log('   🔍 404 Error - Instance not found');
          } else if (result.status === 401) {
            console.log('   🔍 401 Error - Unauthorized (invalid token)');
          }
        }
      } catch (error) {
        console.log('   ❌ Request failed:', error.message);
      }
      
      console.log('');
    }

    // Step 4: Provide recommendations
    console.log('4️⃣ Recommendations:');
    console.log('');
    
    if (instances.some(instance => !instance.api_token)) {
      console.log('🔧 Fix missing API tokens:');
      console.log('   - Go to your Green API dashboard');
      console.log('   - Copy the API token for each instance');
      console.log('   - Update the instance in your database');
    }
    
    console.log('🔧 For 403 errors:');
    console.log('   1. Verify the instance ID exists in your Green API account');
    console.log('   2. Check that the API token is correct');
    console.log('   3. Ensure the instance is properly set up in Green API');
    console.log('   4. Try creating a new instance if the current one is corrupted');
    
    console.log('\n🔧 Test with Green API directly:');
    console.log('   curl -X GET "https://api.green-api.com/waInstance<INSTANCE_ID>/getStateInstance" \\');
    console.log('        -H "Authorization: Bearer <API_TOKEN>"');
    
    console.log('\n🔧 Create a new test instance:');
    console.log('   1. Go to https://console.green-api.com/');
    console.log('   2. Create a new WhatsApp instance');
    console.log('   3. Copy the instance ID and API token');
    console.log('   4. Add it to your app');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugGreenApi()
  .then(() => {
    console.log('\n🎉 Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
