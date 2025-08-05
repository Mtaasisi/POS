#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Hostinger Configuration Setup');
console.log('================================\n');

// Check if .env.production exists
const envPath = path.join(__dirname, '.env.production');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  .env.production already exists');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('Setup cancelled.');
    }
    readline.close();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Creating .env.production file...\n');

  const envContent = `# Hostinger Configuration
# Get your API token from Hostinger control panel
VITE_HOSTINGER_API_TOKEN=your_hostinger_api_token_here

# Your Hostinger domain (e.g., yourdomain.com)
VITE_HOSTINGER_DOMAIN=yourdomain.com

# Supabase Configuration (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=Repair Shop Management
VITE_APP_VERSION=1.0.0
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.production file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Get your Hostinger API token from the control panel');
    console.log('2. Update VITE_HOSTINGER_API_TOKEN in .env.production');
    console.log('3. Set your domain in VITE_HOSTINGER_DOMAIN');
    console.log('4. Update your Supabase credentials');
    console.log('\n🔗 For detailed instructions, see: LOGO_UPLOAD_SETUP.md');
  } catch (error) {
    console.error('❌ Error creating .env.production file:', error.message);
  }
}

// Create a simple test script
function createTestScript() {
  const testScript = `#!/usr/bin/env node

import { hostingerUploadService } from './src/lib/hostingerUploadService.js';

console.log('🧪 Testing Hostinger Configuration...');

// Test configuration
console.log('\\n📋 Configuration Status:');
console.log('- Development Mode:', hostingerUploadService.isDevelopment());
console.log('- Hostinger Configured:', hostingerUploadService.isConfigured());

if (!hostingerUploadService.isDevelopment() && !hostingerUploadService.isConfigured()) {
  console.log('\\n⚠️  Warning: Hostinger not configured for production');
  console.log('Please set VITE_HOSTINGER_API_TOKEN and VITE_HOSTINGER_DOMAIN');
}

console.log('\\n✅ Test completed');
`;

  const testPath = path.join(__dirname, 'test-hostinger-config.mjs');
  try {
    fs.writeFileSync(testPath, testScript);
    console.log('\n✅ Test script created: test-hostinger-config.mjs');
    console.log('Run it with: node test-hostinger-config.mjs');
  } catch (error) {
    console.error('❌ Error creating test script:', error.message);
  }
}

// Create test script after env file
setTimeout(createTestScript, 1000); 