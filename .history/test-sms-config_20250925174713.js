// Test SMS Configuration
// Run this in browser console to check SMS configuration

async function testSMSConfig() {
  console.log('🔧 Testing SMS Configuration...');
  
  try {
    // Import the SMS service
    const { smsService } = await import('./src/services/smsService.ts');
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to send a test SMS
    console.log('📱 Attempting to send test SMS...');
    const result = await smsService.sendSMS('255700000000', 'Test SMS from LATS CHANCE');
    
    if (result.success) {
      console.log('✅ SMS test successful!');
      console.log('📋 Result:', result);
    } else {
      console.log('❌ SMS test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ SMS configuration test error:', error);
  }
}

// Run the test
testSMSConfig();
