import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInstanceConfig() {
  try {
    console.log('🔍 Checking WhatsApp instance configuration for all active instances...');
    console.log('='.repeat(60));
    
    // Check in whatsapp_instances_comprehensive table for active instances
    const { data: instances, error } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching instance:', error);
      return;
    }

    if (!instances || instances.length === 0) {
      console.log('⚠️ No active instances found');
      
      // Check if there are any instances at all
      const { data: allInstances, error: allError } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('instance_id, instance_name, status, is_active');
        
      if (!allError && allInstances && allInstances.length > 0) {
        console.log('\n📋 Found these instances in database:');
        allInstances.forEach(inst => {
          console.log(`   - ${inst.instance_id} (${inst.instance_name || 'No name'}) - ${inst.status} - Active: ${inst.is_active}`);
        });
      }
      return;
    }

    console.log(`✅ Found ${instances.length} active instance(s)!\n`);
    
    // Test each active instance
    for (const instance of instances) {
    
    console.log('✅ Instance found!');
    console.log('\n📋 Instance Configuration:');
    console.log(`   Instance ID: ${instance.instance_id}`);
    console.log(`   Instance Name: ${instance.instance_name || 'Not set'}`);
    console.log(`   API Token: ${instance.api_token ? instance.api_token.substring(0, 15) + '...' : 'Not set'}`);
    console.log(`   Green API Host: ${instance.green_api_host}`);
    console.log(`   Green API URL: ${instance.green_api_url}`);
    console.log(`   Status: ${instance.status}`);
    console.log(`   State Instance: ${instance.state_instance}`);
    console.log(`   Phone Number: ${instance.phone_number || 'Not set'}`);
    console.log(`   Is Active: ${instance.is_active}`);
    console.log(`   Created At: ${instance.created_at}`);
    console.log(`   Updated At: ${instance.updated_at}`);

    // Test the configuration by making an API call
    console.log('\n🧪 Testing API configuration...');
    const testUrl = `${instance.green_api_host}/waInstance${instance.instance_id}/getStateInstance/${instance.api_token}`;
    console.log(`🌐 Test URL: ${testUrl}`);

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API call successful!');
        console.log(`📱 State Instance: ${result.stateInstance}`);
        console.log(`📱 Device Info:`, result.deviceInfo || 'Not available');
      } else {
        const errorText = await response.text();
        console.log('❌ API call failed!');
        console.log(`📥 Error Response: ${errorText}`);
        
        if (response.status === 401) {
          console.log('\n💡 This is likely an authentication issue. The API token might be incorrect or expired.');
        }
      }
    } catch (fetchError) {
      console.error('❌ Network error testing API:', fetchError.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkInstanceConfig();
