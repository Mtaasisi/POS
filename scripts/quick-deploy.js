#!/usr/bin/env node

/**
 * Quick Deploy to Hostinger
 * 
 * Immediate deployment options for Hostinger hosting
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const HOSTINGER_TOKEN = 'Y4KH8ujuTT5yzjtBCvvDJnFkCew79ufTs3WgjoXI88d36146';
const WEBHOOK_URL = 'https://inauzwa.store/api/whatsapp-webhook.php';

async function quickDeploy() {
  console.log('🚀 ===== QUICK DEPLOY TO HOSTINGER =====\n');
  
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
    
    // Display immediate options
    console.log('\n=========================================');
    console.log('🎯 IMMEDIATE DEPLOYMENT OPTIONS');
    console.log('=========================================');
    console.log('');
    console.log('🚀 OPTION 1: Manual Upload (RECOMMENDED)');
    console.log('   📋 Steps:');
    console.log('   1. Go to https://hpanel.hostinger.com');
    console.log('   2. Login to your Hostinger account');
    console.log('   3. Click "File Manager"');
    console.log('   4. Navigate to public_html folder');
    console.log('   5. Upload all files from:');
    console.log(`      ${deployPath}`);
    console.log('');
    console.log('🔧 OPTION 2: FTP Upload');
    console.log('   📋 Steps:');
    console.log('   1. Get FTP credentials from Hostinger');
    console.log('   2. Edit scripts/ftp-upload.js');
    console.log('   3. Run: node scripts/ftp-upload.js');
    console.log('');
    console.log('📁 OPTION 3: Download & Upload');
    console.log('   📋 Steps:');
    console.log('   1. Download hostinger-deploy folder');
    console.log('   2. Upload via Hostinger File Manager');
    console.log('');
    
    // Create deployment summary
    createDeploymentSummary(deployPath, files);
    
    console.log('🎉 DEPLOYMENT READY!');
    console.log('📱 Your WhatsApp Hub will be live after upload!');
    console.log('🔗 Webhook URL: ' + WEBHOOK_URL);
    console.log('🔑 Token: ' + HOSTINGER_TOKEN.substring(0, 10) + '...');
    
  } catch (error) {
    console.error('❌ Quick deploy failed:', error.message);
  }
}

function createDeploymentSummary(deployPath, files) {
  const summary = {
    timestamp: new Date().toISOString(),
    status: 'ready_for_upload',
    files: {
      total: files.length,
      size: getDirectorySize(deployPath),
      location: deployPath
    },
    configuration: {
      webhookUrl: WEBHOOK_URL,
      hostingerToken: HOSTINGER_TOKEN.substring(0, 10) + '...',
      whatsappInstance: '7105284900'
    },
    uploadInstructions: {
      method1: 'Manual Upload via Hostinger File Manager',
      method2: 'FTP Upload using scripts/ftp-upload.js',
      method3: 'Download and upload manually'
    },
    postUploadSteps: [
      'Access your domain',
      'Go to WhatsApp Hub → Settings',
      'Configure webhook with token',
      'Test WhatsApp integration',
      'Monitor error handler'
    ]
  };
  
  fs.writeFileSync(
    path.join(deployPath, 'quick-deploy-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('✅ Created quick deployment summary');
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

// Run quick deploy
quickDeploy().catch(console.error);
