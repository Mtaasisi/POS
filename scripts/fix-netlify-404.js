#!/usr/bin/env node

/**
 * Fix Netlify 404 Error Script
 * 
 * This script fixes the 404 error on Netlify by:
 * 1. Ensuring proper SPA redirect configuration
 * 2. Building the application correctly
 * 3. Deploying with the updated configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Netlify 404 Error...\n');

// Step 1: Verify netlify.toml configuration
console.log('📋 Step 1: Verifying Netlify configuration...');
const netlifyConfigPath = path.join(process.cwd(), 'netlify.toml');

if (!fs.existsSync(netlifyConfigPath)) {
  console.error('❌ netlify.toml not found!');
  process.exit(1);
}

const netlifyConfig = fs.readFileSync(netlifyConfigPath, 'utf8');

// Check if SPA redirect rule exists
if (!netlifyConfig.includes('from = "/*"') || !netlifyConfig.includes('to = "/index.html"')) {
  console.error('❌ SPA redirect rule missing from netlify.toml!');
  console.log('Please ensure the following rule exists:');
  console.log('[[redirects]]');
  console.log('  from = "/*"');
  console.log('  to = "/index.html"');
  console.log('  status = 200');
  process.exit(1);
}

console.log('✅ Netlify configuration verified');

// Step 2: Clean and rebuild
console.log('\n🔨 Step 2: Cleaning and rebuilding application...');
try {
  // Remove existing build
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
    console.log('✅ Cleaned existing build');
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify build output
console.log('\n🔍 Step 3: Verifying build output...');
const distPath = path.join(process.cwd(), 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(distPath)) {
  console.error('❌ Build output directory not found!');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in build output!');
  process.exit(1);
}

console.log('✅ Build output verified');

// Step 4: Check for Netlify CLI
console.log('\n📋 Step 4: Checking Netlify CLI...');
try {
  execSync('netlify --version', { stdio: 'pipe' });
  console.log('✅ Netlify CLI found');
} catch (error) {
  console.log('📦 Installing Netlify CLI...');
  try {
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    console.log('✅ Netlify CLI installed');
  } catch (installError) {
    console.error('❌ Failed to install Netlify CLI:', installError.message);
    console.log('\n💡 Manual installation required:');
    console.log('npm install -g netlify-cli');
    process.exit(1);
  }
}

// Step 5: Deploy to Netlify
console.log('\n🚀 Step 5: Deploying to Netlify...');
try {
  console.log('Deploying with updated configuration...');
  execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
  console.log('\n🎉 Deployment completed successfully!');
  
  console.log('\n📋 Next steps:');
  console.log('1. Wait 2-3 minutes for deployment to propagate');
  console.log('2. Clear your browser cache');
  console.log('3. Try accessing https://inauzwa.store/dashboard');
  console.log('4. If still having issues, check Netlify dashboard for deployment status');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n💡 Alternative deployment methods:');
  console.log('1. Use Netlify dashboard to trigger a new deployment');
  console.log('2. Push changes to your connected Git repository');
  console.log('3. Run: netlify deploy --prod --dir=dist --message="Fix 404 error"');
  process.exit(1);
}

console.log('\n✅ Netlify 404 error fix completed!');
