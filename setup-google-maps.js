#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🗺️  Google Maps API Setup\n');

// Check if .env file exists
const envPath = path.join(path.dirname(__filename), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file found');
  
  // Read existing .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if VITE_GOOGLE_MAPS_API_KEY already exists
  if (envContent.includes('VITE_GOOGLE_MAPS_API_KEY')) {
    console.log('⚠️  VITE_GOOGLE_MAPS_API_KEY already exists in .env file');
    
    rl.question('Do you want to update it? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        promptForApiKey(envContent);
      } else {
        console.log('Setup cancelled.');
        rl.close();
      }
    });
  } else {
    promptForApiKey(envContent);
  }
} else {
  console.log('📝 Creating new .env file...');
  promptForApiKey('');
}

function promptForApiKey(existingContent) {
  console.log('\n📋 To get a Google Maps API key:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable "Maps JavaScript API"');
  console.log('4. Go to "Credentials" and create an API key');
  console.log('5. Copy the API key (starts with "AIza...")');
  console.log('');
  
  rl.question('Enter your Google Maps API key: ', (apiKey) => {
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API key cannot be empty');
      rl.close();
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      console.log('⚠️  Warning: API key should start with "AIza"');
      rl.question('Continue anyway? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          saveEnvFile(existingContent, apiKey.trim());
        } else {
          console.log('Setup cancelled.');
          rl.close();
        }
      });
    } else {
      saveEnvFile(existingContent, apiKey.trim());
    }
  });
}

function saveEnvFile(existingContent, apiKey) {
  let newContent = existingContent;
  
  // Remove existing VITE_GOOGLE_MAPS_API_KEY if it exists
  const lines = existingContent.split('\n').filter(line => 
    !line.startsWith('VITE_GOOGLE_MAPS_API_KEY=')
  );
  
  // Add new API key
  lines.push(`VITE_GOOGLE_MAPS_API_KEY=${apiKey}`);
  
  newContent = lines.join('\n');
  
  try {
    fs.writeFileSync(envPath, newContent);
    console.log('\n✅ .env file updated successfully!');
    console.log('🔑 API key saved: ' + apiKey.substring(0, 10) + '...');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Check the browser console for Google Maps messages');
    console.log('3. Test the map functionality');
    console.log('\n🔒 Security reminder:');
    console.log('- Never commit .env files to version control');
    console.log('- Restrict your API key to your domain in Google Cloud Console');
  } catch (error) {
    console.error('❌ Error saving .env file:', error.message);
  }
  
  rl.close();
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nSetup cancelled.');
  process.exit(0);
});
