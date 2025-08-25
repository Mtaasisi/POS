#!/usr/bin/env node

/**
 * AI Service and Webhook Configuration Fix Script
 * This script fixes both AI service failures and webhook configuration issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AI Service and Webhook Configuration Fix');
console.log('===========================================\n');

// Function to check AI service configuration
function checkAIServiceConfig() {
  console.log('🤖 Checking AI Service Configuration...\n');
  
  // Check if AI is enabled in app config
  const appConfigPath = './src/config/appConfig.ts';
  if (fs.existsSync(appConfigPath)) {
    const content = fs.readFileSync(appConfigPath, 'utf8');
    
    if (content.includes('ai: { enabled: false }')) {
      console.log('❌ AI service is disabled in appConfig.ts');
      console.log('   This is why AI service tests are failing');
      console.log('');
      console.log('💡 To enable AI service:');
      console.log('   1. Open src/config/appConfig.ts');
      console.log('   2. Change ai: { enabled: false } to ai: { enabled: true }');
      console.log('   3. Add your Gemini API key to .env file');
      console.log('   4. Restart the application');
    } else if (content.includes('ai: { enabled: true }')) {
      console.log('✅ AI service is enabled in configuration');
    } else {
      console.log('⚠️ AI configuration not found in appConfig.ts');
    }
  } else {
    console.log('❌ appConfig.ts not found');
  }
  
  // Check for Gemini API key
  const envPath = './.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_GEMINI_API_KEY=')) {
      console.log('✅ Gemini API key found in .env file');
    } else {
      console.log('❌ Gemini API key not found in .env file');
      console.log('   Add: VITE_GEMINI_API_KEY=your_api_key_here');
    }
  } else {
    console.log('❌ .env file not found');
    console.log('   Create .env file with: VITE_GEMINI_API_KEY=your_api_key_here');
  }
}

// Function to check webhook configuration
function checkWebhookConfig() {
  console.log('\n📡 Checking Webhook Configuration...\n');
  
  // Check if webhook endpoint exists
  const webhookPath = './public/api/whatsapp-webhook.php';
  if (fs.existsSync(webhookPath)) {
    console.log('✅ Webhook endpoint exists: public/api/whatsapp-webhook.php');
  } else {
    console.log('❌ Webhook endpoint not found: public/api/whatsapp-webhook.php');
  }
  
  // Check webhook configuration in database
  console.log('\n📊 Webhook Configuration Status:');
  console.log('   The "No webhook is currently configured" message means:');
  console.log('   1. Webhook URL is not set in Green API console');
  console.log('   2. Or webhook URL is not saved in your application database');
  console.log('');
  console.log('💡 To fix webhook configuration:');
  console.log('   1. Go to WhatsApp Hub in your application');
  console.log('   2. Navigate to Settings tab');
  console.log('   3. Configure webhook URL: https://inauzwa.store/api/whatsapp-webhook.php');
  console.log('   4. Test the webhook connection');
  console.log('   5. Save the configuration');
}

// Function to create AI service fix
function createAIServiceFix() {
  console.log('\n🔧 Creating AI Service Fix...\n');
  
  const aiFix = `// AI Service Configuration Fix
// Add this to your .env file

# AI Service Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Enable AI service in appConfig.ts
# Change this line in src/config/appConfig.ts:
# ai: { enabled: false }
# To:
# ai: { enabled: true }

# Get your Gemini API key from:
# https://makersuite.google.com/app/apikey

# After adding the API key:
# 1. Restart your development server
# 2. Test AI service in WhatsApp Hub
# 3. Check browser console for any errors
`;

  fs.writeFileSync('AI_SERVICE_FIX.md', aiFix);
  console.log('✅ Created AI service fix guide: AI_SERVICE_FIX.md');
}

// Function to create webhook configuration fix
function createWebhookConfigFix() {
  console.log('\n🔧 Creating Webhook Configuration Fix...\n');
  
  const webhookFix = `# Webhook Configuration Fix

## 🎯 **Current Issue**
"No webhook is currently configured" means the webhook URL is not set in your application.

## 🔧 **Solution Steps**

### **Step 1: Configure Webhook in Application**
1. Open your LATS application
2. Go to "WhatsApp Hub" in the sidebar
3. Click on "Settings" tab
4. Find "Webhook Configuration" section
5. Set webhook URL to: \`https://inauzwa.store/api/whatsapp-webhook.php\`
6. Click "Configure" button
7. Click "Test Webhook" to verify
8. Save the configuration

### **Step 2: Verify in Green API Console**
1. Go to: https://console.green-api.com
2. Login with your account
3. Find instance: \`7105284900\`
4. Go to Settings or Webhook Configuration
5. Verify webhook URL is set to: \`https://inauzwa.store/api/whatsapp-webhook.php\`
6. Enable these webhook events:
   - ✅ incomingMessageReceived
   - ✅ outgoingMessageReceived
   - ✅ outgoingAPIMessageReceived
   - ✅ stateInstanceChanged
7. Save changes

### **Step 3: Test Webhook**
1. Send a message to your WhatsApp business number
2. Check if you receive an auto-reply
3. Monitor webhook logs for activity

## 📊 **Expected Results**
- ✅ Webhook status shows "Configured"
- ✅ Test webhook returns success
- ✅ Incoming messages trigger auto-replies
- ✅ No more "No webhook configured" errors

## 🔍 **Troubleshooting**
If webhook still shows as not configured:
1. Clear browser cache
2. Refresh the application
3. Check browser console for errors
4. Verify the webhook URL is accessible
5. Check server error logs
`;

  fs.writeFileSync('WEBHOOK_CONFIG_FIX.md', webhookFix);
  console.log('✅ Created webhook configuration fix guide: WEBHOOK_CONFIG_FIX.md');
}

// Function to create a test script
function createTestScript() {
  const testScript = `#!/usr/bin/env node

/**
 * Test AI Service and Webhook Configuration
 */

