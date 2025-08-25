import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking WhatsApp instances database...\n');

  try {
    // Check if table exists
    console.log('1️⃣ Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table error:', tableError);
      return;
    }

    console.log('✅ Table exists and accessible');

    // Count records
    console.log('\n2️⃣ Counting records...');
    const { count, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count error:', countError);
    } else {
      console.log(`📊 Total records: ${count}`);
    }

    // Get sample data
    console.log('\n3️⃣ Getting sample data...');
    const { data: instances, error: dataError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Data fetch error:', dataError);
    } else {
      console.log(`📋 Sample data (${instances.length} records):`);
      instances.forEach((instance, index) => {
        console.log(`\n   Record ${index + 1}:`);
        console.log(`   - ID: ${instance.id}`);
        console.log(`   - Instance ID: ${instance.instance_id}`);
        console.log(`   - Phone: ${instance.phone_number}`);
        console.log(`   - Status: ${instance.status}`);
        console.log(`   - Created: ${instance.created_at}`);
        console.log(`   - Has API Token: ${instance.api_token ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Has Green API Token: ${instance.green_api_token ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Has Webhook URL: ${instance.webhook_url ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Is Green API: ${instance.is_green_api ? '✅ Yes' : '❌ No'}`);
      });
    }

    // Test CRUD operations
    console.log('\n4️⃣ Testing CRUD operations...');
    
    // Test INSERT
    console.log('   Testing INSERT...');
    const testInstance = {
      instance_id: 'test_' + Date.now(),
      api_token: 'test_token_' + Date.now(),
      phone_number: '+1234567890',
      status: 'disconnected',
      is_green_api: true
    };

    const { data: inserted, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(testInstance)
      .select();

    if (insertError) {
      console.error('   ❌ INSERT failed:', insertError.message);
    } else {
      console.log('   ✅ INSERT successful');
      
      // Test UPDATE
      console.log('   Testing UPDATE...');
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ status: 'connected' })
        .eq('id', inserted[0].id);

      if (updateError) {
        console.error('   ❌ UPDATE failed:', updateError.message);
      } else {
        console.log('   ✅ UPDATE successful');
      }

      // Test DELETE
      console.log('   Testing DELETE...');
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', inserted[0].id);

      if (deleteError) {
        console.error('   ❌ DELETE failed:', deleteError.message);
      } else {
        console.log('   ✅ DELETE successful');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabase().then(() => {
  console.log('\n✅ Database check complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
