#!/usr/bin/env node

/**
 * Green API Proxy Fix Script
 * This script helps diagnose and fix common Green API proxy issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Green API Proxy Fix Script');
console.log('==============================\n');

// Check if required files exist
const filesToCheck = [
  'netlify/functions/green-api-proxy.js',
  'public/api/green-api-proxy.php',
  'src/services/greenApiService.ts',
  'src/lib/greenApiProxy.ts'
];

console.log('📁 Checking required files...');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (!exists) {
    console.log(`   ⚠️  Missing file: ${file}`);
  }
});

console.log('\n🔍 Checking Netlify function configuration...');

// Check netlify.toml
const netlifyTomlPath = 'netlify.toml';
if (fs.existsSync(netlifyTomlPath)) {
  console.log('✅ netlify.toml exists');
  const netlifyConfig = fs.readFileSync(netlifyTomlPath, 'utf8');
  
  if (netlifyConfig.includes('[functions]')) {
    console.log('✅ Functions configuration found');
  } else {
    console.log('⚠️  Functions configuration missing in netlify.toml');
  }
} else {
  console.log('❌ netlify.toml missing');
}

// Check package.json for required dependencies
console.log('\n📦 Checking package.json dependencies...');
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = ['node-fetch'];
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`${hasDep ? '✅' : '❌'} ${dep}`);
  });
} else {
  console.log('❌ package.json not found');
}

// Check for environment variables
console.log('\n🔐 Checking environment variables...');
const envFiles = ['.env', '.env.local', '.env.development'];
envFiles.forEach(envFile => {
  const exists = fs.existsSync(envFile);
  console.log(`${exists ? '✅' : '❌'} ${envFile}`);
});

console.log('\n📋 Recommendations:');
console.log('==================');

console.log('1. If netlify.toml is missing, create it with:');
console.log(`
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/green-api-proxy"
  to = "/.netlify/functions/green-api-proxy"
  status = 200
`);

console.log('\n2. If node-fetch is missing, install it:');
console.log('   npm install node-fetch');

console.log('\n3. Ensure your Netlify site is properly deployed:');
console.log('   - Check Netlify dashboard for function deployment status');
console.log('   - Verify function logs in Netlify dashboard');

console.log('\n4. Test the proxy manually:');
console.log('   curl -X POST https://your-site.netlify.app/.netlify/functions/green-api-proxy \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"path":"/test","method":"GET"}\'');

console.log('\n5. Check browser console for CORS errors and network issues');

console.log('\n6. If using local development, start the dev proxy:');
console.log('   npm run dev:proxy');

console.log('\n✅ Fix script completed!');
console.log('Check the recommendations above and test your connection again.');
