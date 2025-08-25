#!/usr/bin/env node

/**
 * FTP Upload to Hostinger
 * 
 * Upload files to Hostinger using FTP
 */

import fs from 'fs';
import path from 'path';
import ftp from 'basic-ftp';

const HOSTINGER_FTP_CONFIG = {
  host: 'YOUR_HOSTINGER_FTP_HOST', // e.g., ftp.yourdomain.com
  user: 'YOUR_FTP_USERNAME',
  password: 'YOUR_FTP_PASSWORD',
  secure: true // Use FTPS
};

async function uploadViaFTP() {
  console.log('🚀 Uploading to Hostinger via FTP...');
  
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    await client.access(HOSTINGER_FTP_CONFIG);
    console.log('✅ Connected to Hostinger FTP');
    
    // Upload all files from deployment package
    await client.uploadFromDir('/Users/mtaasisi/Desktop/LATS CHANCE copy/hostinger-deploy', '/public_html');
    console.log('✅ All files uploaded successfully!');
    
  } catch (error) {
    console.error('❌ FTP upload failed:', error.message);
  } finally {
    client.close();
  }
}

// Run upload
uploadViaFTP().catch(console.error);
