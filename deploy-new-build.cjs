#!/usr/bin/env node

/**
 * Deploy New Build Script
 * This script helps deploy the new build with debug logging to production
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Deploy New Build with Debug Logging');
console.log('=======================================\n');

// Check if dist folder exists
function checkBuildExists() {
  console.log('🔍 Checking build files...\n');
  
  const distPath = './dist';
  if (!fs.existsSync(distPath)) {
    console.log('❌ dist/ folder not found!');
    console.log('   Please run "npm run build" first');
    return false;
  }
  
  const requiredFiles = [
    'index.html',
    'assets/index-BtngQ0mj.js',
    'assets/index-D9X3EtCY.css',
    'api/whatsapp-proxy-forgiving.php',
    '.htaccess'
  ];
  
  console.log('📋 Checking required files:');
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    console.log('   Please run "npm run build" to generate all files');
    return false;
  }
  
  console.log('\n✅ All required files found!');
  return true;
}

// List all files in dist folder
function listDistFiles() {
  console.log('📁 Files in dist/ folder:\n');
  
  function listDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative('./dist', fullPath);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        console.log(`${prefix}📁 ${relativePath}/`);
        listDirectory(fullPath, prefix + '  ');
      } else {
        const size = (stats.size / 1024).toFixed(2);
        console.log(`${prefix}📄 ${relativePath} (${size} KB)`);
      }
    });
  }
  
  listDirectory('./dist');
}

// Generate upload instructions
function generateUploadInstructions() {
  console.log('\n📤 Upload Instructions');
  console.log('=====================\n');
  
  console.log('🔧 Method 1: FTP/SFTP Upload');
  console.log('1. Connect to your server via FTP/SFTP');
  console.log('2. Navigate to your web root directory');
  console.log('3. Upload the entire dist/ folder contents');
  console.log('4. Make sure to overwrite existing files');
  console.log('');
  
  console.log('🔧 Method 2: File Manager Upload');
  console.log('1. Open your hosting control panel');
  console.log('2. Go to File Manager');
  console.log('3. Navigate to your web root directory');
  console.log('4. Upload all files from the dist/ folder');
  console.log('5. Replace existing files when prompted');
  console.log('');
  
  console.log('🔧 Method 3: Command Line (if you have SSH access)');
  console.log('1. Use scp or rsync to upload files:');
  console.log('   scp -r dist/* user@your-server:/path/to/web/root/');
  console.log('   or');
  console.log('   rsync -avz dist/ user@your-server:/path/to/web/root/');
  console.log('');
  
  console.log('⚠️  Important Notes:');
  console.log('- Upload ALL files from the dist/ folder');
  console.log('- Make sure to include the .htaccess file');
  console.log('- Don\'t forget the api/ folder with the enhanced proxy');
  console.log('- The new index-BtngQ0mj.js contains debug logging');
  console.log('');
}

// Create verification script
function createVerificationScript() {
  const verificationScript = `#!/usr/bin/env node

/**
 * Verify New Build Deployment
 */

const BASE_URL = 'https://inauzwa.store';

async function verifyDeployment() {
  console.log('🔍 Verifying New Build Deployment...\\n');
  
  const filesToCheck = [
    { path: '/', name: 'Main HTML', expectedStatus: 200 },
    { path: '/assets/index-BtngQ0mj.js', name: 'Main JS Bundle', expectedStatus: 200 },
    { path: '/assets/index-D9X3EtCY.css', name: 'Main CSS Bundle', expectedStatus: 200 },
    { path: '/api/whatsapp-proxy-forgiving.php', name: 'WhatsApp Proxy', expectedStatus: 200 },
    { path: '/.htaccess', name: 'HTAccess File', expectedStatus: 200 }
  ];
  
  let allPassed = true;
  
  for (const file of filesToCheck) {
    try {
      const response = await fetch(\`\${BASE_URL}\${file.path}\`, {
        method: file.path === '/api/whatsapp-proxy-forgiving.php' ? 'POST' : 'GET',
        headers: file.path === '/api/whatsapp-proxy-forgiving.php' ? { 'Content-Type': 'application/json' } : {},
        body: file.path === '/api/whatsapp-proxy-forgiving.php' ? JSON.stringify({ action: 'health' }) : undefined
      });
      
      if (response.status === file.expectedStatus) {
        console.log(\`   ✅ \${file.name}: \${response.status}\`);
        if (file.path === '/assets/index-BtngQ0mj.js') {
          const size = response.headers.get('content-length');
          console.log(\`      📦 Size: \${(size / 1024 / 1024).toFixed(2)} MB\`);
        }
      } else {
        console.log(\`   ❌ \${file.name}: \${response.status} (expected \${file.expectedStatus})\`);
        allPassed = false;
      }
    } catch (error) {
      console.log(\`   ❌ \${file.name}: Error - \${error.message}\`);
      allPassed = false;
    }
  }
  
  console.log('\\n🎯 Deployment Verification Summary');
  console.log('==================================');
  if (allPassed) {
    console.log('✅ All files deployed successfully!');
    console.log('🚀 Your application with debug logging is now live!');
    console.log('\\n📝 Next Steps:');
    console.log('1. Test message sending in WhatsApp Hub');
    console.log('2. Monitor browser console for debug logs');
    console.log('3. Check server logs for backend debug information');
  } else {
    console.log('❌ Some files failed verification');
    console.log('🔧 Please check your upload and try again');
  }
}

verifyDeployment().catch(console.error);
`;

  fs.writeFileSync('verify-deployment.js', verificationScript);
  console.log('✅ Created verification script: verify-deployment.js');
  console.log('   Run this after uploading to verify deployment');
}

// Main execution
function main() {
  console.log('🔍 Analyzing build for deployment...\n');
  
  // Check if build exists
  if (!checkBuildExists()) {
    return;
  }
  
  // List files
  listDistFiles();
  
  // Generate instructions
  generateUploadInstructions();
  
  // Create verification script
  createVerificationScript();
  
  console.log('🎯 Deployment Summary');
  console.log('====================');
  console.log('✅ Build is ready for deployment');
  console.log('📋 Follow the upload instructions above');
  console.log('🔍 Use verify-deployment.js to check after upload');
  console.log('');
  console.log('🚀 Key Features in This Build:');
  console.log('- Enhanced debug logging for text message sending');
  console.log('- Comprehensive request tracking with unique IDs');
  console.log('- Performance monitoring and timing information');
  console.log('- Detailed error handling and context');
  console.log('- Backend API logging with request correlation');
  console.log('');
  console.log('📝 After deployment, test:');
  console.log('1. WhatsApp Hub → Messaging tab');
  console.log('2. Send a test message');
  console.log('3. Check browser console for debug logs');
  console.log('4. Monitor server logs for backend information');
}

main();
