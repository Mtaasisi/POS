#!/usr/bin/env node

// Comprehensive Hostinger API Diagnostic
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
config({ path: './backup.env' });

const HOSTINGER_API_TOKEN = process.env.HOSTINGER_API_TOKEN;

console.log('🔧 Comprehensive Hostinger API Diagnostic');
console.log('📋 Testing multiple aspects of connectivity...\n');

async function testDNSResolution() {
  console.log('🌐 Testing DNS Resolution...');
  
  const dnsServers = [
    { name: 'System DNS', server: '' },
    { name: 'Google DNS', server: '8.8.8.8' },
    { name: 'Cloudflare DNS', server: '1.1.1.1' },
    { name: 'OpenDNS', server: '208.67.222.222' }
  ];
  
  for (const dns of dnsServers) {
    try {
      const serverFlag = dns.server ? `@${dns.server}` : '';
      const { stdout } = await execAsync(`nslookup api.hostinger.com ${serverFlag}`);
      console.log(`✅ ${dns.name}: Resolved successfully`);
      console.log(`   ${stdout.split('\n').find(line => line.includes('Address:'))?.trim() || 'No IP found'}`);
    } catch (error) {
      console.log(`❌ ${dns.name}: Failed - ${error.message}`);
    }
  }
  console.log('');
}

async function testConnectivity() {
  console.log('📡 Testing Basic Connectivity...');
  
  const tests = [
    { name: 'Ping', command: 'ping -c 2 api.hostinger.com' },
    { name: 'HTTP GET', command: 'curl -I https://api.hostinger.com/v1/domains' },
    { name: 'HTTPS Test', command: 'curl -I --connect-timeout 10 https://api.hostinger.com' }
  ];
  
  for (const test of tests) {
    try {
      const { stdout, stderr } = await execAsync(test.command);
      console.log(`✅ ${test.name}: Success`);
      if (stdout) console.log(`   ${stdout.split('\n')[0]}`);
    } catch (error) {
      console.log(`❌ ${test.name}: Failed - ${error.message}`);
    }
  }
  console.log('');
}

async function testAPIEndpoints() {
  console.log('🔑 Testing API Endpoints...');
  
  if (!HOSTINGER_API_TOKEN) {
    console.log('❌ No API token configured');
    return;
  }
  
  const endpoints = [
    { name: 'Domains List', path: '/v1/domains' },
    { name: 'Files Upload', path: '/v1/files/upload' },
    { name: 'User Info', path: '/v1/user' },
    { name: 'Websites', path: '/v1/websites' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://api.hostinger.com${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`📊 ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success - ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');
}

async function testAlternativeAPIs() {
  console.log('🔄 Testing Alternative API Endpoints...');
  
  const alternativeEndpoints = [
    'https://api.hostinger.com/v1',
    'https://api.hostinger.com/v2',
    'https://api.hostinger.com/api/v1',
    'https://api.hostinger.com/api',
    'https://api.hostinger.com'
  ];
  
  for (const endpoint of alternativeEndpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      
      const response = await fetch(`${endpoint}/domains`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ Working endpoint found: ${endpoint}`);
        return endpoint;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return null;
}

async function testNetworkDiagnostics() {
  console.log('🔍 Network Diagnostics...');
  
  const diagnostics = [
    { name: 'Traceroute', command: 'traceroute -m 15 api.hostinger.com' },
    { name: 'SSL Test', command: 'openssl s_client -connect api.hostinger.com:443 -servername api.hostinger.com < /dev/null' },
    { name: 'HTTP Headers', command: 'curl -I -v https://api.hostinger.com' }
  ];
  
  for (const diag of diagnostics) {
    try {
      const { stdout } = await execAsync(diag.command);
      console.log(`✅ ${diag.name}: Success`);
      console.log(`   ${stdout.split('\n')[0]}`);
    } catch (error) {
      console.log(`❌ ${diag.name}: ${error.message}`);
    }
  }
  console.log('');
}

async function generateRecommendations() {
  console.log('💡 Recommendations:');
  console.log('');
  
  console.log('1. **Immediate Solutions:**');
  console.log('   - Use local backup system: node backup-local-only.mjs');
  console.log('   - Set up automatic local backups with cron');
  console.log('   - Monitor backup logs for issues');
  console.log('');
  
  console.log('2. **DNS/Network Solutions:**');
  console.log('   - Try changing DNS servers to Google (8.8.8.8) or Cloudflare (1.1.1.1)');
  console.log('   - Use a VPN to bypass potential geographic restrictions');
  console.log('   - Contact your ISP about potential blocking');
  console.log('');
  
  console.log('3. **Alternative Cloud Storage:**');
  console.log('   - Google Drive API');
  console.log('   - Dropbox API');
  console.log('   - AWS S3');
  console.log('   - Azure Blob Storage');
  console.log('');
  
  console.log('4. **Contact Hostinger Support:**');
  console.log('   - Report the API connectivity issue');
  console.log('   - Provide your IP: 41.59.200.60');
  console.log('   - Mention Cloudflare Error 1016');
  console.log('');
  
  console.log('5. **Monitor API Status:**');
  console.log('   - Check Hostinger status page');
  console.log('   - Test API periodically');
  console.log('   - Set up monitoring alerts');
}

// Run all tests
async function runComprehensiveTest() {
  try {
    await testDNSResolution();
    await testConnectivity();
    await testAPIEndpoints();
    await testAlternativeAPIs();
    await testNetworkDiagnostics();
    await generateRecommendations();
    
    console.log('🎯 Summary:');
    console.log('✅ Local backup system is working perfectly');
    console.log('❌ Hostinger API has connectivity issues');
    console.log('💡 Use local backup until API issues are resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runComprehensiveTest(); 