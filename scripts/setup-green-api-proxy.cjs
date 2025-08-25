#!/usr/bin/env node

/**
 * Green API Proxy Setup Script
 * This script helps configure the Green API proxy to fix CORS issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Green API Proxy Setup');
console.log('========================\n');

// Check if proxy files exist
const proxyFile = path.join(__dirname, '../public/api/green-api-proxy.php');
const testFile = path.join(__dirname, '../public/api/test-green-api-proxy.php');

console.log('📁 Checking proxy files...');

if (!fs.existsSync(proxyFile)) {
  console.log('❌ green-api-proxy.php not found');
  console.log('   Please ensure the proxy file is created in public/api/');
  process.exit(1);
}

if (!fs.existsSync(testFile)) {
  console.log('❌ test-green-api-proxy.php not found');
  console.log('   Please ensure the test file is created in public/api/');
  process.exit(1);
}

console.log('✅ Proxy files found\n');

// Check environment variables
console.log('🔑 Checking environment variables...');

const envVars = {
  GREENAPI_INSTANCE_ID: process.env.GREENAPI_INSTANCE_ID,
  GREENAPI_API_TOKEN: process.env.GREENAPI_API_TOKEN,
  GREENAPI_API_URL: process.env.GREENAPI_API_URL || 'https://api.green-api.com'
};

let allConfigured = true;

Object.entries(envVars).forEach(([key, value]) => {
  if (key === 'GREENAPI_API_URL') {
    console.log(`   ${key}: ${value || 'NOT_SET (using default)'}`);
  } else {
    const status = value ? '✅ Configured' : '❌ Missing';
    console.log(`   ${key}: ${status}`);
    if (!value) allConfigured = false;
  }
});

console.log('');

if (!allConfigured) {
  console.log('⚠️  Setup Instructions:');
  console.log('   1. Get your Green API credentials from https://console.green-api.com');
  console.log('   2. Set the following environment variables:');
  console.log('      - GREENAPI_INSTANCE_ID=your_instance_id');
  console.log('      - GREENAPI_API_TOKEN=your_api_token');
  console.log('      - GREENAPI_API_URL=https://api.green-api.com (optional)');
  console.log('   3. Restart your web server');
  console.log('   4. Test the configuration using /api/test-green-api-proxy.php');
  console.log('');
} else {
  console.log('✅ All environment variables are configured!');
  console.log('');
  console.log('🧪 Next Steps:');
  console.log('   1. Start your development server');
  console.log('   2. Visit /api/test-green-api-proxy.php to test the proxy');
  console.log('   3. Try sending a message in the WhatsApp Hub');
  console.log('   4. Check the browser console for any remaining errors');
  console.log('');
}

// Check if Green API service has been updated
console.log('🔍 Checking Green API service updates...');

const serviceFile = path.join(__dirname, '../src/services/greenApiService.ts');
if (fs.existsSync(serviceFile)) {
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  
  if (serviceContent.includes('/api/green-api-proxy.php')) {
    console.log('✅ Green API service has been updated to use proxy');
  } else {
    console.log('❌ Green API service needs to be updated');
    console.log('   The service should use /api/green-api-proxy.php instead of direct API calls');
  }
} else {
  console.log('❌ Green API service file not found');
}

console.log('');
console.log('📚 For more information, see GREEN_API_CORS_FIX.md');
console.log('');
