#!/usr/bin/env node

/**
 * Send Custom WhatsApp Message
 * 
 * This script allows you to send custom messages to specific numbers.
 * Usage: node scripts/send-custom-message.js [phoneNumber] [message]
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

function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (cleaned.startsWith('255')) {
    return `${cleaned}@c.us`;
  }
  
  // Add Tanzania country code if not present
  if (cleaned.startsWith('0')) {
    return `255${cleaned.substring(1)}@c.us`;
  }
  
  // If it's a 9-digit number, assume it's Tanzania
  if (cleaned.length === 9) {
    return `255${cleaned}@c.us`;
  }
  
  return `${cleaned}@c.us`;
}

function isNumberAllowed(phoneNumber) {
  return allowedNumbers.includes(phoneNumber);
}

async function sendCustomMessage(phoneNumber, message) {
  console.log('📱 Sending Custom WhatsApp Message...\n');

  // Format the phone number
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  // Check if number is allowed
  if (!isNumberAllowed(formattedNumber)) {
    console.log('❌ Error: This number is not allowed due to quota limits.');
    console.log('📞 Allowed numbers:');
    allowedNumbers.forEach((number, index) => {
      console.log(`   ${index + 1}. ${number}`);
    });
    console.log('\n💡 To send to any number, upgrade your Green API plan at: https://console.green-api.com');
    return;
  }

  const messageData = {
    chatId: formattedNumber,
    message: message
  };

  try {
    console.log(`📤 Sending message to: ${formattedNumber}`);
    console.log(`📝 Message: ${message}\n`);

    const response = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
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
    }

  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('📱 Custom WhatsApp Message Sender\n');
  console.log('Usage: node scripts/send-custom-message.js [phoneNumber] [message]');
  console.log('\nExamples:');
  console.log('  node scripts/send-custom-message.js 255746605561 "Hello from LATS!"');
  console.log('  node scripts/send-custom-message.js 254700000000 "Your order is ready!"');
  console.log('\n📞 Allowed numbers (due to quota limits):');
  allowedNumbers.forEach((number, index) => {
    console.log(`   ${index + 1}. ${number}`);
  });
  console.log('\n💡 To send to any number, upgrade your Green API plan at: https://console.green-api.com');
  process.exit(1);
}

const phoneNumber = args[0];
const message = args.slice(1).join(' ');

// Send the message
sendCustomMessage(phoneNumber, message);
