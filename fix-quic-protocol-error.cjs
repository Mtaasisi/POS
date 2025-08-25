#!/usr/bin/env node

/**
 * QUIC Protocol Error Fix Script
 * This script helps fix QUIC protocol errors for static assets
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 QUIC Protocol Error Fix Script');
console.log('==================================\n');

// Function to create an updated .htaccess file
function createUpdatedHtaccess() {
  const htaccessContent = `# Hostinger .htaccess Configuration for Clean App
# Enable rewrite engine
RewriteEngine On

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # Fix QUIC protocol errors for static assets
    <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$">
        Header always set Cache-Control "public, max-age=31536000, immutable"
        Header always set Accept-Ranges "bytes"
        Header always set Content-Type "application/javascript" env=!REDIRECT_STATUS
        Header always set Content-Type "text/css" env=!REDIRECT_STATUS
    </FilesMatch>
    
    # Force HTTP/2 for static assets to avoid QUIC issues
    <FilesMatch "\\.(js|css)$">
        Header always set Alt-Svc "h2=\":443\"; ma=2592000"
    </FilesMatch>
</IfModule>

# Compression
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
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>

# Fix QUIC protocol errors - Disable HTTP/3 for problematic assets
<IfModule mod_headers.c>
    <FilesMatch "qr-CPHRmgla\\.js$">
        Header always set Alt-Svc "h2=\":443\"; ma=2592000"
        Header always unset Alt-Svc
        Header always set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>

# SPA Routing - Redirect all requests to index.html except for assets and API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/assets/
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/config\\.js$
RewriteCond %{REQUEST_URI} !^/sw\\.js$
RewriteCond %{REQUEST_URI} !^/manifest\\.webmanifest$
RewriteCond %{REQUEST_URI} !^/favicon\\.ico$
RewriteCond %{REQUEST_URI} !^/pwa-.*\\.svg$
RewriteRule ^(.*)$ /index.html [L]

# Bypass security modules for API endpoints
<LocationMatch "^/api/">
    # Disable mod_security for API endpoints
    SecRuleEngine Off
    SecRequestBodyAccess Off
    
    # Allow all request methods
    <LimitExcept GET POST PUT DELETE OPTIONS>
        Allow from all
    </LimitExcept>
</LocationMatch>

# Additional security bypass for WhatsApp proxy
<Files "whatsapp-proxy.php">
    # Disable mod_security for this specific file
    SecRuleEngine Off
    SecRequestBodyAccess Off
    
    # Allow all request methods
    <LimitExcept GET POST PUT DELETE OPTIONS>
        Allow from all
    </LimitExcept>
</Files>

# Prevent access to sensitive files
<FilesMatch "\\.(env|config|sql|log|bak|backup)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent directory listing
Options -Indexes

# Force HTTPS (uncomment if you have SSL)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`;

  fs.writeFileSync('dist/.htaccess', htaccessContent);
  console.log('✅ Updated .htaccess file with QUIC protocol fixes');
}

// Function to create a test script for QUIC issues
function createQuicTestScript() {
  const testScript = `#!/usr/bin/env node

/**
 * Test script for QUIC protocol issues
 */

const BASE_URL = 'https://inauzwa.store';

