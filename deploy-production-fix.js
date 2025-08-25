#!/usr/bin/env node

/**
 * Production Deployment Fix Script
 * This script helps fix the static asset serving issue
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Deployment Fix Script');
console.log('====================================\n');

// Function to check if assets exist
function checkAssets() {
  console.log('📁 Checking built assets...\n');
  
  const distPath = './dist';
  const assetsPath = './dist/assets';
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ dist/ directory not found!');
    console.log('   Run "npm run build" first');
    return false;
  }
  
  if (!fs.existsSync(assetsPath)) {
    console.log('❌ dist/assets/ directory not found!');
    return false;
  }
  
  const assets = fs.readdirSync(assetsPath);
  console.log('✅ Found assets:');
  assets.forEach(asset => {
    const assetPath = path.join(assetsPath, asset);
    const stats = fs.statSync(assetPath);
    console.log(`   - ${asset} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  });
  
  return true;
}

// Function to create deployment instructions
function createDeploymentInstructions() {
  console.log('\n📋 Deployment Instructions:\n');
  
  console.log('1. **Upload all files from dist/ to your web server**');
  console.log('   Make sure to upload the entire dist/ folder structure:');
  console.log('   - dist/index.html');
  console.log('   - dist/assets/ (entire folder)');
  console.log('   - dist/api/ (entire folder)');
  console.log('   - dist/.htaccess');
  console.log('   - dist/_redirects');
  console.log('');
  
  console.log('2. **Server Configuration**');
  console.log('   Ensure your server is configured to serve static files:');
  console.log('   - Apache: Enable mod_rewrite');
  console.log('   - Nginx: Configure static file serving');
  console.log('   - Hostinger: Use the provided .htaccess file');
  console.log('');
  
  console.log('3. **File Permissions**');
  console.log('   Set correct permissions:');
  console.log('   - Directories: 755');
  console.log('   - Files: 644');
  console.log('   - .htaccess: 644');
  console.log('');
  
  console.log('4. **Base Path Configuration**');
  console.log('   If your app is not in the root directory, update vite.config.ts:');
  console.log('   export default defineConfig({');
  console.log('     base: "/your-subdirectory/",');
  console.log('     // ... other config');
  console.log('   })');
  console.log('');
}

// Function to create a test script
function createTestScript() {
  const testScript = `#!/usr/bin/env node

/**
 * Test script to verify production deployment
 */

const BASE_URL = 'https://inauzwa.store';

