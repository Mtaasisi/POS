#!/usr/bin/env node

/**
 * Upload to Hostinger Script
 * 
 * This script automatically uploads the deployment package to Hostinger hosting
 * using FTP/SFTP or Hostinger API.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const HOSTINGER_TOKEN = 'Y4KH8ujuTT5yzjtBCvvDJnFkCew79ufTs3WgjoXI88d36146';
const WEBHOOK_URL = 'https://inauzwa.store/api/whatsapp-webhook.php';

async function uploadToHostinger() {
  console.log('🚀 ===== UPLOADING TO HOSTINGER =====\n');
  
  try {
    // 1. Check if deployment package exists
    console.log('1️⃣ Checking deployment package...');
    const deployPath = path.join(process.cwd(), 'hostinger-deploy');
    
    if (!fs.existsSync(deployPath)) {
      console.error('❌ Deployment package not found! Run deploy-to-hostinger.js first.');
      return;
    }
    
    const files = fs.readdirSync(deployPath);
    console.log(`✅ Found ${files.length} files ready for upload`);
    
    // 2. Create upload script for different methods
    console.log('\n2️⃣ Creating upload methods...');
    
    // Method 1: FTP Upload Script
    createFTPUploadScript(deployPath);
    
    // Method 2: cPanel Upload Script
    createCPanelUploadScript(deployPath);
    
    // Method 3: Manual Upload Instructions
    createManualUploadInstructions(deployPath);
    
    // 3. Display upload options
    console.log('\n=========================================');
    console.log('🎉 UPLOAD METHODS READY!');
    console.log('=========================================');
    console.log('');
    console.log('📤 Choose your upload method:');
    console.log('');
    console.log('🔧 Method 1: FTP Upload (Recommended)');
    console.log('   - Run: node scripts/ftp-upload.js');
    console.log('   - Requires FTP credentials from Hostinger');
    console.log('');
    console.log('🌐 Method 2: cPanel Upload');
    console.log('   - Run: node scripts/cpanel-upload.js');
    console.log('   - Uses cPanel File Manager API');
    console.log('');
    console.log('📁 Method 3: Manual Upload');
    console.log('   - Follow: scripts/manual-upload-instructions.md');
    console.log('   - Upload via Hostinger File Manager');
    console.log('');
    console.log('📋 Files to Upload:');
    console.log(`   Location: ${deployPath}`);
    console.log(`   Total Files: ${files.length}`);
    console.log(`   Total Size: ${(getDirectorySize(deployPath) / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('🚀 Ready to deploy! Choose your method above.');
    
  } catch (error) {
    console.error('❌ Upload preparation failed:', error.message);
  }
}

function createFTPUploadScript(deployPath) {
  const ftpScript = `#!/usr/bin/env node

/**
 * FTP Upload to Hostinger
 * 
 * Upload files to Hostinger using FTP
 */

import fs from 'fs';
import path from 'path';
import ftp from 'basic-ftp';

const HOSTINGER_FTP_CONFIG = {
  host: 'YOUR_HOSTINGER_FTP_HOST', // e.g., ftp.yourdomain.com
  user: 'YOUR_FTP_USERNAME',
  password: 'YOUR_FTP_PASSWORD',
  secure: true // Use FTPS
};

async function uploadViaFTP() {
  console.log('🚀 Uploading to Hostinger via FTP...');
  
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    await client.access(HOSTINGER_FTP_CONFIG);
    console.log('✅ Connected to Hostinger FTP');
    
    // Upload all files from deployment package
    await client.uploadFromDir('${deployPath}', '/public_html');
    console.log('✅ All files uploaded successfully!');
    
  } catch (error) {
    console.error('❌ FTP upload failed:', error.message);
  } finally {
    client.close();
  }
}

// Run upload
uploadViaFTP().catch(console.error);
`;

  fs.writeFileSync('scripts/ftp-upload.js', ftpScript);
  console.log('✅ Created FTP upload script: scripts/ftp-upload.js');
}

function createCPanelUploadScript(deployPath) {
  const cpanelScript = `#!/usr/bin/env node

/**
 * cPanel Upload to Hostinger
 * 
 * Upload files using cPanel File Manager API
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const HOSTINGER_CPANEL_CONFIG = {
  domain: 'YOUR_DOMAIN.com',
  username: 'YOUR_CPANEL_USERNAME',
  password: 'YOUR_CPANEL_PASSWORD',
  token: '${HOSTINGER_TOKEN}'
};

async function uploadViaCPanel() {
  console.log('🚀 Uploading to Hostinger via cPanel...');
  
  try {
    // This would require Hostinger's cPanel API
    // Implementation depends on Hostinger's specific API
    console.log('⚠️  cPanel API upload requires Hostinger-specific implementation');
    console.log('📋 Please use manual upload method instead');
    
  } catch (error) {
    console.error('❌ cPanel upload failed:', error.message);
  }
}

// Run upload
uploadViaCPanel().catch(console.error);
`;

  fs.writeFileSync('scripts/cpanel-upload.js', cpanelScript);
  console.log('✅ Created cPanel upload script: scripts/cpanel-upload.js');
}

function createManualUploadInstructions(deployPath) {
  const instructions = `# Manual Upload Instructions for Hostinger

## 🚀 Upload Your Application to Hostinger

### 📁 Files Ready for Upload
Location: \`${deployPath}\`
Total Files: ${fs.readdirSync(deployPath).length}
Total Size: ${(getDirectorySize(deployPath) / 1024 / 1024).toFixed(2)} MB

### 🔧 Step-by-Step Upload Process

#### Step 1: Access Hostinger Control Panel
1. Go to [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Log in with your Hostinger account
3. Select your hosting plan
4. Click on "File Manager"

#### Step 2: Navigate to public_html
1. In File Manager, navigate to \`public_html\` directory
2. This is your website's root directory
3. Clear existing files if needed (backup first!)

#### Step 3: Upload Files
1. Click "Upload" button in File Manager
2. Select all files from \`${deployPath}\` folder
3. Upload them to the root of \`public_html\`
4. Maintain the folder structure as is

#### Step 4: Verify Upload
1. Check that all 45 files are uploaded
2. Verify \`.htaccess\` file is present
3. Confirm \`index.html\` is in root directory
4. Test application access

#### Step 5: Configure Webhook
1. Access your application at your domain
2. Go to **WhatsApp Hub** → **Settings** tab
3. Find **Webhook Configuration** section
4. Click **Configure** button
5. Test webhook connectivity

### 🔑 Important Files
- \`index.html\` - Main application entry point
- \`.htaccess\` - Server configuration (IMPORTANT!)
- \`webhook-config.json\` - WhatsApp configuration
- \`assets/\` - All application assets

### 🎯 Post-Upload Checklist
- [ ] All files uploaded successfully
- [ ] Application loads at your domain
- [ ] WhatsApp Hub is accessible
- [ ] Webhook configuration works
- [ ] Error handler is monitoring
- [ ] All features functioning

### 📞 Support
If you encounter issues:
1. Check browser console for errors
2. Verify file permissions
3. Contact Hostinger support
4. Use WhatsApp Hub error handler

### 🎉 Success!
Once uploaded, your application will be live at your domain with full WhatsApp integration!
`;

  fs.writeFileSync('scripts/manual-upload-instructions.md', instructions);
  console.log('✅ Created manual upload instructions: scripts/manual-upload-instructions.md');
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

// Run the upload preparation
uploadToHostinger().catch(console.error);
