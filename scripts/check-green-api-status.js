const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

const ALLOWED_NUMBERS = [
  '255746605561@c.us',
  '255746605561@s.whatsapp.net'
];

async function checkGreenAPIStatus() {
  console.log('🔍 Checking Green API Status...\n');
  
  try {
    // Check instance status
    const statusResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    const statusData = await statusResponse.json();
    
    console.log('📱 Instance Status:', statusData);
    
    // Check allowed numbers
    const allowedResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getAllowedNumbers/${WHATSAPP_CREDENTIALS.apiToken}`);
    const allowedData = await allowedResponse.json();
    
    console.log('\n📋 Allowed Numbers:', allowedData);
    
    // Check if your number is in allowed list
    const yourNumber = '255746605561@c.us';
    const isAllowed = allowedData.allowedNumbers?.some(num => num.includes('255746605561'));
    
    console.log(`\n✅ Your number (${yourNumber}) is ${isAllowed ? 'ALLOWED' : 'NOT ALLOWED'}`);
    
    if (!isAllowed) {
      console.log('❌ This is why you\'re not receiving messages!');
      console.log('🔧 You need to add your number to the allowed list in Green API console.');
    }
    
  } catch (error) {
    console.error('❌ Error checking Green API status:', error.message);
  }
}

checkGreenAPIStatus().catch(console.error);
