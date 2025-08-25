import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixExistingInstance() {
  console.log('🔧 Fixing existing WhatsApp instance...\n');

  try {
    // Get the existing instance
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching instances:', fetchError);
      return;
    }

    if (instances.length === 0) {
      console.log('ℹ️ No instances found to fix');
      return;
    }

    const instance = instances[0];
    console.log('📋 Current instance data:');
    console.log(`   - ID: ${instance.id}`);
    console.log(`   - Instance ID: ${instance.instance_id}`);
    console.log(`   - Phone: ${instance.phone_number}`);
    console.log(`   - Status: ${instance.status}`);
    console.log(`   - API Token: ${instance.api_token ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - Green API Token: ${instance.green_api_token ? '✅ Present' : '❌ Missing'}`);

    // Check if we need to copy green_api_token to api_token
    if (!instance.api_token && instance.green_api_token) {
      console.log('\n🔄 Copying green_api_token to api_token...');
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ api_token: instance.green_api_token })
        .eq('id', instance.id);

      if (updateError) {
        console.error('❌ Error updating instance:', updateError);
      } else {
        console.log('✅ Successfully copied green_api_token to api_token');
      }
    } else if (!instance.api_token && !instance.green_api_token) {
      console.log('\n⚠️ Instance has no API token. Adding a placeholder...');
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          api_token: 'placeholder_token_' + Date.now(),
          status: 'disconnected'
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error('❌ Error updating instance:', updateError);
      } else {
        console.log('✅ Added placeholder API token');
      }
    } else {
      console.log('\n✅ Instance looks good - no fixes needed');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: updatedInstance, error: verifyError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instance.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying instance:', verifyError);
    } else {
      console.log('📋 Updated instance data:');
      console.log(`   - ID: ${updatedInstance.id}`);
      console.log(`   - Instance ID: ${updatedInstance.instance_id}`);
      console.log(`   - Phone: ${updatedInstance.phone_number}`);
      console.log(`   - Status: ${updatedInstance.status}`);
      console.log(`   - API Token: ${updatedInstance.api_token ? '✅ Present' : '❌ Missing'}`);
      console.log(`   - Green API Token: ${updatedInstance.green_api_token ? '✅ Present' : '❌ Missing'}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixExistingInstance().then(() => {
  console.log('\n✅ Instance fix complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
