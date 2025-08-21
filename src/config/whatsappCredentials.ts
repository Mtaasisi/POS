// WhatsApp Green API Credentials Configuration
// This file contains the WhatsApp instance credentials for the LATS application

export const WHATSAPP_CREDENTIALS = {
  // Instance Configuration
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  
  // API URLs
  apiUrl: 'https://7105.api.greenapi.com',
  mediaUrl: 'https://7105.media.greenapi.com',
  
  // Instance Details
  name: 'Instance 7105284900',
  
  // Allowed Numbers (due to quota limits)
  allowedNumbers: [
    '254700000000@c.us',
    '254712345678@c.us', 
    '255746605561@c.us'
  ],
  
  // Status
  status: 'authorized' as const,
  
  // Quota Information
  quota: {
    monthlyLimit: 'Exceeded',
    upgradeRequired: true,
    upgradeUrl: 'https://console.green-api.com'
  }
};

// Helper function to check if a number is allowed
export const isNumberAllowed = (phoneNumber: string): boolean => {
  const formattedNumber = phoneNumber.includes('@c.us') 
    ? phoneNumber 
    : `${phoneNumber}@c.us`;
  
  return WHATSAPP_CREDENTIALS.allowedNumbers.includes(formattedNumber);
};

// Helper function to format phone number for WhatsApp
export const formatPhoneForWhatsApp = (phoneNumber: string): string => {
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
};

// Helper function to get API endpoint URL
export const getApiEndpoint = (endpoint: string): string => {
  return `${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/${endpoint}/${WHATSAPP_CREDENTIALS.apiToken}`;
};

// Export types
export type WhatsAppStatus = 'authorized' | 'notAuthorized' | 'blocked' | 'sleepMode' | 'starting';
