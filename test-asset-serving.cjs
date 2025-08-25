#!/usr/bin/env node

const https = require('https');
const http = require('http');

const domain = 'inauzwa.store';
const assetPath = '/assets/index-i252VRQH.js';

console.log('🔍 Testing asset serving for WhatsApp Hub...\n');

// Test HTTPS
console.log('Testing HTTPS...');
testAsset(domain, assetPath, true);

// Test HTTP
console.log('\nTesting HTTP...');
testAsset(domain, assetPath, false);

function testAsset(host, path, useHttps) {
    const protocol = useHttps ? https : http;
    const url = `${useHttps ? 'https' : 'http'}://${host}${path}`;
    
    console.log(`  URL: ${url}`);
    
    const req = protocol.get(url, (res) => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if (res.statusCode === 200) {
            console.log('  ✅ Asset found and accessible!');
        } else if (res.statusCode === 404) {
            console.log('  ❌ Asset not found (404)');
        } else {
            console.log(`  ⚠️  Unexpected status: ${res.statusCode}`);
        }
        
        // Check if it's actually a JavaScript file
        const contentType = res.headers['content-type'];
        if (contentType && contentType.includes('javascript')) {
            console.log('  ✅ Correct content type (JavaScript)');
        } else {
            console.log(`  ⚠️  Unexpected content type: ${contentType}`);
        }
        
        console.log('');
    });
    
    req.on('error', (err) => {
        console.log(`  ❌ Error: ${err.message}`);
        console.log('');
    });
    
    req.setTimeout(10000, () => {
        console.log('  ⏰ Request timeout');
        req.destroy();
    });
}

// Also test the main page
console.log('Testing main page...');
testAsset(domain, '/', true);

console.log('\n📋 Next steps:');
console.log('1. Upload the updated .htaccess file to your Hostinger root directory');
console.log('2. If that doesn\'t work, try the simpler .htaccess.simple file');
console.log('3. Clear your browser cache and try again');
console.log('4. Check your Hostinger file manager to ensure assets/ directory exists');
