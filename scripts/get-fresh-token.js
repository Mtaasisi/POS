/**
 * Get Fresh Green API Token
 * 
 * Since all existing tokens are returning 401, we need to:
 * 1. Check if the tokens have expired
 * 2. Generate a new token from Green API console
 * 3. Update the database with the new token
 */

console.log('🔑 Green API Token Resolution Guide');
console.log('==================================\n');

console.log('📋 Current Situation Analysis:');
console.log('❌ All existing tokens are returning 401 Unauthorized');
console.log('❌ Database shows instance as "authorized" but API rejects requests');
console.log('❌ This suggests the tokens have expired or been revoked\n');

console.log('🔧 Solutions to Try:\n');

console.log('1️⃣ IMMEDIATE FIX - Get New Token from Green API Console:');
console.log('   a) Go to: https://green-api.com/personal/');
console.log('   b) Login to your Green API account');
console.log('   c) Find your instance: 7105306911');
console.log('   d) Copy the current API token');
console.log('   e) If the instance is not authorized, scan the QR code');
console.log('   f) Update your .env file and database with the new token\n');

console.log('2️⃣ CHECK INSTANCE STATUS:');
console.log('   - Instance might be suspended or deactivated');
console.log('   - Check Green API console for any warnings');
console.log('   - Verify your Green API subscription is active\n');

console.log('3️⃣ TOKEN LOCATIONS TO UPDATE:');
console.log('   - File: public/api/config.php (Line 9)');
console.log('   - Database: whatsapp_instances_comprehensive table');
console.log('   - Environment variables if used\n');

console.log('4️⃣ WEBHOOK CONFIGURATION:');
console.log('   - Webhook URL: https://inauzwa.store/api/whatsapp-webhook.php');
console.log('   - Make sure webhooks are enabled in Green API console');
console.log('   - Check webhook logs: https://inauzwa.store/api/webhook_log.txt\n');

console.log('📞 After getting a fresh token, run this command:');
console.log('   node scripts/update-token.js YOUR_NEW_TOKEN\n');

console.log('🆘 If you need help:');
console.log('   1. Share your Green API console screenshot');
console.log('   2. Check if instance 7105306911 exists and is active');
console.log('   3. Verify your Green API subscription status');

// Create a simple token update script
const updateScript = `
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
`;

// Write the update script
import { writeFileSync } from 'fs';
writeFileSync('scripts/update-token.js', updateScript);

console.log('✅ Created scripts/update-token.js for easy token updating');