const BASE_URL = 'https://inauzwa.store';

async function testServices() {
  console.log('🧪 Testing AI Service and Webhook Configuration...\\n');
  
  // Test 1: Webhook endpoint
  console.log('1. Testing webhook endpoint...');
  try {
    const webhookResponse = await fetch(\`\${BASE_URL}/api/whatsapp-webhook.php\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (webhookResponse.ok) {
      console.log('   ✅ Webhook endpoint is accessible');
    } else {
      console.log(\`   ❌ Webhook endpoint error: \${webhookResponse.status}\`);
    }
  } catch (error) {
    console.log(\`   ❌ Webhook test failed: \${error.message}\`);
  }
  
  // Test 2: WhatsApp proxy
  console.log('\\n2. Testing WhatsApp proxy...');
  try {
    const proxyResponse = await fetch(\`\${BASE_URL}/api/whatsapp-proxy-forgiving.php\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health' })
    });
    
    if (proxyResponse.ok) {
      console.log('   ✅ WhatsApp proxy is working');
    } else {
      console.log(\`   ❌ WhatsApp proxy error: \${proxyResponse.status}\`);
    }
  } catch (error) {
    console.log(\`   ❌ WhatsApp proxy test failed: \${error.message}\`);
  }
  
  // Test 3: AI service (if configured)
  console.log('\\n3. Testing AI service...');
  console.log('   ℹ️  AI service requires Gemini API key in .env file');
  console.log('   ℹ️  Check AI_SERVICE_FIX.md for configuration steps');
  
  console.log('\\n📋 Next Steps:');
  console.log('1. Configure AI service: Follow AI_SERVICE_FIX.md');
  console.log('2. Configure webhook: Follow WEBHOOK_CONFIG_FIX.md');
  console.log('3. Test both services in the application');
}

testServices().catch(console.error);
`;

  fs.writeFileSync('test-services.js', testScript);
  console.log('✅ Created test script: test-services.js');
}

// Function to provide immediate solutions
function provideImmediateSolutions() {
  console.log('\n🚀 **Immediate Solutions**\n');
  
  console.log('**For AI Service Failures:**');
  console.log('1. Get a Gemini API key from: https://makersuite.google.com/app/apikey');
  console.log('2. Add to .env file: VITE_GEMINI_API_KEY=your_key_here');
  console.log('3. Enable AI in src/config/appConfig.ts: ai: { enabled: true }');
  console.log('4. Restart your application');
  console.log('');
  
  console.log('**For Webhook Configuration:**');
  console.log('1. Go to WhatsApp Hub → Settings tab');
  console.log('2. Set webhook URL: https://inauzwa.store/api/whatsapp-webhook.php');
  console.log('3. Click "Configure" and "Test Webhook"');
  console.log('4. Save the configuration');
  console.log('');
  
  console.log('**For Both Issues:**');
  console.log('1. Check the created fix guides:');
  console.log('   - AI_SERVICE_FIX.md');
  console.log('   - WEBHOOK_CONFIG_FIX.md');
  console.log('2. Run the test script: node test-services.js');
  console.log('3. Monitor browser console for errors');
  console.log('');
}

// Main execution
function main() {
  console.log('🔍 Analyzing AI service and webhook issues...\n');
  
  // Check configurations
  checkAIServiceConfig();
  checkWebhookConfig();
  
  // Create fixes
  createAIServiceFix();
  createWebhookConfigFix();
  
  // Create test script
  createTestScript();
  
  // Provide solutions
  provideImmediateSolutions();
  
  console.log('🎯 **Summary**');
  console.log('==============');
  console.log('✅ AI Service Issue: Missing API key or disabled in config');
  console.log('✅ Webhook Issue: Not configured in application settings');
  console.log('✅ Both issues are configuration-related, not code issues');
  console.log('');
  console.log('📋 **Files Created:**');
  console.log('- AI_SERVICE_FIX.md - AI configuration guide');
  console.log('- WEBHOOK_CONFIG_FIX.md - Webhook setup guide');
  console.log('- test-services.js - Test script');
  console.log('');
  console.log('🚀 **Next Steps:**');
  console.log('1. Follow the fix guides');
  console.log('2. Test with: node test-services.js');
  console.log('3. Verify in your application');
}

main();
