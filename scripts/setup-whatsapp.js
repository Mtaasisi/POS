#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up WhatsApp Green API Integration...\n');

// Your Green API token
const GREEN_API_TOKEN = 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294';

// Environment variables to add
const envVars = `
# WhatsApp Green API Configuration
VITE_GREEN_API_TOKEN=${GREEN_API_TOKEN}
VITE_WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp-webhook
VITE_WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here
`;

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📝 Found existing .env file');
  
  // Read existing content
  const existingContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if WhatsApp config already exists
  if (existingContent.includes('VITE_GREEN_API_TOKEN')) {
    console.log('⚠️  WhatsApp configuration already exists in .env file');
    console.log('   Please update VITE_GREEN_API_TOKEN with your token if needed');
  } else {
    // Append new variables
    fs.appendFileSync(envPath, envVars);
    console.log('✅ Added WhatsApp configuration to existing .env file');
  }
} else {
  // Create new .env file
  fs.writeFileSync(envPath, envVars);
  console.log('✅ Created new .env file with WhatsApp configuration');
}

console.log('\n📋 Next Steps:');
console.log('1. Update VITE_WHATSAPP_WEBHOOK_URL with your actual webhook URL');
console.log('2. Set a secure VITE_WHATSAPP_WEBHOOK_SECRET');
console.log('3. Run: npx supabase db push');
console.log('4. Configure webhook in Green API dashboard');
console.log('5. Add WhatsApp page to your app routing');
console.log('6. Create your first WhatsApp instance');

console.log('\n🔗 Green API Dashboard: https://green-api.com');
console.log('📚 Documentation: docs/WHATSAPP_INTEGRATION.md');

console.log('\n🎉 Setup complete! Your token is configured.');
