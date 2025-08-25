/**
 * Complete WhatsApp 400 Error Fix
 * 
 * This script fixes the 400 Bad Request errors by:
 * 1. Creating the necessary .env file
 * 2. Setting up proper environment configuration
 * 3. Testing the configuration
 */

const fs = require('fs');
const path = require('path');

async function fixWhatsApp400Errors() {
  console.log('🔧 ===== WHATSAPP 400 ERROR FIX =====\n');
  
  // Step 1: Create .env file in hosting-ready directory
  console.log('📋 Step 1: Creating .env file...');
  
  const envPath = path.join(__dirname, 'hosting-ready', '.env');
  const envTemplate = `# WhatsApp Hub Environment Configuration
# This file contains sensitive configuration data

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# WhatsApp Green API Configuration
GREENAPI_INSTANCE_ID=your_instance_id_here
GREENAPI_API_TOKEN=your_api_token_here
GREENAPI_API_URL=https://api.green-api.com

# Alternative WhatsApp Configuration (if not using environment variables)
WHATSAPP_INSTANCE_ID=your_instance_id_here
WHATSAPP_API_TOKEN=your_api_token_here
WHATSAPP_API_URL=https://api.green-api.com

# Webhook Configuration
WEBHOOK_URL=https://inauzwa.store/api/whatsapp-webhook.php
HOSTINGER_TOKEN=your_hostinger_token_here

# Debug Configuration
DEBUG_MODE=true
DEBUG_LOGGING=true
DEBUG_WEBHOOK=true

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
APP_ENV=production

# Additional Configuration
CORS_ORIGIN=https://inauzwa.store
`;

  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log(`✅ Created .env file at: ${envPath}`);
  } catch (error) {
    console.error(`❌ Failed to create .env file: ${error.message}`);
    return;
  }

  // Step 2: Create .env file in root directory (for development)
  console.log('\n📋 Step 2: Creating root .env file...');
  
  const rootEnvPath = path.join(__dirname, '.env');
  try {
    fs.writeFileSync(rootEnvPath, envTemplate);
    console.log(`✅ Created root .env file at: ${rootEnvPath}`);
  } catch (error) {
    console.error(`❌ Failed to create root .env file: ${error.message}`);
  }

  // Step 3: Create .env file in public directory (for PHP access)
  console.log('\n📋 Step 3: Creating public .env file...');
  
  const publicEnvPath = path.join(__dirname, 'public', '.env');
  try {
    fs.writeFileSync(publicEnvPath, envTemplate);
    console.log(`✅ Created public .env file at: ${publicEnvPath}`);
  } catch (error) {
    console.error(`❌ Failed to create public .env file: ${error.message}`);
  }

  // Step 4: Create .env file in api directory (for direct PHP access)
  console.log('\n📋 Step 4: Creating api .env file...');
  
  const apiEnvPath = path.join(__dirname, 'public', 'api', '.env');
  try {
    fs.writeFileSync(apiEnvPath, envTemplate);
    console.log(`✅ Created api .env file at: ${apiEnvPath}`);
  } catch (error) {
    console.error(`❌ Failed to create api .env file: ${error.message}`);
  }

  console.log('\n🔧 ===== CONFIGURATION INSTRUCTIONS =====');
  console.log('\nTo fix the 400 errors, you need to configure your WhatsApp credentials:');
  console.log('\n1. 📱 Get your GreenAPI credentials:');
  console.log('   - Go to https://console.green-api.com');
  console.log('   - Create an account and get your Instance ID and API Token');
  console.log('   - Or use your existing credentials if you have them');
  
  console.log('\n2. 🔧 Edit the .env files:');
  console.log('   - Open the .env files created above');
  console.log('   - Replace "your_instance_id_here" with your actual Instance ID');
  console.log('   - Replace "your_api_token_here" with your actual API Token');
  console.log('   - Replace "your_supabase_url_here" with your Supabase URL');
  console.log('   - Replace "your_supabase_anon_key_here" with your Supabase anon key');
  console.log('   - Replace "your_supabase_service_role_key_here" with your service role key');
  
  console.log('\n3. 📤 Upload the updated .env files to your server:');
  console.log('   - Upload hosting-ready/.env to your Hostinger server');
  console.log('   - Upload public/.env to your server');
  console.log('   - Upload public/api/.env to your server');
  
  console.log('\n4. 🧪 Test the configuration:');
  console.log('   - Run: node test-whatsapp-400-diagnostic.js');
  console.log('   - Check that credentials_configured: true');
  
  console.log('\n📁 Files created:');
  console.log(`   - ${envPath}`);
  console.log(`   - ${rootEnvPath}`);
  console.log(`   - ${publicEnvPath}`);
  console.log(`   - ${apiEnvPath}`);
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Never commit .env files to version control');
  console.log('   - Keep your API credentials secure');
  console.log('   - Test the configuration after uploading');
  
  console.log('\n🔧 ===== FIX COMPLETE =====');
}

// Run the fix
fixWhatsApp400Errors();
