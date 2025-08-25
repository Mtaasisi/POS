/**
 * WhatsApp Re-authorization Script
 * 
 * This script helps re-authorize your WhatsApp instance using QR codes
 * when the instance gets logged out or needs re-authorization
 */

const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function checkInstanceStatus() {
  console.log('🔍 Checking WhatsApp Instance Status...\n');
  
  try {
    const response = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    const data = await response.json();
    
    console.log('📱 Instance Status:', data);
    
    if (data.stateInstance === 'authorized') {
      console.log('✅ Instance is already authorized!');
      console.log('   No QR code needed at this time.');
      return false;
    } else {
      console.log('❌ Instance needs authorization');
      console.log('   Current state:', data.stateInstance);
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking instance status:', error.message);
    return true;
  }
}

async function logoutInstance() {
  console.log('🚪 Logging out WhatsApp instance...\n');
  
  try {
    const response = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/logout/${WHATSAPP_CREDENTIALS.apiToken}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    console.log('📤 Logout Result:', data);
    
    if (response.ok) {
      console.log('✅ Instance logged out successfully');
      return true;
    } else {
      console.log('❌ Failed to logout instance');
      return false;
    }
  } catch (error) {
    console.error('❌ Error logging out instance:', error.message);
    return false;
  }
}

async function getQRCode() {
  console.log('📱 Getting QR Code for WhatsApp Authorization...\n');
  
  try {
    const response = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/qr/${WHATSAPP_CREDENTIALS.apiToken}`);
    const data = await response.json();
    
    console.log('📋 QR Code Response:', data);
    
    if (data.type === 'qrCode') {
      console.log('✅ QR Code received successfully!');
      console.log('📱 Scan this QR code with WhatsApp Business app:');
      console.log('');
      console.log('🌐 Direct QR Code URL:');
      console.log(`https://qr.green-api.com/waInstance${WHATSAPP_CREDENTIALS.instanceId}/${WHATSAPP_CREDENTIALS.apiToken}`);
      console.log('');
      console.log('📝 Base64 QR Code (for custom display):');
      console.log(data.message);
      console.log('');
      console.log('⏰ QR Code expires in 20 seconds');
      console.log('🔄 Request new QR code if needed');
      return data.message;
    } else if (data.type === 'alreadyLogged') {
      console.log('✅ Instance is already authorized');
      return null;
    } else if (data.type === 'error') {
      console.log('❌ Error getting QR code:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting QR code:', error.message);
    return null;
  }
}

async function waitForAuthorization(maxAttempts = 60) {
  console.log('⏳ Waiting for WhatsApp authorization...\n');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
      const data = await response.json();
      
      console.log(`📱 Attempt ${attempt}/${maxAttempts}: ${data.stateInstance}`);
      
      if (data.stateInstance === 'authorized') {
        console.log('✅ WhatsApp instance authorized successfully!');
        return true;
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Error checking status (attempt ${attempt}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('⏰ Authorization timeout - please try again');
  return false;
}

async function main() {
  console.log('🚀 WhatsApp Re-authorization Tool\n');
  
  // Check current status
  const needsAuth = await checkInstanceStatus();
  
  if (!needsAuth) {
    console.log('\n💡 If you want to re-authorize anyway, run:');
    console.log('   node scripts/reauthorize-whatsapp.js --force');
    return;
  }
  
  // Ask user if they want to logout first
  const args = process.argv.slice(2);
  if (args.includes('--logout') || args.includes('--force')) {
    await logoutInstance();
    console.log('\n⏳ Waiting 3 seconds before getting QR code...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Get QR code
  const qrCode = await getQRCode();
  
  if (qrCode) {
    console.log('\n📱 Instructions:');
    console.log('1. Open WhatsApp Business app on your phone');
    console.log('2. Go to Settings > Linked Devices');
    console.log('3. Tap "Link a Device"');
    console.log('4. Scan the QR code above');
    console.log('5. Wait for authorization...');
    
    // Wait for authorization
    await waitForAuthorization();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkInstanceStatus,
  logoutInstance,
  getQRCode,
  waitForAuthorization
};