async function testProductionDeployment() {
  console.log('🧪 Testing Production Deployment...\\n');
  
  const tests = [
    {
      name: 'Main HTML File',
      url: '/',
      expectedStatus: 200
    },
    {
      name: 'Main JavaScript Bundle',
      url: '/assets/index-CZO1v-pa.js',
      expectedStatus: 200
    },
    {
      name: 'Main CSS Bundle',
      url: '/assets/index-D9X3EtCY.css',
      expectedStatus: 200
    },
    {
      name: 'WhatsApp Proxy Health',
      url: '/api/whatsapp-proxy-forgiving.php',
      method: 'POST',
      body: { action: 'health' },
      expectedStatus: 200
    }
  ];
  
  for (const test of tests) {
    console.log(\`Testing: \${test.name}\`);
    try {
      const options = {
        method: test.method || 'GET',
        headers: test.headers || {}
      };
      
      if (test.body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(\`\${BASE_URL}\${test.url}\`, options);
      
      if (response.status === test.expectedStatus) {
        console.log(\`  ✅ Success: \${response.status}\`);
        
        if (test.url.includes('.js') || test.url.includes('.css')) {
          const contentLength = response.headers.get('content-length');
          console.log(\`  📦 Size: \${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\`);
        }
      } else {
        console.log(\`  ❌ Failed: Expected \${test.expectedStatus}, got \${response.status}\`);
        console.log(\`  📄 Response: \${await response.text()}\`);
      }
    } catch (error) {
      console.log(\`  ❌ Error: \${error.message}\`);
    }
    console.log('');
  }
}

testProductionDeployment().catch(console.error);
`;

  fs.writeFileSync('test-production-deployment.js', testScript);
  console.log('✅ Created test script: test-production-deployment.js');
}

// Function to create a deployment checklist
function createDeploymentChecklist() {
  const checklist = `# Production Deployment Checklist

## Pre-Deployment
- [ ] Run \`npm run build\`
- [ ] Verify dist/ folder contains all assets
- [ ] Check that assets/ folder has all JavaScript and CSS files

## Upload Files
- [ ] Upload dist/index.html to web root
- [ ] Upload dist/assets/ folder to web root/assets/
- [ ] Upload dist/api/ folder to web root/api/
- [ ] Upload dist/.htaccess to web root
- [ ] Upload dist/_redirects to web root (if using Netlify)

## Server Configuration
- [ ] Verify .htaccess is being read by server
- [ ] Check that mod_rewrite is enabled (Apache)
- [ ] Ensure static file serving is configured
- [ ] Set correct file permissions (755 for dirs, 644 for files)

## Testing
- [ ] Test main page loads without errors
- [ ] Check browser console for 404 errors
- [ ] Verify WhatsApp proxy endpoints work
- [ ] Test all major application features

## Common Issues
- [ ] 404 errors on assets - Check file paths and permissions
- [ ] SPA routing not working - Verify .htaccess configuration
- [ ] API endpoints failing - Check server configuration
- [ ] CORS issues - Verify headers in .htaccess

## Troubleshooting
1. Check server error logs
2. Verify file permissions
3. Test with curl or Postman
4. Check browser Network tab for failed requests
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('✅ Created deployment checklist: DEPLOYMENT_CHECKLIST.md');
}

// Function to provide troubleshooting steps
function provideTroubleshootingSteps() {
  console.log('\n🔧 Troubleshooting Steps:\n');
  
  console.log('**If assets are returning 404:**');
  console.log('1. Check if files are uploaded to correct location');
  console.log('2. Verify file permissions (644 for files, 755 for directories)');
  console.log('3. Check server configuration for static file serving');
  console.log('4. Ensure .htaccess is being processed');
  console.log('');
  
  console.log('**If main page loads but assets fail:**');
  console.log('1. Check the Network tab in browser dev tools');
  console.log('2. Look for the exact URL that\'s failing');
  console.log('3. Verify the file exists at that path on the server');
  console.log('4. Check if there are any redirect rules interfering');
  console.log('');
  
  console.log('**If SPA routing doesn\'t work:**');
  console.log('1. Verify .htaccess is uploaded and being read');
  console.log('2. Check that mod_rewrite is enabled');
  console.log('3. Test with a direct URL to a route');
  console.log('4. Check server error logs');
  console.log('');
  
  console.log('**Quick Test Commands:**');
  console.log('curl -I https://inauzwa.store/assets/index-CZO1v-pa.js');
  console.log('curl -I https://inauzwa.store/');
  console.log('curl -X POST https://inauzwa.store/api/whatsapp-proxy-forgiving.php \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"action": "health"}\'');
}

// Main execution
async function main() {
  console.log('🔍 Starting deployment analysis...\n');
  
  // Check assets
  const assetsExist = checkAssets();
  
  if (!assetsExist) {
    console.log('\n❌ Cannot proceed without built assets');
    console.log('   Please run "npm run build" first');
    return;
  }
  
  // Create deployment instructions
  createDeploymentInstructions();
  
  // Create test script
  createTestScript();
  
  // Create deployment checklist
  createDeploymentChecklist();
  
  // Provide troubleshooting steps
  provideTroubleshootingSteps();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Follow the deployment instructions above');
  console.log('2. Upload all files from dist/ to your web server');
  console.log('3. Run the test script: node test-production-deployment.js');
  console.log('4. Check the deployment checklist: DEPLOYMENT_CHECKLIST.md');
  console.log('');
  console.log('📞 If you need help:');
  console.log('- Check server error logs');
  console.log('- Verify file permissions');
  console.log('- Test with curl commands');
  console.log('- Contact your hosting provider');
}

main().catch(console.error);
