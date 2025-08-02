#!/usr/bin/env node

/**
 * Test Hostinger API connection and upload
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
async function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, 'backup.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
}

async function testHostingerConnection() {
  console.log('🧪 Testing Hostinger API connection...');
  
  try {
    const envVars = await loadEnvVars();
    
    if (!envVars.HOSTINGER_API_TOKEN) {
      console.error('❌ Hostinger API token not found in backup.env');
      return;
    }
    
    console.log('✅ Hostinger API token loaded');
    console.log(`🔗 API URL: ${envVars.HOSTINGER_API_URL || 'https://api.hostinger.com/v1'}`);
    
    // Test API connection
    const response = await fetch(`${envVars.HOSTINGER_API_URL || 'https://api.hostinger.com/v1'}/domains`, {
      headers: {
        'Authorization': `Bearer ${envVars.HOSTINGER_API_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Hostinger API connection successful');
      
      // Test file upload
      console.log('📤 Testing file upload...');
      
      // Create a test file
      const testContent = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Backup system test file'
      };
      
      const testFilePath = path.join(__dirname, 'test-upload.json');
      await fs.writeFile(testFilePath, JSON.stringify(testContent, null, 2));
      
      // Upload test file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('path', '/backups/supabase/test-upload.json');
      
      const uploadResponse = await fetch(`${envVars.HOSTINGER_API_URL || 'https://api.hostinger.com/v1'}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envVars.HOSTINGER_API_TOKEN}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        console.log('✅ File upload successful');
        const result = await uploadResponse.json();
        console.log('📋 Upload result:', result);
      } else {
        const errorText = await uploadResponse.text();
        console.log('❌ File upload failed:', uploadResponse.status, errorText);
      }
      
      // Clean up test file
      await fs.unlink(testFilePath);
      
    } else {
      const errorText = await response.text();
      console.log('❌ Hostinger API connection failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHostingerConnection(); 