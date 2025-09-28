/**
 * SMS Test API Endpoint
 * This can be used to test SMS functionality
 */

import { smsService } from '../services/smsService';

export async function testSMS(phone: string, message: string) {
  try {
    console.log('🧪 Testing SMS:', { phone, message });
    
    const result = await smsService.sendSMS(phone, message, { ai_enhanced: false });
    
    console.log('📱 SMS Test Result:', result);
    
    return {
      success: result.success,
      error: result.error,
      log_id: result.log_id
    };
  } catch (error) {
    console.error('❌ SMS Test Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Browser-compatible function for testing
if (typeof window !== 'undefined') {
  (window as any).testSMS = testSMS;
}
