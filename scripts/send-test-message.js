#!/usr/bin/env node

/**
 * Send Test WhatsApp Message
 * 
 * This script sends a test message to one of the allowed numbers.
 */

const instanceId = '7105284900';
const apiToken = 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294';
const apiUrl = 'https://7105.api.greenapi.com';

// Allowed numbers (from the quota response)
const allowedNumbers = [
  '254700000000@c.us',
  '254712345678@c.us', 
  '255746605561@c.us'
];

async function sendTestMessage() {
  console.log('📱 Sending Test WhatsApp Message...\n');

  // Use the first allowed number
  const targetNumber = allowedNumbers[0];
  const testMessage = {
    chatId: targetNumber,
    message: `🚀 Test message from LATS application\n\nThis is a test message sent at ${new Date().toLocaleString()}\n\nYour WhatsApp integration is working correctly!`
  };

  try {
    console.log(`📤 Sending message to: ${targetNumber}`);
    console.log(`📝 Message: ${testMessage.message}\n`);

    const response = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message sent successfully!');
      console.log('📋 Response:', data);
      
      if (data.idMessage) {
        console.log(`📨 Message ID: ${data.idMessage}`);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Message sending failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData}`);
      
      if (response.status === 466) {
        console.log('\n💡 This error indicates quota limits. You can only send messages to the allowed numbers.');
        console.log('📞 Allowed numbers:');
        allowedNumbers.forEach((number, index) => {
          console.log(`   ${index + 1}. ${number}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

// Run the script
sendTestMessage();
