#!/usr/bin/env node

/**
 * Fix Hostinger 404 Error Script
 * 
 * This script fixes the 404 error on Hostinger by:
 * 1. Building the application correctly
 * 2. Ensuring proper SPA routing configuration
 * 3. Preparing files for Hostinger deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Hostinger 404 Error...\n');

// Step 1: Clean and rebuild
console.log('🔨 Step 1: Building application for Hostinger...');
try {
  // Remove existing builds
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
    console.log('✅ Cleaned existing build');
  }
  
  if (fs.existsSync('hostinger-deploy')) {
    execSync('rm -rf hostinger-deploy', { stdio: 'inherit' });
    console.log('✅ Cleaned existing hostinger-deploy');
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

// Step 2: Create hostinger-deploy directory
console.log('\n📁 Step 2: Preparing Hostinger deployment files...');
try {
  // Copy dist contents to hostinger-deploy
  execSync('cp -r dist hostinger-deploy', { stdio: 'inherit' });
  console.log('✅ Created hostinger-deploy directory');

  // Copy essential files
  const filesToCopy = [
    'public/_redirects',
    'public/favicon.ico',
    'public/manifest.json',
    'public/manifest.webmanifest',
    'public/pwa-192x192.svg',
    'public/pwa-512x512.svg'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      const destPath = path.join('hostinger-deploy', path.basename(file));
      execSync(`cp "${file}" "${destPath}"`, { stdio: 'inherit' });
      console.log(`✅ Copied ${file}`);
    }
  });

} catch (error) {
  console.error('❌ Failed to prepare deployment files:', error.message);
  process.exit(1);
}

// Step 3: Create/update .htaccess file
console.log('\n🔧 Step 3: Creating .htaccess for SPA routing...');
const htaccessContent = `# Hostinger .htaccess Configuration for SPA Routing

# Enable CORS for webhook
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Hostinger-Token"
</IfModule>

# Handle SPA routing - CRUCIAL FOR REACT ROUTER
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Handle static files first
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
    
    # Handle directories
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # All other requests go to index.html for SPA routing
    RewriteRule ^ index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Compress files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Force HTTPS (uncomment if you have SSL)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`;

try {
  fs.writeFileSync('hostinger-deploy/.htaccess', htaccessContent);
  console.log('✅ Created .htaccess file with SPA routing');
} catch (error) {
  console.error('❌ Failed to create .htaccess:', error.message);
  process.exit(1);
}

// Step 4: Create _redirects file
console.log('\n📋 Step 4: Creating _redirects file...');
const redirectsContent = `/*    /index.html   200`;
try {
  fs.writeFileSync('hostinger-deploy/_redirects', redirectsContent);
  console.log('✅ Created _redirects file');
} catch (error) {
  console.error('❌ Failed to create _redirects:', error.message);
  process.exit(1);
}

// Step 5: Verify deployment files
console.log('\n🔍 Step 5: Verifying deployment files...');
const requiredFiles = [
  'hostinger-deploy/index.html',
  'hostinger-deploy/.htaccess',
  'hostinger-deploy/_redirects',
  'hostinger-deploy/assets'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('❌ Some required files are missing!');
  process.exit(1);
}

// Step 6: Create deployment summary
console.log('\n📊 Step 6: Creating deployment summary...');
const deploymentSummary = {
  timestamp: new Date().toISOString(),
  status: 'ready',
  files: {
    total: fs.readdirSync('hostinger-deploy').length,
    indexHtml: fs.existsSync('hostinger-deploy/index.html'),
    htaccess: fs.existsSync('hostinger-deploy/.htaccess'),
    redirects: fs.existsSync('hostinger-deploy/_redirects'),
    assets: fs.existsSync('hostinger-deploy/assets')
  },
  spaRouting: {
    configured: true,
    method: 'htaccess + _redirects'
  }
};

try {
  fs.writeFileSync('hostinger-deploy/deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));
  console.log('✅ Created deployment summary');
} catch (error) {
  console.error('❌ Failed to create deployment summary:', error.message);
}

console.log('\n🎉 Hostinger deployment files prepared successfully!');
console.log('\n📋 Next steps:');
console.log('1. Upload ALL files from hostinger-deploy/ to your Hostinger public_html directory');
console.log('2. Ensure .htaccess is uploaded (it might be hidden)');
console.log('3. Wait 2-3 minutes for changes to propagate');
console.log('4. Test these URLs:');
console.log('   - https://inauzwa.store/');
console.log('   - https://inauzwa.store/dashboard');
console.log('   - https://inauzwa.store/devices');
console.log('   - https://inauzwa.store/customers');
console.log('\n💡 If still having issues:');
console.log('- Check Hostinger file manager for .htaccess file');
console.log('- Ensure mod_rewrite is enabled on your hosting');
console.log('- Clear browser cache and try again');
console.log('- Check Hostinger error logs');

console.log('\n✅ Hostinger 404 error fix completed!');
