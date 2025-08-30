
/**
 * Update WhatsApp API Token
 * Usage: node scripts/update-token.js YOUR_NEW_TOKEN
 */

import { createClient } from '@supabase/supabase-js';

const token = process.argv[2];
if (!token) {
  console.error('❌ Please provide a token: node scripts/update-token.js YOUR_TOKEN');
  process.exit(1);
}

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateToken() {
  console.log('🔄 Updating WhatsApp API token...');
  
  // Test the token first
  const testUrl = 'https://7105.api.greenapi.com/waInstance7105306911/getStateInstance/' + token;
  
  try {
    const response = await fetch(testUrl);
    console.log('📊 Token test result:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token is valid! Instance state:', data.stateInstance);
      
      // Update database
      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          api_token: token,
          state_instance: data.stateInstance,
          status: data.stateInstance === 'authorized' ? 'connected' : 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', '7105306911');
      
      if (error) {
        console.error('❌ Database update failed:', error);
      } else {
        console.log('✅ Database updated successfully!');
        console.log('🎉 Your WhatsApp integration should work now!');
      }
    } else {
      console.log('❌ Token is invalid. Please check Green API console.');
    }
  } catch (error) {
    console.error('❌ Error testing token:', error.message);
  }
}

updateToken();
