#!/usr/bin/env node

/**
 * WhatsApp Rate Limit Clear Utility
 * 
 * This script helps clear rate limit states from localStorage
 * when experiencing persistent rate limiting issues.
 */

import fs from 'fs';
import path from 'path';

console.log('🧹 WhatsApp Rate Limit Clear Utility');
console.log('=====================================\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('Browser environment detected');
  
  try {
    // Clear rate limit related localStorage items
    localStorage.removeItem('whatsapp_rate_limit_backoff');
    localStorage.removeItem('whatsapp_last_error');
    localStorage.removeItem('whatsapp_error_count');
    localStorage.removeItem('whatsapp_connection_health');
    localStorage.removeItem('whatsapp_last_check');
    
    // Clear sessionStorage as well
    sessionStorage.removeItem('whatsapp_connection_health');
    
    console.log('✅ Successfully cleared WhatsApp rate limit state from localStorage');
    console.log('🔄 You can now refresh the page and try again');
    
  } catch (error) {
    console.error('❌ Error clearing rate limit state:', error.message);
  }
} else {
  console.log('Node.js environment detected');
  console.log('This script is designed to run in a browser environment.');
  console.log('To clear rate limit state:');
  console.log('1. Open your browser\'s developer console');
  console.log('2. Run the following commands:');
  console.log('');
  console.log('   localStorage.removeItem("whatsapp_rate_limit_backoff");');
  console.log('   localStorage.removeItem("whatsapp_last_error");');
  console.log('   localStorage.removeItem("whatsapp_error_count");');
  console.log('   localStorage.removeItem("whatsapp_connection_health");');
  console.log('   localStorage.removeItem("whatsapp_last_check");');
  console.log('   sessionStorage.removeItem("whatsapp_connection_health");');
  console.log('');
  console.log('3. Refresh the page');
}

console.log('\n📋 Rate Limit Prevention Tips:');
console.log('• Wait 30 minutes after rate limit errors before making new requests');
console.log('• Check your Green API dashboard for current usage');
console.log('• Consider upgrading your Green API plan if rate limits persist');
console.log('• Implement webhooks instead of polling when possible');
console.log('• Use aggressive caching to reduce API calls');
console.log('• Reduce connection check frequency');

console.log('\n🔗 Green API Dashboard: https://console.green-api.com/');
console.log('📚 Documentation: https://green-api.com/docs/');
