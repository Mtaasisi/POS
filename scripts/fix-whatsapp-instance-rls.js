import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixWhatsAppInstance() {
  console.log('🔧 Fixing WhatsApp instance with admin access...\n');

  try {
    // Get the WhatsApp integration
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'whatsapp')
      .eq('provider', 'green-api');

    if (integrationError) {
      console.error('❌ Error fetching WhatsApp integration:', integrationError);
      return;
    }

    if (!integrations || integrations.length === 0) {
      console.log('❌ No WhatsApp integration found');
      return;
    }

    const integration = integrations[0];
    console.log('📱 Found WhatsApp integration:');
    console.log(`   Name: ${integration.name}`);
    console.log(`   Instance ID: ${integration.config.instance_id}`);
    console.log(`   API URL: ${integration.config.api_url}`);

    // Check if instance already exists
    const { data: existingInstances, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', integration.config.instance_id);

    if (checkError) {
      console.error('❌ Error checking existing instances:', checkError);
      return;
    }

    if (existingInstances && existingInstances.length > 0) {
      console.log('⚠️  Instance already exists, updating...');
      
      const existingInstance = existingInstances[0];
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          api_token: integration.config.api_key,
          phone_number: integration.config.instance_id,
          status: 'disconnected',
          green_api_token: integration.config.api_key,
          green_api_host: integration.config.api_url,
          is_green_api: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInstance.id);

      if (updateError) {
        console.error('❌ Error updating instance:', updateError);
        return;
      }

      console.log('✅ Instance updated successfully');
    } else {
      console.log('   Creating new instance...');
      
      // Create new instance
      const { data: newInstance, error: createError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_id: integration.config.instance_id,
          api_token: integration.config.api_key,
          phone_number: integration.config.instance_id,
          status: 'disconnected',
          green_api_token: integration.config.api_key,
          green_api_host: integration.config.api_url,
          is_green_api: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating instance:', createError);
        
        // Try alternative approach - check if we need to disable RLS temporarily
        console.log('🔄 Trying alternative approach...');
        
        // Check RLS policies
        const { data: policies, error: policyError } = await supabase
          .rpc('get_rls_policies', { table_name: 'whatsapp_instances' });
        
        if (policyError) {
          console.log('   ⚠️  Could not check RLS policies');
        } else {
          console.log('   📋 RLS Policies:', policies);
        }
        
        return;
      }

      console.log('✅ Instance created successfully');
      console.log(`   New instance ID: ${newInstance.id}`);
    }

    // Test the connection
    console.log('\n🔍 Testing WhatsApp connection...');
    await testWhatsAppConnection(integration.config);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

async function testWhatsAppConnection(config) {
  try {
    const testUrl = `${config.api_url}/waInstance${config.instance_id}/getStateInstance/${config.api_key}`;
    console.log(`   Testing: ${config.api_url}/waInstance${config.instance_id}/getStateInstance/***`);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Connection successful`);
      console.log(`   📱 Instance state: ${data.stateInstance}`);
      
      if (data.stateInstance === 'authorized') {
        console.log('   🎉 Instance is authorized and ready to use!');
        
        // Update status to connected
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ 
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('instance_id', config.instance_id);

        if (updateError) {
          console.log('   ⚠️  Could not update status to connected:', updateError.message);
        } else {
          console.log('   ✅ Status updated to connected');
        }
      } else if (data.stateInstance === 'notAuthorized') {
        console.log('   ⚠️  Instance is not authorized - needs QR code scan');
        console.log('   📱 Please scan the QR code with WhatsApp to connect');
      } else if (data.stateInstance === 'blocked') {
        console.log('   ❌ Instance is blocked - check your Green API account');
      }
    } else {
      console.log(`   ❌ Connection failed: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('   🔑 Invalid API token - check your credentials');
      } else if (response.status === 404) {
        console.log('   🔍 Instance not found - check your instance ID');
      } else if (response.status === 403) {
        console.log('   🚫 Access forbidden - check your Green API account status');
      }
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }
}

async function main() {
  console.log('🚀 WhatsApp Instance RLS Fix Tool\n');
  
  await fixWhatsAppInstance();
  
  console.log('\n✨ Fix complete!');
  console.log('\n📱 Next steps:');
  console.log('1. If RLS is blocking the operation, you may need to:');
  console.log('   - Use the Supabase dashboard to manually create the instance');
  console.log('   - Or temporarily disable RLS for the whatsapp_instances table');
  console.log('2. Once the instance is created, refresh your app');
  console.log('3. Go to WhatsApp Hub to manage your instance');
  console.log('4. Scan the QR code to connect WhatsApp');
}

main().catch(console.error);