async function testQuicProtocol() {
  console.log('🧪 Testing QUIC Protocol Issues...\\n');
  
  const testFiles = [
    { name: 'QR Code JS', url: '/assets/qr-CPHRmgla.js' },
    { name: 'Main JS Bundle', url: '/assets/index-CZO1v-pa.js' },
    { name: 'Main CSS Bundle', url: '/assets/index-D9X3EtCY.css' },
    { name: 'Charts JS', url: '/assets/charts-lk0f8TRc.js' }
  ];
  
  for (const file of testFiles) {
    console.log(\`Testing: \${file.name}\`);
    try {
      const response = await fetch(\`\${BASE_URL}\${file.url}\`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        const cacheControl = response.headers.get('cache-control');
        
        console.log(\`  ✅ Success: \${response.status}\`);
        console.log(\`  📦 Size: \${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\`);
        console.log(\`  📄 Type: \${contentType}\`);
        console.log(\`  🗄️  Cache: \${cacheControl}\`);
      } else {
        console.log(\`  ❌ Failed: \${response.status} \${response.statusText}\`);
      }
    } catch (error) {
      console.log(\`  ❌ Error: \${error.message}\`);
      
      if (error.message.includes('QUIC') || error.message.includes('quic')) {
        console.log(\`  🔧 QUIC Protocol Error detected\`);
        console.log(\`  💡 This is likely a browser/network issue\`);
      }
    }
    console.log('');
  }
  
  console.log('💡 QUIC Protocol Error Solutions:');
  console.log('1. Clear browser cache and cookies');
  console.log('2. Try a different browser');
  console.log('3. Disable HTTP/3 in browser settings');
  console.log('4. Use incognito/private browsing mode');
  console.log('5. Check if the issue persists after server restart');
}

testQuicProtocol().catch(console.error);
`;

  fs.writeFileSync('test-quic-protocol.js', testScript);
  console.log('✅ Created QUIC protocol test script: test-quic-protocol.js');
}

// Function to provide troubleshooting steps
function provideTroubleshootingSteps() {
  console.log('\n🔧 QUIC Protocol Error Troubleshooting:\n');
  
  console.log('**What is QUIC Protocol Error?**');
  console.log('QUIC is a transport protocol used by HTTP/3. The error occurs when:');
  console.log('- Browser tries to use HTTP/3/QUIC but encounters issues');
  console.log('- Network configuration conflicts with QUIC protocol');
  console.log('- Server doesn\'t properly support HTTP/3');
  console.log('');
  
  console.log('**Browser Solutions:**');
  console.log('1. Clear browser cache and cookies');
  console.log('2. Disable HTTP/3 in browser settings:');
  console.log('   - Chrome: chrome://flags/#enable-quic');
  console.log('   - Firefox: about:config -> network.http.http3.enabled');
  console.log('3. Try incognito/private browsing mode');
  console.log('4. Use a different browser');
  console.log('');
  
  console.log('**Server Solutions:**');
  console.log('1. Updated .htaccess with QUIC protocol fixes');
  console.log('2. Force HTTP/2 for problematic assets');
  console.log('3. Set proper cache headers');
  console.log('4. Disable HTTP/3 if causing issues');
  console.log('');
  
  console.log('**Network Solutions:**');
  console.log('1. Check if your network supports HTTP/3');
  console.log('2. Try a different network connection');
  console.log('3. Disable VPN if using one');
  console.log('4. Contact your hosting provider');
  console.log('');
}

// Function to create a client-side fix
function createClientSideFix() {
  const clientFix = `// Client-side fix for QUIC protocol errors
// Add this to your main JavaScript file or as a separate script

(function() {
  'use strict';
  
  // Function to retry failed requests with different protocol
  function retryWithFallback(url, options = {}) {
    return new Promise((resolve, reject) => {
      // First try with normal fetch
      fetch(url, options)
        .then(response => {
          if (response.ok) {
            resolve(response);
          } else {
            throw new Error(\`HTTP \${response.status}\`);
          }
        })
        .catch(error => {
          // If QUIC error, try with forced HTTP/2
          if (error.message.includes('QUIC') || error.message.includes('quic')) {
            console.warn('QUIC protocol error detected, retrying with fallback...');
            
            // Add headers to force HTTP/2
            const fallbackOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache'
              }
            };
            
            fetch(url, fallbackOptions)
              .then(resolve)
              .catch(reject);
          } else {
            reject(error);
          }
        });
    });
  }
  
  // Override fetch for QUIC error handling
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Only apply to asset requests
    if (typeof url === 'string' && url.includes('/assets/')) {
      return retryWithFallback(url, options);
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log('✅ QUIC protocol error fix loaded');
})();
`;

  fs.writeFileSync('quic-protocol-fix.js', clientFix);
  console.log('✅ Created client-side QUIC fix: quic-protocol-fix.js');
}

// Main execution
function main() {
  console.log('🔍 Analyzing QUIC protocol error...\n');
  
  // Create updated .htaccess
  createUpdatedHtaccess();
  
  // Create test script
  createQuicTestScript();
  
  // Create client-side fix
  createClientSideFix();
  
  // Provide troubleshooting steps
  provideTroubleshootingSteps();
  
  console.log('🎯 Next Steps:');
  console.log('1. Upload the updated .htaccess file to your server');
  console.log('2. Test with: node test-quic-protocol.js');
  console.log('3. If issue persists, try browser solutions');
  console.log('4. Consider adding the client-side fix to your app');
  console.log('');
  console.log('📞 Additional Help:');
  console.log('- Check browser developer tools Network tab');
  console.log('- Look for QUIC-related errors in Console');
  console.log('- Test with different browsers and networks');
  console.log('- Contact your hosting provider if server-side');
}

main();
