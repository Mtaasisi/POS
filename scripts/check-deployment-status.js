#!/usr/bin/env node

import https from 'https';
import http from 'http';

const BASE_URL = 'https://inauzwa.store';

const routes = [
  '/',
  '/dashboard',
  '/login',
  '/favicon.ico'
];

async function checkRoute(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        error: err.message,
        status: 'ERROR'
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        status: 'TIMEOUT'
      });
    });
  });
}

async function checkAllRoutes() {
  console.log('🔍 Checking deployment status...\n');
  
  const results = [];
  
  for (const route of routes) {
    const fullUrl = `${BASE_URL}${route}`;
    console.log(`Checking: ${fullUrl}`);
    
    const result = await checkRoute(fullUrl);
    results.push(result);
    
    if (result.status === 200) {
      console.log(`✅ ${result.status} - ${route}`);
    } else if (result.status === 404) {
      console.log(`❌ ${result.status} - ${route} (Not Found)`);
    } else {
      console.log(`⚠️  ${result.status || result.error} - ${route}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Deployment Status Summary:');
  console.log('=============================');
  
  const working = results.filter(r => r.status === 200).length;
  const notFound = results.filter(r => r.status === 404).length;
  const errors = results.filter(r => r.status !== 200 && r.status !== 404).length;
  
  console.log(`✅ Working routes: ${working}/${routes.length}`);
  console.log(`❌ 404 errors: ${notFound}`);
  console.log(`⚠️  Other errors: ${errors}`);
  
  if (notFound > 0) {
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if Netlify deployment completed successfully');
    console.log('2. Verify netlify.toml configuration');
    console.log('3. Check if _redirects file is properly configured');
    console.log('4. Wait a few minutes for deployment to propagate');
  }
  
  if (working === routes.length) {
    console.log('\n🎉 All routes are working correctly!');
  }
}

checkAllRoutes().catch(console.error);
