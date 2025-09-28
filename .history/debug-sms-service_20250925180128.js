// Debug SMS Service - Run this in browser console
// This will help identify what's causing the "Invalid Profile Id" error

async function debugSMSService() {
  console.log('🔍 Starting SMS Service Debug...');
  
  try {
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to access the SMS service
    console.log('🔍 Looking for SMS service...');
    
    // Check if we can import the service
    try {
      const { smsService } = await import('./src/services/smsService.ts');
      console.log('✅ SMS Service imported successfully');
      
      // Wait a bit more for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 SMS Service State:');
      console.log('   API Key:', smsService.apiKey || 'null');
      console.log('   API URL:', smsService.apiUrl || 'null');
      console.log('   API Password:', smsService.apiPassword || 'null');
      console.log('   Initialized:', smsService.initialized || 'false');
      
      // Test sending an SMS
      console.log('🧪 Testing SMS with test phone number...');
      const result = await smsService.sendSMS('255700000000', 'Debug test message');
      console.log('📱 Test SMS Result:', result);
      
    } catch (importError) {
      console.error('❌ Failed to import SMS service:', importError);
    }
    
    // Also check what's in localStorage/sessionStorage
    console.log('🔍 Browser Storage Check:');
    console.log('   Local Storage keys:', Object.keys(localStorage));
    console.log('   Session Storage keys:', Object.keys(sessionStorage));
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugSMSService();
