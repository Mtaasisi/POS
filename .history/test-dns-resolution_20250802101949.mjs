#!/usr/bin/env node

/**
 * DNS Resolution Test for Hostinger API
 * This script tests DNS resolution for various Hostinger API endpoints
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

const HOSTINGER_ENDPOINTS = [
  'api.hostinger.com',
  'api.hostinger.com/v1',
  'api.hostinger.com/v2',
  'api.hostinger.com/api'
];

async function testDNSResolution(hostname) {
  try {
    console.log(`🔍 Testing DNS resolution for: ${hostname}`);
    
    // Test DNS resolution
    const { stdout } = await execAsync(`nslookup ${hostname}`);
    console.log('✅ DNS resolution successful');
    console.log(stdout);
    
    // Test HTTP connectivity
    try {
      const response = await fetch(`https://${hostname}`, {
        method: 'HEAD',
        timeout: 10000
      });
      console.log(`✅ HTTP connectivity: ${response.status}`);
    } catch (error) {
      console.log(`❌ HTTP connectivity failed: ${error.message}`);
    }
    
    console.log('');
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    console.log('');
  }
}

async function testHostingerAPI() {
  console.log('🌐 Hostinger API DNS Resolution Test');
  console.log('=====================================\n');
  
  for (const endpoint of HOSTINGER_ENDPOINTS) {
    await testDNSResolution(endpoint);
  }
  
  console.log('📋 Summary:');
  console.log('If DNS resolution fails, try these solutions:');
  console.log('1. Check your internet connection');
  console.log('2. Try using a different DNS server:');
  console.log('   - Google DNS: 8.8.8.8, 8.8.4.4');
  console.log('   - Cloudflare DNS: 1.1.1.1, 1.0.0.1');
  console.log('3. Check if api.hostinger.com is blocked by firewall');
  console.log('4. Try using a VPN if the domain is blocked in your region');
  console.log('\n💡 Local backups will still work even if Hostinger API is unavailable.');
}

// Run the test
testHostingerAPI().catch(console.error); 