#!/usr/bin/env node

/**
 * WhatsApp Environment Configuration Helper
 * 
 * This script helps you configure the required environment variables
 * for the WhatsApp proxy to work properly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 WhatsApp Environment Configuration Helper\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ Found existing .env file');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for WhatsApp variables
  const hasGreenApiId = envContent.includes('GREENAPI_INSTANCE_ID=');
  const hasGreenApiToken = envContent.includes('GREENAPI_API_TOKEN=');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
  
  console.log('\n📋 Current Configuration Status:');
  console.log(`   GREENAPI_INSTANCE_ID: ${hasGreenApiId ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   GREENAPI_API_TOKEN: ${hasGreenApiToken ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   VITE_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅ Configured' : '❌ Missing'}`);
  
  if (hasGreenApiId && hasGreenApiToken && hasSupabaseUrl && hasServiceKey) {
    console.log('\n🎉 All required variables are configured!');
    console.log('   The WhatsApp proxy should work properly.');
  } else {
    console.log('\n⚠️  Some required variables are missing.');
    console.log('   Please configure them in your .env file or server environment.');
  }
} else {
  console.log('❌ No .env file found');
  console.log('   Creating template .env file...');
  
  const template = `# WhatsApp API Configuration
# Copy this file to .env and fill in your actual values

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# WhatsApp Configuration (REQUIRED)
GREENAPI_INSTANCE_ID=your_instance_id_here
GREENAPI_API_TOKEN=your_api_token_here
GREENAPI_API_URL=https://api.greenapi.com

# Supabase Service Role Key (REQUIRED for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Environment
APP_ENV=production

# Email Service (Optional)
VITE_EMAIL_API_KEY=your_email_api_key_here

# AI Services (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# PWA Configuration (Optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
`;

  fs.writeFileSync(envPath, template);
  console.log('✅ Created .env template file');
  console.log('   Please edit .env and add your actual values');
}

console.log('\n📖 Configuration Instructions:');
console.log('\n1. For WhatsApp API (GreenAPI):');
console.log('   - Go to https://console.green-api.com');
console.log('   - Create an instance or use existing one');
console.log('   - Copy the Instance ID and API Token');
console.log('   - Set GREENAPI_INSTANCE_ID and GREENAPI_API_TOKEN');

console.log('\n2. For Supabase Database:');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Select your project');
console.log('   - Go to Settings > API');
console.log('   - Copy Project URL and Service Role Key');
console.log('   - Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

console.log('\n3. For Server Deployment:');
console.log('   - Upload the .env file to your server');
console.log('   - Or configure environment variables in your hosting panel');
console.log('   - Make sure the PHP proxy can access these variables');

console.log('\n🧪 Testing:');
console.log('   After configuration, test with:');
console.log('   curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"action":"health"}\'');

console.log('\n📞 Need Help?');
console.log('   - Check the hosting provider documentation for environment variable setup');
console.log('   - Verify your GreenAPI credentials are active');
console.log('   - Ensure Supabase project is accessible from your server IP');
