#!/usr/bin/env node

/**
 * Deploy Now - Immediate Hostinger Deployment
 * 
 * Opens Hostinger control panel and provides immediate deployment steps
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const HOSTINGER_TOKEN = 'Y4KH8ujuTT5yzjtBCvvDJnFkCew79ufTs3WgjoXI88d36146';
const WEBHOOK_URL = 'https://inauzwa.store/api/whatsapp-webhook.php';

async function deployNow() {
  console.log('🚀 ===== DEPLOY NOW - HOSTINGER =====\n');
  
  try {
    // Check deployment package
    const deployPath = path.join(process.cwd(), 'hostinger-deploy');
    if (!fs.existsSync(deployPath)) {
      console.error('❌ Deployment package not found!');
      console.log('💡 Run: node scripts/deploy-to-hostinger.js first');
      return;
    }
    
    const files = fs.readdirSync(deployPath);
    console.log(`✅ Found ${files.length} files ready for upload (${(getDirectorySize(deployPath) / 1024 / 1024).toFixed(2)} MB)`);
    
    // Open Hostinger control panel
    console.log('\n🌐 Opening Hostinger Control Panel...');
    try {
      execSync('open https://hpanel.hostinger.com', { stdio: 'inherit' });
      console.log('✅ Hostinger control panel opened in browser');
    } catch (error) {
      console.log('⚠️  Could not open browser automatically');
      console.log('📋 Please manually go to: https://hpanel.hostinger.com');
    }
    
    // Display immediate deployment steps
    console.log('\n=========================================');
    console.log('🎯 IMMEDIATE DEPLOYMENT STEPS');
    console.log('=========================================');
    console.log('');
    console.log('📋 STEP-BY-STEP DEPLOYMENT:');
    console.log('');
    console.log('1️⃣ LOGIN TO HOSTINGER');
    console.log('   • Go to: https://hpanel.hostinger.com');
    console.log('   • Login with your Hostinger account');
    console.log('   • Select your hosting plan');
    console.log('');
    console.log('2️⃣ ACCESS FILE MANAGER');
    console.log('   • Click "File Manager" in control panel');
    console.log('   • Navigate to "public_html" folder');
    console.log('   • This is your website root directory');
    console.log('');
    console.log('3️⃣ UPLOAD FILES');
    console.log('   • Click "Upload" button');
    console.log('   • Select all files from this folder:');
    console.log(`     ${deployPath}`);
    console.log('   • Upload to root of public_html');
    console.log('   • Maintain folder structure');
    console.log('');
    console.log('4️⃣ VERIFY UPLOAD');
    console.log('   • Check that all 24 files are uploaded');
    console.log('   • Verify .htaccess file is present');
    console.log('   • Confirm index.html is in root');
    console.log('');
    console.log('5️⃣ TEST APPLICATION');
    console.log('   • Access your domain in browser');
    console.log('   • Go to WhatsApp Hub → Settings');
    console.log('   • Configure webhook with token');
    console.log('');
    
    // Create deployment checklist
    createDeploymentChecklist(deployPath, files);
    
    console.log('🎉 DEPLOYMENT READY!');
    console.log('📱 Your WhatsApp Hub will be live after upload!');
    console.log('🔗 Webhook URL: ' + WEBHOOK_URL);
    console.log('🔑 Token: ' + HOSTINGER_TOKEN.substring(0, 10) + '...');
    console.log('');
    console.log('📞 Need help? Check the deployment checklist created!');
    
  } catch (error) {
    console.error('❌ Deploy now failed:', error.message);
  }
}

function createDeploymentChecklist(deployPath, files) {
  const checklist = `# Hostinger Deployment Checklist

## 🚀 IMMEDIATE DEPLOYMENT CHECKLIST

### 📋 Pre-Upload Checklist
- [ ] Hostinger control panel accessed
- [ ] File Manager opened
- [ ] public_html folder navigated
- [ ] Backup of existing files (if any)

### 📁 Files to Upload (${files.length} files)
Location: \`${deployPath}\`
Size: ${(getDirectorySize(deployPath) / 1024 / 1024).toFixed(2)} MB

**Core Files:**
- [ ] index.html
- [ ] .htaccess
- [ ] webhook-config.json
- [ ] assets/ (folder)
- [ ] brand-logos/ (folder)
- [ ] icons/ (folder)
- [ ] uploads/ (folder)

### 🔧 Upload Process
- [ ] All files uploaded to public_html root
- [ ] Folder structure maintained
- [ ] File permissions correct
- [ ] .htaccess file uploaded

### 🎯 Post-Upload Verification
- [ ] Application loads at domain
- [ ] WhatsApp Hub accessible
- [ ] All features working
- [ ] Error handler monitoring
- [ ] Webhook configuration ready

### 📱 WhatsApp Configuration
- [ ] Go to WhatsApp Hub → Settings
- [ ] Configure webhook URL: ${WEBHOOK_URL}
- [ ] Enter Hostinger token: ${HOSTINGER_TOKEN.substring(0, 10)}...
- [ ] Test webhook connectivity
- [ ] Verify WhatsApp integration

### 🔍 Troubleshooting
- [ ] Check browser console for errors
- [ ] Verify file permissions
- [ ] Test webhook endpoint
- [ ] Monitor error handler

### 🎉 Success Indicators
- [ ] Application loads successfully
- [ ] WhatsApp Hub shows 11 tabs
- [ ] Webhook configuration works
- [ ] Error handler shows no issues
- [ ] All features functioning

## 📞 Support
- Hostinger Support: https://support.hostinger.com
- WhatsApp Hub Error Handler: Built-in monitoring
- Deployment Status: Ready for production

**Status:** 🚀 **READY FOR DEPLOYMENT** - Follow checklist above!
`;

  fs.writeFileSync('hostinger-deploy/DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('✅ Created deployment checklist: hostinger-deploy/DEPLOYMENT_CHECKLIST.md');
}

function getDirectorySize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

// Run deploy now
deployNow().catch(console.error);
