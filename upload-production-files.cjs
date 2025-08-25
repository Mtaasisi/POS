#!/usr/bin/env node

/**
 * Production File Upload Helper
 * This script helps ensure all files are uploaded correctly
 */

const fs = require('fs');
const path = require('path');

console.log('📤 Production File Upload Helper');
console.log('================================\n');

// Function to list all files that need to be uploaded
function listFilesToUpload() {
  console.log('📁 Files that need to be uploaded:\n');
  
  const distPath = './dist';
  const files = [];
  
  function scanDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(distPath, fullPath);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        console.log(`📂 ${prefix}${item}/`);
        scanDirectory(fullPath, prefix + '  ');
      } else {
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`📄 ${prefix}${item} (${size} MB)`);
        files.push({
          path: relativePath,
          size: stats.size,
          fullPath: fullPath
        });
      }
    }
  }
  
  scanDirectory(distPath);
  
  return files;
}

// Function to create upload instructions
function createUploadInstructions() {
  console.log('\n📋 Upload Instructions:\n');
  
  console.log('1. **Using File Manager (Recommended)**');
  console.log('   - Log into your hosting control panel');
  console.log('   - Navigate to File Manager');
  console.log('   - Go to your website root directory (usually public_html/)');
  console.log('   - Upload the entire dist/ folder contents');
  console.log('');
  
  console.log('2. **Using FTP/SFTP**');
  console.log('   - Connect to your server via FTP/SFTP');
  console.log('   - Navigate to your website root directory');
  console.log('   - Upload all files from the dist/ folder');
  console.log('');
  
  console.log('3. **File Structure on Server**');
  console.log('   Your server should have this structure:');
  console.log('   public_html/');
  console.log('   ├── index.html');
  console.log('   ├── .htaccess');
  console.log('   ├── _redirects');
  console.log('   ├── assets/');
  console.log('   │   ├── index-CZO1v-pa.js');
  console.log('   │   ├── index-D9X3EtCY.css');
  console.log('   │   └── ... (other assets)');
  console.log('   └── api/');
  console.log('       ├── whatsapp-proxy.php');
  console.log('       ├── whatsapp-proxy-forgiving.php');
  console.log('       └── ... (other API files)');
  console.log('');
  
  console.log('4. **Critical Files**');
  console.log('   These files MUST be uploaded:');
  console.log('   ✅ index.html (main HTML file)');
  console.log('   ✅ .htaccess (server configuration)');
  console.log('   ✅ assets/index-CZO1v-pa.js (main JavaScript - 2.75 MB)');
  console.log('   ✅ assets/index-D9X3EtCY.css (main CSS)');
  console.log('   ✅ api/whatsapp-proxy-forgiving.php (WhatsApp API)');
  console.log('');
}

// Function to create a verification script
function createVerificationScript() {
  const script = `#!/usr/bin/env node

/**
 * Verify Production Upload
 */

const BASE_URL = 'https://inauzwa.store';

async function verifyUpload() {
  console.log('🔍 Verifying Production Upload...\\n');
  
  const criticalFiles = [
    { name: 'Main HTML', url: '/', expectedStatus: 200 },
    { name: 'Main JS Bundle', url: '/assets/index-CZO1v-pa.js', expectedStatus: 200 },
    { name: 'Main CSS Bundle', url: '/assets/index-D9X3EtCY.css', expectedStatus: 200 },
    { name: 'WhatsApp Proxy', url: '/api/whatsapp-proxy-forgiving.php', method: 'POST', body: { action: 'health' }, expectedStatus: 200 }
  ];
  
  let allGood = true;
  
  for (const file of criticalFiles) {
    console.log(\`Checking: \${file.name}\`);
    try {
      const options = {
        method: file.method || 'GET',
        headers: file.headers || {}
      };
      
      if (file.body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(file.body);
      }
      
      const response = await fetch(\`\${BASE_URL}\${file.url}\`, options);
      
      if (response.status === file.expectedStatus) {
        console.log(\`  ✅ Success: \${response.status}\`);
        
        if (file.url.includes('.js') || file.url.includes('.css')) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const size = (contentLength / 1024 / 1024).toFixed(2);
            console.log(\`  📦 Size: \${size} MB\`);
          }
        }
      } else {
        console.log(\`  ❌ Failed: Expected \${file.expectedStatus}, got \${response.status}\`);
        allGood = false;
      }
    } catch (error) {
      console.log(\`  ❌ Error: \${error.message}\`);
      allGood = false;
    }
    console.log('');
  }
  
  if (allGood) {
    console.log('🎉 All files uploaded successfully!');
    console.log('✅ Your application should now work correctly.');
  } else {
    console.log('⚠️  Some files are missing or not accessible.');
    console.log('📋 Please check the upload instructions and try again.');
  }
}

verifyUpload().catch(console.error);
`;

  fs.writeFileSync('verify-upload.js', script);
  console.log('✅ Created verification script: verify-upload.js');
}

// Function to provide troubleshooting steps
function provideTroubleshootingSteps() {
  console.log('\n🔧 Troubleshooting:\n');
  
  console.log('**If you get 404 errors:**');
  console.log('1. Check if files are in the correct location on server');
  console.log('2. Verify file permissions (644 for files, 755 for directories)');
  console.log('3. Make sure .htaccess is uploaded and being read');
  console.log('4. Check server error logs');
  console.log('');
  
  console.log('**If the main page loads but assets fail:**');
  console.log('1. The assets/ folder might not be uploaded correctly');
  console.log('2. Check if the assets/ folder exists on the server');
  console.log('3. Verify all files in assets/ are uploaded');
  console.log('4. Check file permissions on the assets/ folder');
  console.log('');
  
  console.log('**If SPA routing doesn\'t work:**');
  console.log('1. Make sure .htaccess is uploaded to the root directory');
  console.log('2. Check that mod_rewrite is enabled on your server');
  console.log('3. Test with a direct URL to a route');
  console.log('');
  
  console.log('**Quick Commands to Test:**');
  console.log('curl -I https://inauzwa.store/assets/index-CZO1v-pa.js');
  console.log('curl -I https://inauzwa.store/');
  console.log('ls -la /path/to/your/web/root/assets/');
  console.log('');
}

// Main execution
function main() {
  console.log('🔍 Analyzing files to upload...\n');
  
  // List files
  const files = listFilesToUpload();
  
  // Create instructions
  createUploadInstructions();
  
  // Create verification script
  createVerificationScript();
  
  // Provide troubleshooting
  provideTroubleshootingSteps();
  
  console.log('🎯 Next Steps:');
  console.log('1. Upload all files from dist/ to your web server root');
  console.log('2. Make sure the assets/ folder is uploaded completely');
  console.log('3. Verify .htaccess is in the root directory');
  console.log('4. Run: node verify-upload.js');
  console.log('5. Test your application in the browser');
  console.log('');
  console.log('📞 Need help?');
  console.log('- Check your hosting provider\'s documentation');
  console.log('- Contact your hosting support');
  console.log('- Verify file permissions and server configuration');
}

main();
