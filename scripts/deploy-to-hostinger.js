#!/usr/bin/env node

/**
 * Deploy to Hostinger
 * 
 * This script copies the built files to the hostinger-deploy directory
 * for deployment to Hostinger hosting
 */

import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'dist';
const TARGET_DIR = 'hostinger-deploy';

async function copyFile(src, dest) {
  try {
    // Create directory if it doesn't exist
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${src}:`, error.message);
    return false;
  }
}

async function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error copying directory ${src}:`, error.message);
    return false;
  }
}

async function deployToHostinger() {
  console.log('🚀 ===== DEPLOYING TO HOSTINGER =====\n');
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    return;
  }
  
  if (!fs.existsSync(TARGET_DIR)) {
    console.error('❌ Hostinger deployment directory not found.');
    return;
  }
  
  try {
    console.log('📁 Copying built files...');
    
    // Copy all files from dist to hostinger-deploy
    const success = await copyDirectory(SOURCE_DIR, TARGET_DIR);
    
    if (success) {
      console.log('✅ Files copied successfully!');
      
      // Verify key files
      const keyFiles = [
        'index.html',
        'assets/index-CGwYnzpB.js',
        'assets/index-BWg_kOoW.css',
        'api/whatsapp-webhook.php',
        'api/whatsapp-proxy.php',
        'api/health.php'
      ];
      
      console.log('\n🔍 Verifying key files...');
      let allFilesExist = true;
      
      for (const file of keyFiles) {
        const filePath = path.join(TARGET_DIR, file);
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${file}`);
        } else {
          console.log(`❌ ${file} - Missing`);
          allFilesExist = false;
        }
      }
      
      if (allFilesExist) {
        console.log('\n🎉 Deployment ready!');
        console.log('\n📋 Next Steps:');
        console.log('1. Upload the contents of hostinger-deploy/ to your Hostinger public_html/ directory');
        console.log('2. Ensure the api/ directory is accessible');
        console.log('3. Test the webhook endpoints');
        console.log('4. Configure the Green API webhook manually');
        
        console.log('\n📊 Deployment Summary:');
        console.log(`✅ Source: ${SOURCE_DIR}/`);
        console.log(`✅ Target: ${TARGET_DIR}/`);
        console.log(`✅ Domain: https://inauzwa.store`);
        console.log(`✅ Webhook: https://inauzwa.store/api/whatsapp-webhook.php`);
        console.log(`✅ Proxy: https://inauzwa.store/api/whatsapp-proxy.php`);
      } else {
        console.log('\n⚠️ Some files are missing. Please check the build process.');
      }
    } else {
      console.log('❌ Failed to copy files.');
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

// Run the deployment
deployToHostinger().catch(console.error);
