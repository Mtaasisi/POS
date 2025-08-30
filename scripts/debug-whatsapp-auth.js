import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWhatsAppAuth() {
  console.log('🔍 Debugging WhatsApp Authentication Issues...\n');
  
  try {
    // Get all WhatsApp instances
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('instance_id, api_token, phone_number, status, state_instance, green_api_host')
      .order('created_at', { ascending: false });
    
    if (instancesError) {
      console.error('❌ Error fetching instances:', instancesError);
      return;
    }
    
    if (!instances || instances.length === 0) {
      console.log('⚠️ No WhatsApp instances found in database');
      return;
    }
    
    console.log(`📋 Found ${instances.length} WhatsApp instances:\n`);
    
    for (const instance of instances) {
      console.log(`🔍 Testing Instance: ${instance.instance_id}`);
      console.log(`   📱 Phone: ${instance.phone_number || 'Not set'}`);
      console.log(`   📊 Status: ${instance.status}`);
      console.log(`   🔐 State: ${instance.state_instance}`);
      console.log(`   🌐 Host: ${instance.green_api_host}`);
      console.log(`   🔑 API Token: ${instance.api_token ? `${instance.api_token.substring(0, 10)}...` : 'Missing'}`);
      
      // Test instance state
      try {
        const stateUrl = `${instance.green_api_host}/waInstance${instance.instance_id}/getStateInstance/${instance.api_token}`;
        console.log(`   🔗 Testing URL: ${stateUrl}`);
        
        const stateResponse = await fetch(stateUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const stateData = await stateResponse.json();
        console.log(`   📡 API Response Status: ${stateResponse.status}`);
        console.log(`   📝 API Response:`, stateData);
        
        if (stateResponse.ok && stateData.stateInstance) {
          const realState = stateData.stateInstance;
          const realStatus = realState === 'authorized' ? 'connected' : 
                           realState === 'notAuthorized' ? 'disconnected' : 
                           realState === 'blocked' ? 'error' : 'connecting';
          
          console.log(`   ✅ Instance state: ${realState} (should be: ${realStatus})`);
          
          if (instance.status !== realStatus) {
            console.log(`   🔄 Database status mismatch! DB: ${instance.status}, API: ${realStatus}`);
            
            // Update database with correct status
            const { error: updateError } = await supabase
              .from('whatsapp_instances_comprehensive')
              .update({ 
                status: realStatus,
                state_instance: realState,
                last_connected_at: realState === 'authorized' ? new Date().toISOString() : null
              })
              .eq('instance_id', instance.instance_id);
            
            if (updateError) {
              console.log(`   ❌ Failed to update status: ${updateError.message}`);
            } else {
              console.log(`   ✅ Updated database status to: ${realStatus}`);
            }
          }
          
          // If authorized, test sending a message
          if (realState === 'authorized') {
            console.log(`   📤 Testing message send capability...`);
            
            const testMessageUrl = `${instance.green_api_host}/waInstance${instance.instance_id}/sendMessage/${instance.api_token}`;
            const testMessageResponse = await fetch(testMessageUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                chatId: '255746605561@c.us', // Your test number
                message: 'Test message from debug script'
              })
            });
            
            const messageResult = await testMessageResponse.json();
            console.log(`   📨 Message test status: ${testMessageResponse.status}`);
            console.log(`   📨 Message response:`, messageResult);
            
            if (testMessageResponse.ok) {
              console.log(`   ✅ Message sending works!`);
            } else {
              console.log(`   ❌ Message sending failed: ${messageResult.message || 'Unknown error'}`);
            }
          } else {
            console.log(`   ⚠️ Instance not authorized - cannot send messages`);
            console.log(`   💡 Recommendation: Generate QR code and scan to authorize`);
          }
          
        } else {
          console.log(`   ❌ Failed to get instance state: ${stateData.message || 'Unknown error'}`);
          
          if (stateResponse.status === 401 || stateResponse.status === 403) {
            console.log(`   🔐 Authentication error - check API token`);
          } else if (stateResponse.status === 404) {
            console.log(`   🔍 Instance not found - check instance ID`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Network error testing instance:`, error.message);
      }
      
      console.log(''); // Empty line between instances
    }
    
    // Check for pending messages in queue
    const { data: queuedMessages, error: queueError } = await supabase
      .from('green_api_message_queue')
      .select('id, instance_id, chat_id, content, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!queueError && queuedMessages && queuedMessages.length > 0) {
      console.log(`📬 Found ${queuedMessages.length} pending messages in queue:`);
      queuedMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. Instance: ${msg.instance_id}, To: ${msg.chat_id}, Message: "${msg.content.substring(0, 50)}..."`);
      });
    } else {
      console.log('📭 No pending messages in queue');
    }
    
    console.log('\n🎉 Authentication debugging complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. For unauthorized instances: Generate and scan QR codes');
    console.log('   2. For auth errors: Verify API tokens are correct');
    console.log('   3. For network errors: Check Green API service status');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugWhatsAppAuth();
